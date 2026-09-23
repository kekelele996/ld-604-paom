import type { FaultReport } from "../models/FaultReport";
import type { NormalizedFaultReport } from "../types/FaultReportPayload";
import type { FaultStatus } from "../constants/FaultStatus";

// 新建报修实体：主故障为 OPEN，被并入故障为 MERGED 且不计数；
// merged_count 为累计并入次数（不含故障自身）
export const buildFaultReportEntity = (
  id: number,
  input: NormalizedFaultReport,
  reportedAt: string,
  status: FaultStatus,
  mergedIntoId: number | null
): FaultReport => ({
  id,
  reporter_name: input.reporter_name,
  phone: input.phone,
  asset_id: input.asset_id,
  fault_type: input.fault_type,
  address_desc: input.address_desc,
  severity: input.severity,
  report_channel: input.report_channel,
  status,
  reported_at: reportedAt,
  merged_into_id: mergedIntoId,
  merged_count: 0,
  severity_before: null,
  severity_upgraded_to: null
});
