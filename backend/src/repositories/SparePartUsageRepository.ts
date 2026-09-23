import { db } from "./inMemoryDb";

export const sparePartUsageRepository = {
  findAll: () => db.sparePartUsage,
  save: (row: unknown) => row
};
