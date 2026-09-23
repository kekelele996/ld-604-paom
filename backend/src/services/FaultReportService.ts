import { gridAssetRepository } from "../repositories/GridAssetRepository";
import { faultReportRepository } from "../repositories/FaultReportRepository";
import { repairTicketRepository, isTicketLocked } from "../repositories/RepairTicketRepository";
import { runInTransaction } from "../repositories/transactionRunner";
import { idempotencyStore, type IdempotentCreateResult } from "../repositories/idempotencyStore";
import {
  buildFaultReportDetail,
  buildFaultReportList,
  type FaultReportDetailDto,
  type FaultReportListItemDto
} from "../constructors/FaultReportDtoFactory";
import { buildFaultReportEntity } from "../constructors/FaultReportEntityFactory";
import type { FaultReportPayload } from "../types/FaultReportPayload";
import { normalizeFaultReportPayload } from "../utils/faultReportValidator";
import { ERROR_MESSAGES } from "../constants/errorMessages";
import { isMoreSevere, maxSeverity } from "../constants/Severity";
import { isMorePriority, priorityFromSeverity } from "../constants/TicketPriority";
import { renderFaultMergeLog, renderSeverityUpgradeLog } from "../constants/logTemplates";
import { notFoundError } from "../utils/ServiceError";
import type { FaultReport } from "../models/FaultReport";
import type { RepairTicket } from "../models/RepairTicket";

export interface CreateFaultReportOutcome extends IdempotentCreateResult {
  reusedIdempotencyKey?: boolean;
}

// 测试钩子：置为 true 后下一次合并在计数更新后抛错，用于验证事务回滚
let failNextMerge = false;
export const __setFailNextMerge = (value: boolean): void => {
  failNextMerge = value;
};

const toDetail = (row: FaultReport): FaultReportDetailDto =>
  buildFaultReportDetail(
    row,
    faultReportRepository.findByMergedIntoId(row.id),
    repairTicketRepository.findByFaultReportId(row.id)
  );

const applySeverityEscalation = (
  target: FaultReport,
  incomingSeverity: string
): { escalated: boolean; upgradedTickets: RepairTicket[]; skippedTickets: RepairTicket[] } => {
  const upgradedTickets: RepairTicket[] = [];
  const skippedTickets: RepairTicket[] = [];
  if (!isMoreSevere(incomingSeverity, target.severity)) {
    return { escalated: false, upgradedTickets, skippedTickets };
  }

  const previousSeverity = target.severity;
  // 故障等级只升不降：首次升级记录初始等级，重复升级保留最早的升级前等级
  faultReportRepository.update(target.id, {
    severity: maxSeverity(target.severity, incomingSeverity),
    severity_before: target.severity_before ?? previousSeverity,
    severity_upgraded_to: maxSeverity(target.severity, incomingSeverity)
  });

  const nextPriority = priorityFromSeverity(incomingSeverity);
  for (const ticket of repairTicketRepository.findUpgradableByFaultReportId(target.id)) {
    // 未复电工单优先级只升不降；已复电/已关闭工单保持原样
    if (isMorePriority(nextPriority, ticket.priority)) {
      repairTicketRepository.update(ticket.id, {
        priority: nextPriority,
        priority_before: ticket.priority_before ?? ticket.priority,
        upgraded_from_severity: previousSeverity as RepairTicket["upgraded_from_severity"]
      });
      upgradedTickets.push(ticket);
    }
  }
  for (const ticket of repairTicketRepository.findByFaultReportId(target.id)) {
    if (isTicketLocked(ticket.status)) skippedTickets.push(ticket);
  }

  if (upgradedTickets.length > 0 || skippedTickets.length > 0) {
    console.info(
      renderSeverityUpgradeLog({
        faultId: target.id,
        fromSeverity: previousSeverity,
        toSeverity: incomingSeverity,
        upgradedTicketIds: upgradedTickets.map((ticket) => ticket.id),
        skippedTicketIds: skippedTickets.map((ticket) => ticket.id)
      })
    );
  }
  return { escalated: true, upgradedTickets, skippedTickets };
};

export const faultReportService = {
  list(query?: { asset_id?: number; status?: string }): FaultReportListItemDto[] {
    return buildFaultReportList(faultReportRepository.findAll(query));
  },

  detail(id: number): FaultReportDetailDto {
    const row = faultReportRepository.findById(id);
    if (!row) throw notFoundError(ERROR_MESSAGES.FAULT_NOT_FOUND);
    return toDetail(row);
  },

  // 并发提交同一报修（相同 client_request_id）只合并一次；
  // 合并失败时事务回滚，故障、工单和计数全部不变
  async create(rawPayload: FaultReportPayload): Promise<CreateFaultReportOutcome> {
    const payload = normalizeFaultReportPayload(rawPayload);

    if (payload.client_request_id) {
      const cached = idempotencyStore.get(payload.client_request_id);
      if (cached) {
        return Promise.resolve({ ...cached, reusedIdempotencyKey: true });
      }
    }

    return runInTransaction(() => {
      // 幂等键二次检查在串行事务内完成：并发请求只有第一个会执行合并
      if (payload.client_request_id) {
        const cached = idempotencyStore.get(payload.client_request_id);
        if (cached) {
          return { ...cached, reusedIdempotencyKey: true };
        }
      }

      if (!gridAssetRepository.findById(payload.asset_id)) {
        throw notFoundError(ERROR_MESSAGES.ASSET_NOT_FOUND);
      }

      const reportedAt = new Date();
      const target = faultReportRepository.findMergeTarget(payload.asset_id, reportedAt);

      if (!target) {
        // 30 分钟窗口内没有未关闭故障：正常建工单的前提是先有主故障，这里只登记主故障
        const created = faultReportRepository.insert(
          buildFaultReportEntity(faultReportRepository.nextId(), payload, reportedAt.toISOString(), "OPEN", null)
        );
        const response = toDetail(created);
        const result: IdempotentCreateResult = { response, merged: false, escalated: false };
        if (payload.client_request_id) idempotencyStore.set(payload.client_request_id, result);
        return result;
      }

      // 命中重复报修：并入原故障，不另建工单
      const merged = faultReportRepository.insert(
        buildFaultReportEntity(
          faultReportRepository.nextId(),
          payload,
          reportedAt.toISOString(),
          "MERGED",
          target.id
        )
      );
      faultReportRepository.update(target.id, { merged_count: target.merged_count + 1 });

      if (failNextMerge) {
        failNextMerge = false;
        throw new Error(ERROR_MESSAGES.MERGE_FAILED);
      }

      const escalation = applySeverityEscalation(target, payload.severity);

      console.info(
        renderFaultMergeLog({
          newReportId: merged.id,
          targetFaultId: target.id,
          assetId: payload.asset_id,
          mergedCount: target.merged_count + 1
        })
      );

      const refreshed = faultReportRepository.findById(target.id);
      if (!refreshed) throw new Error(ERROR_MESSAGES.MERGE_FAILED);
      const response = toDetail(refreshed);
      const result: IdempotentCreateResult = {
        response,
        merged: true,
        escalated: escalation.escalated
      };
      if (payload.client_request_id) idempotencyStore.set(payload.client_request_id, result);
      return result;
    });
  }
};
