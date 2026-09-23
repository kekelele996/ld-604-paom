import { tables, type DataSnapshot } from "./tables";
import type { RepairTicket } from "../models/RepairTicket";

// 已复电（RESTORED）或已关闭（CLOSED）工单在严重度升级时优先级保持原样。
export const PRIORITY_LOCKED_TICKET_STATUSES = ["RESTORED", "CLOSED"] as const;

export const repairTicketRepository = {
  findAll: (): RepairTicket[] => tables.repairTicket,

  findByFaultReportId(faultReportId: number): RepairTicket[] {
    return tables.repairTicket.filter((row) => row.fault_report_id === faultReportId);
  },

  updatePriority(id: number, priority: string): void {
    const row = tables.repairTicket.find((ticket) => ticket.id === id);
    if (row) row.priority = priority;
  },

  snapshot: (): DataSnapshot["repairTicket"] => tables.repairTicket.map((row) => ({ ...row })),

  restore(rows: DataSnapshot["repairTicket"]): void {
    tables.repairTicket = rows;
  },

  save: (row: unknown) => row
};
