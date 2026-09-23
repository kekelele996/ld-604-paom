import type { CreateFaultReportPayload, FaultReport, FaultReportDetail } from "../types/FaultReport";

// 列表/响应默认结构：页面、store 不散写默认对象
export const createDefaultFaultReport = (overrides: Partial<FaultReport> = {}): FaultReport => ({
  id: 0,
  reporter_name: "",
  phone: "",
  asset_id: 0,
  fault_type: "OUTAGE",
  address_desc: "",
  severity: "MEDIUM",
  report_channel: "HOTLINE",
  status: "OPEN",
  reported_at: new Date().toISOString(),
  merged_into_id: null,
  merged_count: 0,
  severity_before: null,
  severity_upgraded_to: null,
  ...overrides
});

// 登记表单初始值
export const createFaultReportForm = (
  assetId: number,
  overrides: Partial<CreateFaultReportPayload> = {}
): CreateFaultReportPayload => ({
  reporter_name: "",
  phone: "",
  asset_id: assetId,
  fault_type: "OUTAGE",
  address_desc: "",
  severity: "MEDIUM",
  report_channel: "HOTLINE",
  ...overrides
});

export const createFaultReportResponse = createDefaultFaultReport;

export const createFaultReportDetail = (row: FaultReport): FaultReportDetail => ({
  ...createDefaultFaultReport(row),
  merged_reports: [],
  tickets: []
});
