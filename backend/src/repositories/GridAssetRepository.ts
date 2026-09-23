import { db } from "./inMemoryDb";

export const gridAssetRepository = {
  findAll: () => db.gridAsset,
  findById: (id: number) => db.gridAsset.find((row) => row.id === id),
  insert: (row: (typeof db.gridAsset)[number]) => {
    db.gridAsset.push(row);
    return row;
  },
  save: (row: unknown) => row
};
