import type { Severity } from "../constants/Severity";

export interface RepairTicket {
  id: number;
  fault_report_id: number;
  team_id: number;
  dispatcher_id: number;
  priority: string;
  status: string;
  assigned_at: string;
  restored_at: string | null;
  // 随故障严重度升级而同步抬升的优先级；未复电工单只升不降
  priority_before: string | null;
  upgraded_from_severity: Severity | null;
}
