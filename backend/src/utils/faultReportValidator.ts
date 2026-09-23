import { FaultType } from "../constants/FaultType";
import { Severity } from "../constants/Severity";
import type { FaultReportPayload, NormalizedFaultReport } from "../types/FaultReportPayload";
import { validationError } from "../utils/ServiceError";

const requireString = (payload: FaultReportPayload, key: keyof FaultReportPayload, label: string): string => {
  const value = payload[key];
  if (typeof value !== "string" || value.trim() === "") {
    throw validationError(`${label}不能为空`);
  }
  return value.trim();
};

export const normalizeFaultReportPayload = (
  payload: FaultReportPayload | null | undefined
): NormalizedFaultReport => {
  if (!payload || typeof payload !== "object") {
    throw validationError("报修内容不能为空");
  }

  const reporterName = requireString(payload, "reporter_name", "报修人姓名");
  const phone = requireString(payload, "phone", "联系电话");
  if (!/^[\d-]{6,20}$/.test(phone)) {
    throw validationError("联系电话格式不正确");
  }
  const addressDesc = requireString(payload, "address_desc", "故障地址描述");
  const reportChannel = requireString(payload, "report_channel", "报修渠道");

  const assetId = Number(payload.asset_id);
  if (!Number.isInteger(assetId) || assetId <= 0) {
    throw validationError("资产编号无效");
  }

  const faultType = payload.fault_type;
  if (typeof faultType !== "string" || !FaultType.includes(faultType as (typeof FaultType)[number])) {
    throw validationError("故障类型不在允许范围内");
  }

  const severity = payload.severity;
  if (typeof severity !== "string" || !Severity.includes(severity as (typeof Severity)[number])) {
    throw validationError("严重度等级不在允许范围内");
  }

  const clientRequestId = payload.client_request_id;
  const normalized: NormalizedFaultReport = {
    reporter_name: reporterName,
    phone,
    asset_id: assetId,
    fault_type: faultType as NormalizedFaultReport["fault_type"],
    address_desc: addressDesc,
    severity: severity as NormalizedFaultReport["severity"],
    report_channel: reportChannel
  };
  if (typeof clientRequestId === "string" && clientRequestId.trim() !== "") {
    normalized.client_request_id = clientRequestId.trim();
  }
  return normalized;
};
