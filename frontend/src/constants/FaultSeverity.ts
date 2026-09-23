export const FaultSeverity = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
export type FaultSeverity = (typeof FaultSeverity)[number];
export const FaultSeverityText: Record<FaultSeverity, string> = {
  LOW: "一般",
  MEDIUM: "较重",
  HIGH: "重大",
  CRITICAL: "紧急"
};
export const FaultSeverityRank: Record<FaultSeverity, number> = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  CRITICAL: 4
};
