import { tables, type DataSnapshot } from "./tables";
import type { FaultReport } from "../models/FaultReport";
import { OPEN_FAULT_STATUSES } from "../constants/FaultStatus";
import { MERGE_WINDOW_MS } from "../config/mergePolicy";

export const faultReportRepository = {
  findAll: (): FaultReport[] => tables.faultReport,

  findById: (id: number): FaultReport | undefined =>
    tables.faultReport.find((row) => row.id === id),

  nextId: (): number => tables.faultReport.reduce((max, row) => Math.max(max, row.id), 0) + 1,

  // 合并目标：同一资产、未关闭、报修时间落在 [新报修时间-30分钟, 新报修时间] 内的最新主故障。
  findMergeTarget(assetId: number, reportedAtMs: number): FaultReport | undefined {
    return tables.faultReport
      .filter((row) => {
        const ageMs = reportedAtMs - new Date(row.reported_at).getTime();
        return (
          row.asset_id === assetId &&
          row.merged_into_id === null &&
          OPEN_FAULT_STATUSES.includes(row.status as never) &&
          ageMs >= 0 &&
          ageMs <= MERGE_WINDOW_MS
        );
      })
      .sort(
        (a, b) =>
          new Date(b.reported_at).getTime() - new Date(a.reported_at).getTime() || b.id - a.id
      )[0];
  },

  insert(row: FaultReport): FaultReport {
    tables.faultReport.push(row);
    return row;
  },

  snapshot: (): DataSnapshot["faultReport"] => tables.faultReport.map((row) => ({ ...row })),

  restore(rows: DataSnapshot["faultReport"]): void {
    tables.faultReport = rows;
  },

  save: (row: unknown) => row
};
