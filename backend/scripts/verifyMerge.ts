/* eslint-disable no-console */
// 合并/升级/并发/回滚端到端验证（直接调用 service 与仓储，不监听端口）
import assert from "node:assert";
import { faultReportService, __setFailNextMerge } from "../src/services/FaultReportService";
import { faultReportRepository } from "../src/repositories/FaultReportRepository";
import { repairTicketRepository } from "../src/repositories/RepairTicketRepository";
import { gridAssetRepository } from "../src/repositories/GridAssetRepository";

// 准备两个专用资产，避免与种子数据互相干扰
gridAssetRepository.insert({ id: 99, asset_code: "T-99", asset_type: "OUTAGE", feeder_line: "测试线", voltage_level: "10KV", location_desc: "测试资产99", health_status: "NORMAL", owner_team_id: 1 });
gridAssetRepository.insert({ id: 98, asset_code: "T-98", asset_type: "TRIP", feeder_line: "测试线", voltage_level: "10KV", location_desc: "测试资产98", health_status: "NORMAL", owner_team_id: 1 });

const base = {
  reporter_name: "测试人",
  phone: "13800000000",
  address_desc: "测试地址",
  report_channel: "HOTLINE"
};

const summary = () => ({
  faults: faultReportRepository.findAll().map((f) => ({ id: f.id, asset: f.asset_id, status: f.status, sev: f.severity, count: f.merged_count, into: f.merged_into_id })),
  tickets: repairTicketRepository.findAll().map((t) => ({ id: t.id, fault: t.fault_report_id, pri: t.priority, status: t.status, before: t.priority_before }))
});

(async () => {
  // 1. 新资产首条报修 -> 新主故障，不命中合并
  const first = await faultReportService.create({ ...base, asset_id: 99, fault_type: "OUTAGE", severity: "LOW", client_request_id: "r1" });
  assert.strictEqual(first.merged, false);
  const primaryId = first.response.id;
  assert.strictEqual(first.response.merged_count, 0, "新主故障没有并入记录");

  // 2. 升级前为主故障挂一张未复电工单（LOW）和一张已复电工单（MEDIUM）
  repairTicketRepository.save({ id: 901, fault_report_id: primaryId, team_id: 1, dispatcher_id: 1, priority: "LOW", status: "WAIT_DISPATCH", assigned_at: new Date().toISOString() });
  repairTicketRepository.save({ id: 902, fault_report_id: primaryId, team_id: 1, dispatcher_id: 1, priority: "MEDIUM", status: "RESTORED", assigned_at: new Date().toISOString(), restored_at: new Date().toISOString() });

  // 3. 同资产 30 分钟内第二条、更严重 -> 并入 + 升级
  const second = await faultReportService.create({ ...base, reporter_name: "测试人2", asset_id: 99, fault_type: "OUTAGE", severity: "CRITICAL", client_request_id: "r2" });
  assert.strictEqual(second.merged, true);
  assert.strictEqual(second.escalated, true);
  assert.strictEqual(second.response.id, primaryId, "响应必须是原故障而非新单");
  assert.strictEqual(second.response.merged_count, 1);
  assert.strictEqual(second.response.severity, "CRITICAL");
  assert.strictEqual(second.response.severity_before, "LOW");
  assert.strictEqual(second.response.severity_upgraded_to, "CRITICAL");
  assert.strictEqual(second.response.merged_reports.length, 1);

  // 4. 未复电工单优先级随升级只升不降；已复电工单保持原样
  const openTicket = repairTicketRepository.findAll().find((t) => t.id === 901)!;
  const restoredTicket = repairTicketRepository.findAll().find((t) => t.id === 902)!;
  assert.strictEqual(openTicket.priority, "CRITICAL", "未复电工单必须升级");
  assert.strictEqual(openTicket.priority_before, "LOW");
  assert.strictEqual(restoredTicket.priority, "MEDIUM", "已复电工单保持原样");
  assert.strictEqual(restoredTicket.priority_before, null);
  assert.strictEqual(second.response.tickets.length, 2, "详情需带已关联工单");

  // 5. 同等级第三条 -> 只合并计数，等级不回落
  const third = await faultReportService.create({ ...base, asset_id: 99, fault_type: "OUTAGE", severity: "MEDIUM", client_request_id: "r3" });
  assert.strictEqual(third.merged, true);
  assert.strictEqual(third.escalated, false);
  assert.strictEqual(third.response.severity, "CRITICAL");
  assert.strictEqual(third.response.merged_count, 2);
  assert.strictEqual(openTicket.priority, "CRITICAL", "更弱报修不得把工单优先级降回去");

  // 6. 幂等：同一 request_id 重复提交 -> 只合并一次，计数不变
  const rowsBeforeReplay = faultReportRepository.findAll().filter((f) => f.asset_id === 99).length;
  const dup = await faultReportService.create({ ...base, asset_id: 99, fault_type: "OUTAGE", severity: "CRITICAL", client_request_id: "r2" });
  assert.strictEqual(dup.reusedIdempotencyKey, true);
  assert.strictEqual(dup.response.merged_count, 1, "幂等回放返回首次提交时的响应快照");
  assert.strictEqual(faultReportRepository.findById(primaryId)!.merged_count, 2, "重复提交不得增加合并次数");
  assert.strictEqual(faultReportRepository.findAll().filter((f) => f.asset_id === 99).length, rowsBeforeReplay, "重复提交不得新增故障记录");

  // 7. 并发提交不同 request_id 同一报修 -> 串行合并，计数正确累加
  const concurrent = await Promise.all([
    faultReportService.create({ ...base, asset_id: 99, fault_type: "OUTAGE", severity: "HIGH", client_request_id: "c1" }),
    faultReportService.create({ ...base, asset_id: 99, fault_type: "OUTAGE", severity: "HIGH", client_request_id: "c2" })
  ]);
  assert.deepStrictEqual(concurrent.map((r) => r.response.merged_count), [3, 4]);
  assert.ok(concurrent.every((r) => r.merged));

  // 8. 真正的并发重复提交（相同 request_id）-> 只合并一次
  const race = await Promise.all([
    faultReportService.create({ ...base, asset_id: 99, fault_type: "OUTAGE", severity: "HIGH", client_request_id: "same-key" }),
    faultReportService.create({ ...base, asset_id: 99, fault_type: "OUTAGE", severity: "HIGH", client_request_id: "same-key" })
  ]);
  assert.strictEqual(race.filter((r) => r.reusedIdempotencyKey).length, 1);
  assert.strictEqual(race[0].response.merged_count, race[1].response.merged_count, "并发同键合并后计数一致");
  assert.strictEqual(race[0].response.merged_count, 5);

  // 9. 校验失败 -> 不产生任何写入，故障/工单/计数全部不变
  const beforeCount = faultReportRepository.findAll().filter((f) => f.asset_id === 99).length;
  const beforeMerged = faultReportRepository.findById(primaryId)!.merged_count;
  await assert.rejects(
    faultReportService.create({ ...base, asset_id: 99, fault_type: "OUTAGE", severity: "BOGUS", client_request_id: "bad" }),
    (error: unknown) => (error as { code?: string }).code === "VALIDATION_FAILED"
  );
  assert.strictEqual(faultReportRepository.findAll().filter((f) => f.asset_id === 99).length, beforeCount);
  assert.strictEqual(faultReportRepository.findById(primaryId)!.merged_count, beforeMerged);

  // 9.1 合并中途失败 -> 事务回滚，新故障、计数、升级全部撤销
  __setFailNextMerge(true);
  await assert.rejects(
    faultReportService.create({ ...base, asset_id: 99, fault_type: "OUTAGE", severity: "CRITICAL", client_request_id: "will-rollback" }),
    /rolled back/
  );
  assert.strictEqual(faultReportRepository.findById(primaryId)!.merged_count, beforeMerged, "回滚后合并次数不变");
  assert.strictEqual(faultReportRepository.findAll().filter((f) => f.asset_id === 99).length, beforeCount, "回滚后并入故障不落库");
  assert.strictEqual(faultReportRepository.findById(primaryId)!.severity, "CRITICAL");
  assert.strictEqual(repairTicketRepository.findAll().find((t) => t.id === 901)!.priority, "CRITICAL");

  // 10. 不存在的资产 -> 回滚且不产生故障
  await assert.rejects(
    faultReportService.create({ ...base, asset_id: 40404, fault_type: "TRIP", severity: "LOW", client_request_id: "r404" }),
    /asset/
  );
  assert.strictEqual(faultReportRepository.findAll().some((f) => f.asset_id === 40404), false);

  // 11. 已关闭故障不参与合并（30 分钟窗口内也要另建主故障）
  const closeId = (await faultReportService.create({ ...base, asset_id: 98, fault_type: "TRIP", severity: "LOW", client_request_id: "close-1" })).response.id;
  faultReportRepository.update(closeId, { status: "CLOSED" });
  const afterClosed = await faultReportService.create({ ...base, asset_id: 98, fault_type: "TRIP", severity: "LOW", client_request_id: "close-2" });
  assert.strictEqual(afterClosed.merged, false, "已关闭故障不能作为合并目标");
  assert.notStrictEqual(afterClosed.response.id, closeId);


  console.log("ALL SERVICE TESTS PASSED");
  console.log(JSON.stringify(summary(), null, 2));
})().catch((error) => {
  console.error("TEST FAILED", error);
  process.exit(1);
});
