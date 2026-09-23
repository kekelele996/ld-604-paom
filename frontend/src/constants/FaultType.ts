export const FaultType = ["OUTAGE", "VOLTAGE_LOW", "TRIP", "EQUIPMENT_DAMAGE", "SAFETY_RISK"] as const;
export type FaultType = (typeof FaultType)[number];
export const FaultTypeText: Record<FaultType, string> = Object.fromEntries(
  FaultType.map((value) => [value, value.replace(/_/g, " ")])
) as Record<FaultType, string>;
export const FaultTypeLabel: Record<FaultType, string> = {
  OUTAGE: "停电",
  VOLTAGE_LOW: "电压偏低",
  TRIP: "开关跳闸",
  EQUIPMENT_DAMAGE: "设备损坏",
  SAFETY_RISK: "安全隐患"
};
