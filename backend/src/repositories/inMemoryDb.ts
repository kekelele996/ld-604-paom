import { seed } from "../seed";

// 仓储层统一从内存库读取，保证写操作（合并/升级）在进程内持久可见
export const db = {
  gridAsset: structuredClone(seed.gridAsset),
  faultReport: structuredClone(seed.faultReport),
  repairTicket: structuredClone(seed.repairTicket),
  crew: structuredClone(seed.crew),
  sparePartUsage: structuredClone(seed.sparePartUsage)
};

export type Db = typeof db;
export type DbSnapshot = ReturnType<typeof snapshotDb>;

export const snapshotDb = (): Db => structuredClone(db);

export const restoreDb = (snapshot: DbSnapshot): void => {
  db.gridAsset.splice(0, db.gridAsset.length, ...structuredClone(snapshot.gridAsset));
  db.faultReport.splice(0, db.faultReport.length, ...structuredClone(snapshot.faultReport));
  db.repairTicket.splice(0, db.repairTicket.length, ...structuredClone(snapshot.repairTicket));
  db.crew.splice(0, db.crew.length, ...structuredClone(snapshot.crew));
  db.sparePartUsage.splice(0, db.sparePartUsage.length, ...structuredClone(snapshot.sparePartUsage));
};
