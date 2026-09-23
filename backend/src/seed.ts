import type { FaultReport } from "./models/FaultReport";
import type { RepairTicket } from "./models/RepairTicket";

// 种子时间以进程启动时刻为基准，保证 30 分钟合并窗口在本地评审时可直接演示。
const now = Date.now();
const minutesAgoIso = (minutes: number) => new Date(now - minutes * 60 * 1000).toISOString();

export const seed = {
  "gridAsset": [
    {
      "id": 1,
      "asset_code": "asset code 1",
      "asset_type": "VOLTAGE_LOW",
      "feeder_line": "feeder line 1",
      "voltage_level": "LOW",
      "location_desc": "location desc 1",
      "health_status": "ASSIGNED",
      "owner_team_id": 1
    },
    {
      "id": 2,
      "asset_code": "asset code 2",
      "asset_type": "TRIP",
      "feeder_line": "feeder line 2",
      "voltage_level": "MEDIUM",
      "location_desc": "location desc 2",
      "health_status": "ARRIVED",
      "owner_team_id": 2
    },
    {
      "id": 3,
      "asset_code": "asset code 3",
      "asset_type": "EQUIPMENT_DAMAGE",
      "feeder_line": "feeder line 3",
      "voltage_level": "HIGH",
      "location_desc": "location desc 3",
      "health_status": "WAIT_DISPATCH",
      "owner_team_id": 3
    }
  ],
  // 故障 1：10 分钟前未关闭，合并窗口内；关联工单未复电（ASSIGNED），新报修更严重时可演示升级。
  // 故障 2：90 分钟前未关闭，已在 30 分钟窗口外；关联工单已复电（RESTORED），升级时必须保持原样。
  // 故障 3：5 分钟前未关闭，窗口内，等待派工。
  // 故障 4：已合并进故障 1 的重复报修。
  "faultReport": [
    {
      "id": 1,
      "reporter_name": "reporter name 1",
      "phone": "13800000001",
      "asset_id": 1,
      "fault_type": "VOLTAGE_LOW",
      "address_desc": "address desc 1",
      "severity": "MEDIUM",
      "previous_severity": "",
      "report_channel": "report channel 1",
      "status": "OPEN",
      "reported_at": minutesAgoIso(10),
      "merged_count": 1,
      "merged_into_id": null
    },
    {
      "id": 2,
      "reporter_name": "reporter name 2",
      "phone": "13800000002",
      "asset_id": 2,
      "fault_type": "TRIP",
      "address_desc": "address desc 2",
      "severity": "LOW",
      "previous_severity": "",
      "report_channel": "report channel 2",
      "status": "OPEN",
      "reported_at": minutesAgoIso(90),
      "merged_count": 0,
      "merged_into_id": null
    },
    {
      "id": 3,
      "reporter_name": "reporter name 3",
      "phone": "13800000003",
      "asset_id": 3,
      "fault_type": "EQUIPMENT_DAMAGE",
      "address_desc": "address desc 3",
      "severity": "HIGH",
      "previous_severity": "",
      "report_channel": "report channel 3",
      "status": "OPEN",
      "reported_at": minutesAgoIso(5),
      "merged_count": 0,
      "merged_into_id": null
    },
    {
      "id": 4,
      "reporter_name": "reporter name 4",
      "phone": "13800000004",
      "asset_id": 1,
      "fault_type": "VOLTAGE_LOW",
      "address_desc": "address desc 4",
      "severity": "LOW",
      "previous_severity": "",
      "report_channel": "report channel 4",
      "status": "MERGED",
      "reported_at": minutesAgoIso(8),
      "merged_count": 0,
      "merged_into_id": 1
    }
  ] as FaultReport[],
  // 工单 1：故障 1 的未复电工单，加急（MEDIUM 映射），升级后可被抬到特急/紧急。
  // 工单 2：故障 2 的已复电工单，故障升级时优先级必须保持不变。
  // 工单 3：故障 3 的待派工单。
  "repairTicket": [
    {
      "id": 1,
      "fault_report_id": 1,
      "team_id": 1,
      "dispatcher_id": 1,
      "priority": "URGENT",
      "status": "ASSIGNED",
      "assigned_at": minutesAgoIso(10),
      "restored_at": null
    },
    {
      "id": 2,
      "fault_report_id": 2,
      "team_id": 2,
      "dispatcher_id": 2,
      "priority": "ROUTINE",
      "status": "RESTORED",
      "assigned_at": minutesAgoIso(90),
      "restored_at": minutesAgoIso(60)
    },
    {
      "id": 3,
      "fault_report_id": 3,
      "team_id": 3,
      "dispatcher_id": 3,
      "priority": "EXPRESS",
      "status": "WAIT_DISPATCH",
      "assigned_at": minutesAgoIso(5),
      "restored_at": null
    }
  ] as RepairTicket[],
  "crew": [
    {
      "id": 1,
      "name": "name 1",
      "leader_id": 1,
      "skill_tags": "skill tags 1",
      "duty_status": "ASSIGNED",
      "current_ticket_id": 1,
      "contact_phone": "13800000001"
    },
    {
      "id": 2,
      "name": "name 2",
      "leader_id": 2,
      "skill_tags": "skill tags 2",
      "duty_status": "ARRIVED",
      "current_ticket_id": 2,
      "contact_phone": "13800000002"
    },
    {
      "id": 3,
      "name": "name 3",
      "leader_id": 3,
      "skill_tags": "skill tags 3",
      "duty_status": "WAIT_DISPATCH",
      "current_ticket_id": 3,
      "contact_phone": "13800000003"
    }
  ],
  "sparePartUsage": [
    {
      "id": 1,
      "ticket_id": 1,
      "part_code": "part code 1",
      "part_name": "part name 1",
      "quantity": 92,
      "warehouse_name": "warehouse name 1",
      "approved_by": "approved by 1",
      "usage_status": "ASSIGNED"
    },
    {
      "id": 2,
      "ticket_id": 2,
      "part_code": "part code 2",
      "part_name": "part name 2",
      "quantity": 104,
      "warehouse_name": "warehouse name 2",
      "approved_by": "approved by 2",
      "usage_status": "ARRIVED"
    },
    {
      "id": 3,
      "ticket_id": 3,
      "part_code": "part code 3",
      "part_name": "part name 3",
      "quantity": 116,
      "warehouse_name": "warehouse name 3",
      "approved_by": "approved by 3",
      "usage_status": "WAIT_DISPATCH"
    }
  ]
};
