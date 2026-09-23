import type { FaultReport } from "./models/FaultReport";
import type { RepairTicket } from "./models/RepairTicket";

const minutesAgo = (minutes: number): string => new Date(Date.now() - minutes * 60_000).toISOString();

// 每次进程启动生成一份带相对时间的种子，保证 30 分钟合并窗口可直接演示
const buildSeed = () => ({
  gridAsset: [
    {
      id: 1,
      asset_code: "XL-10KV-001",
      asset_type: "OUTAGE",
      feeder_line: "滨海一线",
      voltage_level: "10KV",
      location_desc: "滨海大道 12 号环网柜",
      health_status: "DANGEROUS",
      owner_team_id: 1
    },
    {
      id: 2,
      asset_code: "XL-10KV-002",
      asset_type: "VOLTAGE_LOW",
      feeder_line: "滨河二线",
      voltage_level: "10KV",
      location_desc: "滨河小区 3 号箱变",
      health_status: "NORMAL",
      owner_team_id: 2
    },
    {
      id: 3,
      asset_code: "XL-04KV-003",
      asset_type: "EQUIPMENT_DAMAGE",
      feeder_line: "临港三线",
      voltage_level: "0.4KV",
      location_desc: "临港工业园门口台架变",
      health_status: "WATCH",
      owner_team_id: 3
    }
  ],
  faultReport: [
    {
      id: 1,
      reporter_name: "王建国",
      phone: "13800000001",
      asset_id: 1,
      fault_type: "OUTAGE",
      address_desc: "滨海大道整片停电",
      severity: "CRITICAL",
      report_channel: "HOTLINE",
      status: "OPEN",
      reported_at: minutesAgo(22),
      merged_into_id: null,
      merged_count: 1,
      severity_before: "MEDIUM",
      severity_upgraded_to: "CRITICAL"
    },
    {
      id: 2,
      reporter_name: "李慧",
      phone: "13800000002",
      asset_id: 2,
      fault_type: "VOLTAGE_LOW",
      address_desc: "灯光偏暗，空调无法启动",
      severity: "LOW",
      report_channel: "APP",
      status: "OPEN",
      reported_at: minutesAgo(120),
      merged_into_id: null,
      merged_count: 0,
      severity_before: null,
      severity_upgraded_to: null
    },
    {
      id: 3,
      reporter_name: "赵磊",
      phone: "13800000003",
      asset_id: 3,
      fault_type: "EQUIPMENT_DAMAGE",
      address_desc: "台架变绝缘子破损放电",
      severity: "HIGH",
      report_channel: "PATROL",
      status: "OPEN",
      reported_at: minutesAgo(8),
      merged_into_id: null,
      merged_count: 0,
      severity_before: null,
      severity_upgraded_to: null
    },
    {
      id: 4,
      reporter_name: "陈芳",
      phone: "13800000004",
      asset_id: 1,
      fault_type: "OUTAGE",
      address_desc: "滨海大道商铺也没电",
      severity: "CRITICAL",
      report_channel: "HOTLINE",
      status: "MERGED",
      reported_at: minutesAgo(10),
      merged_into_id: 1,
      merged_count: 0,
      severity_before: null,
      severity_upgraded_to: null
    }
  ] as FaultReport[],
  repairTicket: [
    {
      id: 1,
      fault_report_id: 1,
      team_id: 1,
      dispatcher_id: 1,
      priority: "CRITICAL",
      status: "WAIT_DISPATCH",
      assigned_at: minutesAgo(20),
      restored_at: null,
      priority_before: "MEDIUM",
      upgraded_from_severity: "MEDIUM"
    },
    {
      id: 2,
      fault_report_id: 2,
      team_id: 2,
      dispatcher_id: 1,
      priority: "LOW",
      status: "RESTORED",
      assigned_at: minutesAgo(110),
      restored_at: minutesAgo(95),
      priority_before: null,
      upgraded_from_severity: null
    },
    {
      id: 3,
      fault_report_id: 3,
      team_id: 3,
      dispatcher_id: 1,
      priority: "HIGH",
      status: "REPAIRING",
      assigned_at: minutesAgo(6),
      restored_at: null,
      priority_before: null,
      upgraded_from_severity: null
    }
  ] as RepairTicket[],
  crew: [
    {
      id: 1,
      name: "滨海抢修一班",
      leader_id: 1,
      skill_tags: "10KV,电缆,环网柜",
      duty_status: "ON_DUTY",
      current_ticket_id: null,
      contact_phone: "0571-88000001"
    },
    {
      id: 2,
      name: "滨河抢修二班",
      leader_id: 2,
      skill_tags: "10KV,箱变",
      duty_status: "OFF_DUTY",
      current_ticket_id: null,
      contact_phone: "0571-88000002"
    },
    {
      id: 3,
      name: "临港抢修三班",
      leader_id: 3,
      skill_tags: "0.4KV,台架变,带电作业",
      duty_status: "BUSY",
      current_ticket_id: 3,
      contact_phone: "0571-88000003"
    }
  ],
  sparePartUsage: [
    {
      id: 1,
      ticket_id: 3,
      part_code: "SP-INS-10",
      part_name: "10kV 柱式绝缘子",
      quantity: 3,
      warehouse_name: "临港一号库",
      approved_by: "调度员-周敏",
      usage_status: "ISSUED"
    }
  ]
});

export const seed = buildSeed();
