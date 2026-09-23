import { faultReportRepository } from "../repositories/FaultReportRepository";
import { repairTicketRepository } from "../repositories/RepairTicketRepository";
import { gridAssetRepository } from "../repositories/GridAssetRepository";
import type { DataSnapshot } from "../repositories/tables";
import type { FaultReport } from "../models/FaultReport";
import type { FaultReportPayload } from "../types/FaultReportPayload";
import { isKnownFaultSeverity, type FaultSeverity as Severity } from "../constants/FaultSeverity";
import { FaultStatus } from "../constants/FaultStatus";
import { ERROR_MESSAGES } from "../constants/errorMessages";
import { LOG_TEMPLATES } from "../constants/logTemplates";
import { IDEMPOTENT_TTL_MS, FINGERPRINT_TTL_MS } from "../config/mergePolicy";
import { toAuditTarget } from "../utils/formatters";
import {
  MergeConflictServiceError,
  ValidationServiceError
} from "../utils/serviceError";
import { applyMerge, buildEscalationPlan } from "./faultMergeEngine";
import {
  createFaultReportDto,
  createFaultReportView,
  type FaultReportView
} from "../constructors/FaultReportDtoFactory";

interface NormalizedInput {
  reporter_name: string;
  phone: string;
  asset_id: number;
  fault_type: string;
  address_desc: string;
  severity: Severity;
  report_channel: string;
  reportedAtMs: number;
  client_token: string;
}

export interface FaultReportSaveResult {
  merged: boolean;
  merge_target_id?: number;
  merged_report_id?: number;
  escalated: boolean;
  bumped_ticket_ids: number[];
  fault: FaultReportView;
}

interface DedupEntry {
  expiresAt: number;
  result: FaultReportSaveResult;
}

// 同一资产的报修创建按资产串行化，保证并发提交时窗口判定与合并计数不串单。
const assetLocks = new Map<number, Promise<void>>();

const withAssetLock = async <T>(assetId: number, task: () => Promise<T>): Promise<T> => {
  const previous = assetLocks.get(assetId) ?? Promise.resolve();
  let release: () => void = () => undefined;
  const tail = new Promise<void>((resolve) => {
    release = resolve;
  });
  assetLocks.set(assetId, previous.then(() => tail, () => tail));
  await previous.catch(() => undefined);
  try {
    return await task();
  } finally {
    release();
  }
};

// 并发提交同一报修只合并一次：client_token 精确幂等 + 内容指纹时间分桶幂等。
const dedupStore = new Map<string, DedupEntry>();

const readDedup = (key: string): FaultReportSaveResult | undefined => {
  const entry = dedupStore.get(key);
  if (!entry) return undefined;
  if (entry.expiresAt <= Date.now()) {
    dedupStore.delete(key);
    return undefined;
  }
  return entry.result;
};

const writeDedup = (key: string, result: FaultReportSaveResult, ttlMs: number): void => {
  dedupStore.set(key, { expiresAt: Date.now() + ttlMs, result });
};

const normalizePayload = (payload: FaultReportPayload): NormalizedInput => {
  const reporter_name =
    typeof payload.reporter_name === "string" ? payload.reporter_name.trim() : "";
  const phone = typeof payload.phone === "string" ? payload.phone.trim() : "";
  const asset_id = Number(payload.asset_id);
  const fault_type = typeof payload.fault_type === "string" ? payload.fault_type.trim() : "";
  const severityRaw = typeof payload.severity === "string" ? payload.severity.trim() : "";
  if (!reporter_name || !phone || !Number.isInteger(asset_id) || !fault_type || !severityRaw) {
    throw new ValidationServiceError(ERROR_MESSAGES.FAULT_REPORT_FIELD_REQUIRED);
  }
  if (!isKnownFaultSeverity(severityRaw)) {
    throw new ValidationServiceError(ERROR_MESSAGES.FAULT_SEVERITY_UNKNOWN);
  }
  if (!gridAssetRepository.findAll().some((asset) => asset.id === asset_id)) {
    throw new ValidationServiceError(ERROR_MESSAGES.ASSET_NOT_FOUND);
  }
  const reportedAtMs = payload.reported_at
    ? new Date(String(payload.reported_at)).getTime()
    : Date.now();
  if (!Number.isFinite(reportedAtMs)) {
    throw new ValidationServiceError(ERROR_MESSAGES.VALIDATION_FAILED);
  }
  return {
    reporter_name,
    phone,
    asset_id,
    fault_type,
    address_desc: typeof payload.address_desc === "string" ? payload.address_desc.trim() : "",
    severity: severityRaw,
    report_channel:
      typeof payload.report_channel === "string" && payload.report_channel.trim()
        ? payload.report_channel.trim()
        : "HOTLINE",
    reportedAtMs,
    client_token: typeof payload.client_token === "string" ? payload.client_token.trim() : ""
  };
};

const toView = (row: FaultReport): FaultReportView =>
  createFaultReportView(row, gridAssetRepository.findAll(), repairTicketRepository.findAll());

const fingerprintContent = (input: NormalizedInput): string =>
  [
    input.asset_id,
    input.reporter_name,
    input.phone,
    input.fault_type,
    input.severity,
    input.address_desc
  ].join("|");

const fingerprintKeyAt = (input: NormalizedInput, bucket: number): string =>
  `fp:${input.asset_id}:${fingerprintContent(input)}:${bucket}`;

export const faultReportService = {
  list(): FaultReportView[] {
    return faultReportRepository
      .findAll()
      .slice()
      .sort(
        (a, b) =>
          new Date(b.reported_at).getTime() - new Date(a.reported_at).getTime() || b.id - a.id
      )
      .map(toView);
  },

  async create(rawPayload: FaultReportPayload): Promise<FaultReportSaveResult> {
    const input = normalizePayload(rawPayload);

    return withAssetLock(input.asset_id, async () => {
      // 1) 幂等判定在锁内完成：并发提交同一报修，第二单直接复用首单结果，不重复合并。
      const tokenKey = input.client_token
        ? `token:${input.asset_id}:${input.client_token}`
        : "";
      const bucket = Math.floor(input.reportedAtMs / FINGERPRINT_TTL_MS);
      const fpKey = fingerprintKeyAt(input, bucket);
      const fpPreviousKey = fingerprintKeyAt(input, bucket - 1);
      const cached =
        (tokenKey && readDedup(tokenKey)) || readDedup(fpKey) || readDedup(fpPreviousKey);
      if (cached) return cached;

      // 2) 事务化合并：先快照故障与工单；任何失败整体回滚，故障、工单与计数全部不变。
      const snapshot: DataSnapshot = {
        faultReport: faultReportRepository.snapshot(),
        repairTicket: repairTicketRepository.snapshot()
      };
      try {
        const target = faultReportRepository.findMergeTarget(
          input.asset_id,
          input.reportedAtMs
        );

        // 合并时不另建工单：新报修仅作为 MERGED 记录并入原故障。
        const mergedRow = createFaultReportDto({
          id: faultReportRepository.nextId(),
          reporter_name: input.reporter_name,
          phone: input.phone,
          asset_id: input.asset_id,
          fault_type: input.fault_type,
          address_desc: input.address_desc,
          severity: input.severity,
          report_channel: input.report_channel,
          status: target ? FaultStatus.MERGED : FaultStatus.OPEN,
          reported_at: new Date(input.reportedAtMs).toISOString(),
          merged_count: 0,
          previous_severity: "",
          merged_into_id: target ? target.id : null
        });
        faultReportRepository.insert(mergedRow);

        let escalated = false;
        let bumpedTicketIds: number[] = [];

        if (target) {
          // 测试注入：FAULT_MERGE_INJECT_FAILURE=1 时下一次合并写入抛错（一次性，随后自动复位），验证整体回滚。
          if (process.env.FAULT_MERGE_INJECT_FAILURE === "1") {
            delete process.env.FAULT_MERGE_INJECT_FAILURE;
            throw new Error("injected merge write failure");
          }
          // 原故障等级与未复电工单优先级只升不降；已复电/已关闭工单保持原样。
          const tickets = repairTicketRepository.findByFaultReportId(target.id);
          const plan = buildEscalationPlan(target, input.severity, tickets);
          bumpedTicketIds = applyMerge(target, mergedRow, tickets, plan);
          escalated = plan.escalate;

          console.info(
            LOG_TEMPLATES.FaultReport[4],
            toAuditTarget("FaultReport", mergedRow.id),
            "->",
            toAuditTarget("FaultReport", target.id),
            "merged_count=",
            target.merged_count
          );
          if (escalated) {
            console.info(
              LOG_TEMPLATES.FaultReport[5],
              toAuditTarget("FaultReport", target.id),
              plan.previousSeverity,
              "->",
              target.severity
            );
          }
          for (const ticketId of bumpedTicketIds) {
            console.info(
              LOG_TEMPLATES.RepairTicket[4],
              toAuditTarget("RepairTicket", ticketId),
              "->",
              repairTicketRepository.findAll().find((ticket) => ticket.id === ticketId)?.priority
            );
          }
        } else {
          console.info(
            LOG_TEMPLATES.FaultReport[0],
            toAuditTarget("FaultReport", mergedRow.id),
            "severity=",
            mergedRow.severity
          );
        }

        const result: FaultReportSaveResult = {
          merged: Boolean(target),
          merge_target_id: target?.id,
          merged_report_id: mergedRow.id,
          escalated,
          bumped_ticket_ids: bumpedTicketIds,
          fault: toView(mergedRow)
        };
        writeDedup(fpKey, result, FINGERPRINT_TTL_MS);
        if (tokenKey) writeDedup(tokenKey, result, IDEMPOTENT_TTL_MS);

        return result;
      } catch (error) {
        // 合并失败：故障、工单和计数全部恢复到提交前。
        faultReportRepository.restore(snapshot.faultReport);
        repairTicketRepository.restore(snapshot.repairTicket);
        if (error instanceof MergeConflictServiceError) throw error;
        throw new MergeConflictServiceError(ERROR_MESSAGES.FAULT_MERGE_CONFLICT);
      }
    });
  }
};
