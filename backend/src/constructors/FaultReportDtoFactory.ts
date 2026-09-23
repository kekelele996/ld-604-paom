import type { FaultReport } from "../models/FaultReport";
import type { RepairTicket } from "../models/RepairTicket";

export interface FaultReportListItemDto {
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
  merged_into_id: number | null;
  merged_count: number;
  severity_before: string | null;
  severity_upgraded_to: string | null;
}

export interface FaultReportDetailDto extends FaultReportListItemDto {
  merged_reports: FaultReportListItemDto[];
  tickets: RepairTicket[];
}

const toListItem = (row: FaultReport): FaultReportListItemDto => ({
  id: row.id,
  reporter_name: row.reporter_name,
  phone: row.phone,
  asset_id: row.asset_id,
  fault_type: row.fault_type,
  address_desc: row.address_desc,
  severity: row.severity,
  report_channel: row.report_channel,
  status: row.status,
  reported_at: row.reported_at,
  merged_into_id: row.merged_into_id,
  merged_count: row.merged_count,
  severity_before: row.severity_before,
  severity_upgraded_to: row.severity_upgraded_to
});

// 默认响应对象（构造器/工厂，供页面、测试复用）
export const createFaultReportDto = (overrides: Partial<FaultReportDetailDto> = {}): FaultReportDetailDto => ({
  id: 1,
  reporter_name: "王建国",
  phone: "13800000001",
  asset_id: 1,
  fault_type: "OUTAGE",
  address_desc: "滨海大道整片停电",
  severity: "CRITICAL",
  report_channel: "HOTLINE",
  status: "OPEN",
  reported_at: new Date().toISOString(),
  merged_into_id: null,
  merged_count: 0,
  severity_before: null,
  severity_upgraded_to: null,
  merged_reports: [],
  tickets: [],
  ...overrides
});

export const buildFaultReportListItem = (row: FaultReport): FaultReportListItemDto => toListItem(row);

export const buildFaultReportList = (rows: FaultReport[]): FaultReportListItemDto[] =>
  rows.map(toListItem);

export const buildFaultReportDetail = (
  row: FaultReport,
  mergedReports: FaultReport[],
  tickets: RepairTicket[]
): FaultReportDetailDto => ({
  ...toListItem(row),
  merged_reports: mergedReports.map(toListItem),
  tickets: tickets.map((ticket) => ({ ...ticket, restored_at: ticket.restored_at ?? null }))
});
