import { MERGE_WINDOW_MS } from "../config/merge";
import { db } from "./inMemoryDb";
import type { FaultReport } from "../models/FaultReport";

export interface FaultReportQuery {
  asset_id?: number;
  status?: string;
}

const toOptionalNumber = (value: unknown): number | undefined => {
  if (value === undefined || value === null || value === "") return undefined;
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
};

export const faultReportRepository = {
  findAll(query: FaultReportQuery = {}): FaultReport[] {
    return db.faultReport.filter(
      (row) =>
        (query.asset_id === undefined || row.asset_id === query.asset_id) &&
        (query.status === undefined || row.status === query.status)
    );
  },

  findById(id: number): FaultReport | undefined {
    return db.faultReport.find((row) => row.id === id);
  },

  // 同一资产、窗口内（30 分钟）最早出现的未关闭主故障；已关闭/已并入的不参与合并
  findMergeTarget(assetId: number, reportedAt: Date): FaultReport | undefined {
    const windowStart = reportedAt.getTime() - MERGE_WINDOW_MS;
    return db.faultReport
      .filter(
        (row) =>
          row.asset_id === assetId &&
          row.status === "OPEN" &&
          row.merged_into_id === null &&
          new Date(row.reported_at).getTime() >= windowStart &&
          new Date(row.reported_at).getTime() <= reportedAt.getTime()
      )
      .sort(
        (a, b) => new Date(a.reported_at).getTime() - new Date(b.reported_at).getTime() || a.id - b.id
      )[0];
  },

  findByMergedIntoId(mergedIntoId: number): FaultReport[] {
    return db.faultReport
      .filter((row) => row.merged_into_id === mergedIntoId)
      .sort((a, b) => a.id - b.id);
  },

  nextId(): number {
    return db.faultReport.reduce((max, row) => Math.max(max, row.id), 0) + 1;
  },

  insert(row: FaultReport): FaultReport {
    db.faultReport.push(row);
    return row;
  },

  update(id: number, patch: Partial<FaultReport>): FaultReport {
    const row = db.faultReport.find((item) => item.id === id);
    if (!row) throw new Error(`fault report ${id} not found`);
    Object.assign(row, patch);
    return row;
  }
};
