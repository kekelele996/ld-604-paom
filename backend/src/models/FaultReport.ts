import type { FaultStatus } from "../constants/FaultStatus";

export interface FaultReport {
  id: number;
  reporter_name: string;
  phone: string;
  asset_id: number;
  fault_type: string;
  address_desc: string;
  severity: string;
  report_channel: string;
  status: FaultStatus | string;
  reported_at: string;
  // 重复合并：本故障并入的主故障 id；未合并为 null
  merged_into_id: number | null;
  // 主故障累计被并入的报修次数（主故障自身为 0）
  merged_count: number;
  // 严重度升级轨迹：[升级前等级, 升级后等级]
  severity_before: string | null;
  severity_upgraded_to: string | null;
}
