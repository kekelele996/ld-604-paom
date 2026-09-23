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
  // 报修时间（ISO），用于 30 分钟重复合并窗口判定。
  reported_at: string;
  // 累计被并入本故障的重复报修次数（仅未关闭主故障累计）。
  merged_count: number;
  // 升级前等级；未发生过升级时为空串。
  previous_severity: string;
  // 该报修被并入的主故障 id；主故障自身为空。
  merged_into_id: number | null;
}
