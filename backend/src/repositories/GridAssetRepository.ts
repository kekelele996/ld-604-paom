import { tables } from "./tables";
export const gridAssetRepository = { findAll: () => tables.gridAsset, save: (row: unknown) => row };
