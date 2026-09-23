import { seed } from "../seed";
import type { FaultReport } from "../models/FaultReport";
import type { RepairTicket } from "../models/RepairTicket";
import type { GridAsset } from "../models/GridAsset";
import type { Crew } from "../models/Crew";
import type { SparePartUsage } from "../models/SparePartUsage";

// 进程内可变数据表：全部数据来自本地种子，写操作直接作用于这些表。
export const tables = {
  faultReport: seed.faultReport.map((row) => ({ ...row })) as FaultReport[],
  repairTicket: seed.repairTicket.map((row) => ({ ...row })) as RepairTicket[],
  gridAsset: seed.gridAsset.map((row) => ({ ...row })) as GridAsset[],
  crew: seed.crew.map((row) => ({ ...row })) as Crew[],
  sparePartUsage: seed.sparePartUsage.map((row) => ({ ...row })) as SparePartUsage[]
};

export type DataSnapshot = {
  faultReport: FaultReport[];
  repairTicket: RepairTicket[];
};

// 将数据表恢复为种子状态（仅本地/测试环境通过 /api/test/reset 调用）。
export const resetTables = (): void => {
  tables.faultReport = seed.faultReport.map((row) => ({ ...row }));
  tables.repairTicket = seed.repairTicket.map((row) => ({ ...row }));
  tables.gridAsset = seed.gridAsset.map((row) => ({ ...row }));
  tables.crew = seed.crew.map((row) => ({ ...row }));
  tables.sparePartUsage = seed.sparePartUsage.map((row) => ({ ...row }));
};
