import { tables } from "./tables";
export const crewRepository = { findAll: () => tables.crew, save: (row: unknown) => row };
