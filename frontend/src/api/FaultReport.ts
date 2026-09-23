import { mockData } from "../mocks/seedData";
import type { CreateFaultReportPayload, FaultReport, FaultReportDetail } from "../types/FaultReport";

const endpoint = "/api/fault-report";

const parseError = async (res: Response): Promise<Error> => {
  let message = `请求失败（${res.status}）`;
  try {
    const body = await res.json();
    if (body?.message) message = body.message;
  } catch {
    // 忽略非 JSON 错误体
  }
  return new Error(message);
};

export interface FaultReportQuery {
  asset_id?: number;
  status?: string;
}

export async function listFaultReport(query: FaultReportQuery = {}): Promise<FaultReport[]> {
  const params = new URLSearchParams();
  if (query.asset_id !== undefined) params.set("asset_id", String(query.asset_id));
  if (query.status) params.set("status", query.status);
  const suffix = params.toString() ? `?${params.toString()}` : "";
  try {
    const res = await fetch(`${endpoint}${suffix}`);
    if (res.ok) return (await res.json()) as FaultReport[];
  } catch {
    // Local mock fallback keeps the UI available during offline review.
  }
  let rows = [...(mockData.faultReport as unknown as FaultReport[])];
  if (query.asset_id !== undefined) rows = rows.filter((row) => row.asset_id === query.asset_id);
  if (query.status) rows = rows.filter((row) => row.status === query.status);
  return rows;
}

export async function getFaultReportDetail(id: number): Promise<FaultReportDetail> {
  try {
    const res = await fetch(`${endpoint}/${id}`);
    if (res.ok) return (await res.json()) as FaultReportDetail;
  } catch {
    // 离线回退：由列表 + 工单 mock 组装详情
  }
  const main = mockData.faultReport.find((row) => row.id === id);
  const merged = mockData.faultReport.filter((row) => row.merged_into_id === id);
  const tickets = mockData.repairTicket.filter((row) => row.fault_report_id === id);
  return {
    ...(main as unknown as FaultReport),
    merged_reports: merged as unknown as FaultReport[],
    tickets: tickets as unknown as FaultReportDetail["tickets"]
  };
}

export interface CreateFaultReportResult {
  detail: FaultReportDetail;
  merged: boolean;
  escalated: boolean;
  /** 命中幂等（同一报修重复/并发提交） */
  reused: boolean;
}

// 登记报修：由后端在同一资产 30 分钟窗口内决定合并或新建；
// 带 client_request_id 幂等键，并发提交同一报修只合并一次
export async function saveFaultReport(payload: CreateFaultReportPayload): Promise<CreateFaultReportResult> {
  const requestId = payload.client_request_id ?? crypto.randomUUID();
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-idempotency-key": requestId
    },
    body: JSON.stringify({ ...payload, client_request_id: requestId })
  });
  if (!res.ok) throw await parseError(res);
  const body = (await res.json()) as {
    merged: boolean;
    escalated: boolean;
    reused: boolean;
    detail: FaultReportDetail;
  };
  return {
    detail: body.detail,
    merged: body.merged,
    escalated: body.escalated,
    reused: body.reused || res.status === 200
  };
}
