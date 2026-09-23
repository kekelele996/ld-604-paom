export interface FaultReportPayload {
  reporter_name?: unknown;
  phone?: unknown;
  asset_id?: unknown;
  fault_type?: unknown;
  address_desc?: unknown;
  severity?: unknown;
  report_channel?: unknown;
  reported_at?: unknown;
  status?: unknown;
  // 客户端幂等令牌：并发提交同一报修只合并一次。
  client_token?: unknown;
  [key: string]: unknown;
}
