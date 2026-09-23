import { FaultSeverityText, type FaultSeverity } from "../constants/FaultSeverity";
import { FaultStatusText, type FaultStatus } from "../constants/FaultStatus";
import { TicketPriorityText, type TicketPriority } from "../constants/TicketPriority";
import { TicketStatusText, type TicketStatus } from "../constants/TicketStatus";

export const formatDate = (value: string) => new Date(value).toLocaleString("zh-CN");
export const formatStatus = (value: string) => value.replace(/_/g, " ");
export const formatNumber = (value: number) => new Intl.NumberFormat("zh-CN").format(value);
export const formatRisk = (value: string) =>
  ({ LOW: "低", MEDIUM: "中", HIGH: "高", CRITICAL: "严重", EXTREME: "极高" }[value] ?? value);

export const formatSeverity = (value: string): string =>
  FaultSeverityText[value as FaultSeverity] ?? value;
export const formatFaultStatus = (value: string): string =>
  FaultStatusText[value as FaultStatus] ?? value;
export const formatTicketPriority = (value: string): string =>
  TicketPriorityText[value as TicketPriority] ?? value;
export const formatTicketStatus = (value: string): string =>
  TicketStatusText[value as TicketStatus] ?? value;

// 升级前后等级文案，例如 "较重 → 紧急"。
export const formatSeverityChange = (previous: string, current: string): string =>
  previous && previous !== current
    ? `${formatSeverity(previous)} → ${formatSeverity(current)}`
    : formatSeverity(current);
