export const FaultSeverity = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
export type FaultSeverity = (typeof FaultSeverity)[number];

export const FaultSeverityRank: Record<FaultSeverity, number> = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  CRITICAL: 4
};

export const FaultSeverityText: Record<FaultSeverity, string> = {
  LOW: "一般",
  MEDIUM: "较重",
  HIGH: "重大",
  CRITICAL: "紧急"
};

export const isKnownFaultSeverity = (value: string): value is FaultSeverity =>
  (FaultSeverity as readonly string[]).includes(value);

export const compareFaultSeverity = (candidate: string, current: string): number =>
  (FaultSeverityRank[candidate as FaultSeverity] ?? 0) -
  (FaultSeverityRank[current as FaultSeverity] ?? 0);

export const isMoreSevere = (candidate: string, current: string): boolean =>
  compareFaultSeverity(candidate, current) > 0;
