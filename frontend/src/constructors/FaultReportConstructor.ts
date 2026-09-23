import type { FaultReport, FaultReportFormPayload, FaultReportView } from "../types/FaultReport";

export const createDefaultFaultReport = (overrides: Partial<FaultReport> = {}): FaultReport => ({
  id: 0,
  reporter_name: "",
  phone: "",
  asset_id: 0,
  fault_type: "OUTAGE",
  address_desc: "",
  severity: "MEDIUM",
  previous_severity: "",
  report_channel: "HOTLINE",
  status: "OPEN",
  reported_at: new Date().toISOString(),
  merged_count: 0,
  merged_into_id: null,
  ...overrides
});

// 登记表单默认对象：提交时携带 client_token，保证并发双击只合并一次。
export const createFaultReportForm = (assetId: number): FaultReportFormPayload => ({
  reporter_name: "",
  phone: "",
  asset_id: assetId,
  fault_type: "OUTAGE",
  address_desc: "",
  severity: "MEDIUM",
  report_channel: "HOTLINE",
  client_token: `web-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
});

export const createFaultReportResponse = createDefaultFaultReport;

// 离线 mock 兜底时使用：与后端 FaultReportView 结构保持一致。
export const createFaultReportView = (
  row: Partial<FaultReportView> = {}
): FaultReportView => ({
  ...createDefaultFaultReport(),
  asset_code: "",
  location_desc: "",
  escalated: false,
  linked_ticket_ids: [],
  ...row
});
