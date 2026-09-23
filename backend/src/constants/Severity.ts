// 故障严重度：只升不降，顺序即等级高低（下标越大越严重）
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
  Severity.includes(next as Severity) &&
  Severity.includes(current as Severity) &&
  SeverityRank[next as Severity] > SeverityRank[current as Severity];

export const maxSeverity = (a: string, b: string): Severity =>
  isMoreSevere(b, a) ? (b as Severity) : (a as Severity);
