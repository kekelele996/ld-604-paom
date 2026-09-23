import type { RepairTicket } from "../types/RepairTicket";

export const createDefaultRepairTicket = (overrides: Partial<RepairTicket> = {}): RepairTicket => ({
  id: 0,
  fault_report_id: 0,
  team_id: 0,
  dispatcher_id: 0,
  priority: "MEDIUM",
  status: "WAIT_DISPATCH",
  assigned_at: new Date().toISOString(),
  restored_at: null,
  priority_before: null,
  upgraded_from_severity: null,
  ...overrides
});

export const createRepairTicketForm = createDefaultRepairTicket;
export const createRepairTicketResponse = createDefaultRepairTicket;
