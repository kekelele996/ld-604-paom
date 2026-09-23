import type { FaultReport } from "../models/FaultReport";
import type { RepairTicket } from "../models/RepairTicket";
import { isMoreSevere, type FaultSeverity } from "../constants/FaultSeverity";
import {
  SEVERITY_TO_TICKET_PRIORITY,
  TicketPriorityRank,
  type TicketPriority
} from "../constants/TicketPriority";
import { PRIORITY_LOCKED_TICKET_STATUSES } from "../repositories/RepairTicketRepository";

export interface EscalationPlan {
  escalate: boolean;
  targetSeverity: FaultSeverity;
  previousSeverity: string;
  bumpedTicketIds: number[];
}

// 严重度只升不降：只有新报修比原故障更严重时才升级。
export const shouldEscalate = (incomingSeverity: string, currentSeverity: string): boolean =>
  isMoreSevere(incomingSeverity, currentSeverity);

// 未复电工单优先级只升不降；已复电或已关闭工单保持原样。
export const shouldBumpTicketPriority = (ticket: RepairTicket, target: TicketPriority): boolean => {
  if (PRIORITY_LOCKED_TICKET_STATUSES.includes(ticket.status as never)) return false;
  if (ticket.restored_at) return false;
  return TicketPriorityRank[target] > TicketPriorityRank[ticket.priority as TicketPriority];
};

export const buildEscalationPlan = (
  target: FaultReport,
  incomingSeverity: FaultSeverity,
  tickets: RepairTicket[]
): EscalationPlan => {
  const escalate = shouldEscalate(incomingSeverity, target.severity);
  const targetPriority = SEVERITY_TO_TICKET_PRIORITY[incomingSeverity];
  const bumpedTicketIds = escalate
    ? tickets.filter((ticket) => shouldBumpTicketPriority(ticket, targetPriority)).map((ticket) => ticket.id)
    : [];
  return {
    escalate,
    targetSeverity: escalate ? incomingSeverity : (target.severity as FaultSeverity),
    previousSeverity: escalate ? target.severity : target.previous_severity,
    bumpedTicketIds
  };
};

// 应用合并结果：累计合并次数、按需升级等级与未复电工单优先级。
// 调用方负责提前快照，失败时由调用方整体回滚。
export const applyMerge = (
  target: FaultReport,
  mergedRow: FaultReport,
  tickets: RepairTicket[],
  plan: EscalationPlan
): number[] => {
  target.merged_count += 1;
  if (plan.escalate) {
    target.severity = plan.targetSeverity;
    target.previous_severity = plan.previousSeverity;
  }
  const targetPriority = SEVERITY_TO_TICKET_PRIORITY[plan.targetSeverity];
  for (const ticket of tickets) {
    if (plan.bumpedTicketIds.includes(ticket.id)) {
      ticket.priority = targetPriority;
    }
  }
  return plan.bumpedTicketIds;
};
