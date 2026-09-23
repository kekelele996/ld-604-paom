import { mockData } from "../mocks/seedData";
import type {
  FaultReport,
  FaultReportFormPayload,
  FaultReportSaveResult,
  FaultReportView
} from "../types/FaultReport";
import type { RepairTicket } from "../types/RepairTicket";
import type { GridAsset } from "../types/GridAsset";
import { createFaultReportView } from "../constructors/FaultReportConstructor";

const endpoint = "/api/fault-report";

// 与后端 FaultReportDtoFactory.createFaultReportView 保持一致的离线拼装逻辑。
export const buildFaultReportView = (
  row: FaultReport,
  assets: GridAsset[] = mockData.gridAsset as unknown as GridAsset[],
  tickets: RepairTicket[] = mockData.repairTicket as unknown as RepairTicket[]
): FaultReportView => {
  const asset = assets.find((item) => item.id === row.asset_id);
  const rootId = row.merged_into_id ?? row.id;
  return createFaultReportView({
    ...row,
    asset_code: asset?.asset_code ?? `asset#${row.asset_id}`,
    location_desc: asset?.location_desc ?? "",
    escalated: Boolean(row.previous_severity && row.previous_severity !== row.severity),
    linked_ticket_ids: tickets
      .filter((ticket) => ticket.fault_report_id === rootId)
      .map((ticket) => ticket.id)
  });
};

export async function listFaultReport(): Promise<FaultReportView[]> {
  try {
    const res = await fetch(endpoint);
    if (res.ok) return await res.json();
  } catch {
    // Local mock fallback keeps the UI available during offline review.
  }
  return (mockData.faultReport as unknown as FaultReport[])
    .slice()
    .sort(
      (a, b) =>
        new Date(b.reported_at).getTime() - new Date(a.reported_at).getTime() || b.id - a.id
    )
    .map((row) => buildFaultReportView(row));
}

export async function saveFaultReport(
  payload: FaultReportFormPayload
): Promise<FaultReportSaveResult> {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload)
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw Object.assign(new Error(body.message ?? "save fault report failed"), {
      status: res.status,
      code: body.code
    });
  }
  return body as FaultReportSaveResult;
}
