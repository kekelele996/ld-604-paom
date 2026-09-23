// 故障严重度：下标越大越严重，只升不降
export const Severity = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
export type Severity = (typeof Severity)[number];

export const SeverityRank: Record<Severity, number> = Severity.reduce(
  (acc, value, index) => ({ ...acc, [value]: index }),
  {} as Record<Severity, number>
);

export const SeverityText: Record<Severity, string> = {
  LOW: "低",
  MEDIUM: "中",
  HIGH: "高",
  CRITICAL: "危急"
};

export const isMoreSevere = (next: string, current: string): boolean =>
  (Severity as readonly string[]).includes(next) &&
  (Severity as readonly string[]).includes(current) &&
  SeverityRank[next as Severity] > SeverityRank[current as Severity];
