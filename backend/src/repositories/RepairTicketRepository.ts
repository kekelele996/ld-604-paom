import { TICKET_LOCKED_STATUSES } from "../constants/FaultStatus";
import { db } from "./inMemoryDb";
import type { RepairTicket } from "../models/RepairTicket";

export const isTicketLocked = (status: string): boolean =>
  (TICKET_LOCKED_STATUSES as readonly string[]).includes(status);

export const repairTicketRepository = {
  findAll(): RepairTicket[] {
    return db.repairTicket;
  },

  // 已关联到主故障的工单（被并入故障不生成工单）
  findByFaultReportId(faultReportId: number): RepairTicket[] {
    return db.repairTicket
      .filter((ticket) => ticket.fault_report_id === faultReportId)
      .sort((a, b) => a.id - b.id);
  },

  // 未复电、未关闭的工单才允许随故障升级抬优先级
  findUpgradableByFaultReportId(faultReportId: number): RepairTicket[] {
    return repairTicketRepository
      .findByFaultReportId(faultReportId)
      .filter((ticket) => !isTicketLocked(ticket.status));
  },

  nextId(): number {
    return db.repairTicket.reduce((max, row) => Math.max(max, row.id), 0) + 1;
  },

  insert(row: RepairTicket): RepairTicket {
    db.repairTicket.push(row);
    return row;
  },

  save(row: unknown): RepairTicket {
    const ticket = {
      restored_at: null,
      priority_before: null,
      upgraded_from_severity: null,
      ...(row as Partial<RepairTicket>)
    } as RepairTicket;
    if (ticket.id === undefined || ticket.id === null) ticket.id = repairTicketRepository.nextId();
    db.repairTicket.push(ticket);
    return ticket;
  },

  update(id: number, patch: Partial<RepairTicket>): RepairTicket {
    const row = db.repairTicket.find((item) => item.id === id);
    if (!row) throw new Error(`repair ticket ${id} not found`);
    Object.assign(row, patch);
    return row;
  }
};
