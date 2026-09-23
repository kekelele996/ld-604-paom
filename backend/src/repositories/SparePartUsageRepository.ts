import { tables } from "./tables";
export const sparePartUsageRepository = { findAll: () => tables.sparePartUsage, save: (row: unknown) => row };
