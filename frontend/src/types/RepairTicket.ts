export interface RepairTicket {
  id: number;
  fault_report_id: number;
  team_id: number;
  dispatcher_id: number;
  priority: string;
  status: string;
  assigned_at: string;
  restored_at: string | null;
  /** 随故障升级抬升前的优先级 */
  priority_before: string | null;
  upgraded_from_severity: string | null;
}
