import type { FaultType } from "../constants/FaultType";
import type { Severity } from "../constants/Severity";

export interface FaultReportPayload {
  reporter_name?: unknown;
  phone?: unknown;
  asset_id?: unknown;
  fault_type?: unknown;
  address_desc?: unknown;
  severity?: unknown;
  report_channel?: unknown;
  // 客户端幂等键：并发提交同一报修（相同 request_id）只合并一次
  client_request_id?: unknown;
}

export interface NormalizedFaultReport {
  reporter_name: string;
  phone: string;
  asset_id: number;
  fault_type: FaultType;
  address_desc: string;
  severity: Severity;
  report_channel: string;
  client_request_id?: string;
}
