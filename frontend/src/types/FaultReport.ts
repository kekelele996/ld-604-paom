export interface FaultReport {
  id: number;
  reporter_name: string;
  phone: string;
  asset_id: number;
  fault_type: string;
  address_desc: string;
  severity: string;
  report_channel: string;
  status: string;
  reported_at: string;
  merged_count: number;
  previous_severity: string;
  merged_into_id: number | null;
}

// 故障页接口视图：按资产带出合并次数、升级前后等级和已关联工单。
export interface FaultReportView extends FaultReport {
  asset_code: string;
  location_desc: string;
  escalated: boolean;
  linked_ticket_ids: number[];
}

export interface FaultReportFormPayload {
  reporter_name: string;
  phone: string;
  asset_id: number;
  fault_type: string;
  address_desc: string;
  severity: string;
  report_channel: string;
  client_token?: string;
}

export interface FaultReportSaveResult {
  merged: boolean;
  merge_target_id?: number;
  merged_report_id?: number;
  escalated: boolean;
  bumped_ticket_ids: number[];
  fault: FaultReportView;
}
