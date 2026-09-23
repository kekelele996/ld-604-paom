import { db } from "./inMemoryDb";

export const crewRepository = {
  findAll: () => db.crew,
  save: (row: unknown) => row
};
