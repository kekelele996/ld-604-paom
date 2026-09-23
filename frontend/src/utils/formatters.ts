import { SeverityText, type Severity } from "../constants/Severity";
import { TicketPriorityText, type TicketPriority } from "../constants/TicketPriority";
import { FaultStatusText, type FaultStatus } from "../constants/FaultStatus";
import { TicketStatusText } from "../types/TicketStatus";

export const formatDate = (value: string) => new Date(value).toLocaleString("zh-CN");
export const formatStatus = (value: string) => value.replace(/_/g, " ");
export const formatNumber = (value: number) => new Intl.NumberFormat("zh-CN").format(value);
export const formatRisk = (value: string) => ({ LOW: "低", MEDIUM: "中", HIGH: "高", CRITICAL: "严重", EXTREME: "极高" }[value] ?? value);

export const formatSeverity = (value: string): string =>
  SeverityText[value as Severity] ?? value;

export const formatPriority = (value: string): string =>
  TicketPriorityText[value as TicketPriority] ?? value;

export const formatFaultStatus = (value: string): string =>
  FaultStatusText[value as FaultStatus] ?? formatStatus(value);

export const formatTicketStatus = (value: string): string =>
  TicketStatusText[value as keyof typeof TicketStatusText] ?? formatStatus(value);

// "MEDIUM → CRITICAL" 形式的升级轨迹
export const formatSeverityTrace = (before: string | null, after: string | null): string => {
  if (!before && !after) return "未升级";
  if (before && after) return `${formatSeverity(before)} → ${formatSeverity(after)}`;
  return formatSeverity((after ?? before) as string);
};
