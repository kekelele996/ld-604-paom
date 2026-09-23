<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { useFaultReportStore } from "../stores/FaultReportStore";
import { useGridAssetStore } from "../stores/GridAssetStore";
import { useRepairTicketStore } from "../stores/RepairTicketStore";
import { createFaultReportForm } from "../constructors/FaultReportConstructor";
import { FaultType, FaultTypeLabel } from "../constants/FaultType";
import { FaultSeverity, FaultSeverityText } from "../constants/FaultSeverity";
import { LOG_TEMPLATES } from "../constants/logTemplates";
import { ERROR_MESSAGES } from "../constants/errorMessages";
import {
  formatDate,
  formatFaultStatus,
  formatSeverityChange,
  formatTicketPriority,
  formatTicketStatus
} from "../utils/formatters";
import StatusBadge from "../components/common/StatusBadge.vue";
import PriorityTag from "../components/common/PriorityTag.vue";
import TimelineList from "../components/common/TimelineList.vue";
import EmptyState from "../components/common/EmptyState.vue";
import type { FaultReportView } from "../types/FaultReport";
import type { RepairTicket } from "../types/RepairTicket";

const faultStore = useFaultReportStore();
const assetStore = useGridAssetStore();
const ticketStore = useRepairTicketStore();

const form = reactive(createFaultReportForm(1));
const notice = ref<{ kind: "ok" | "err"; text: string } | null>(null);

const refresh = async () => {
  await Promise.all([faultStore.load(), assetStore.load(), ticketStore.load()]);
};

onMounted(refresh);

const ticketById = (id: number): RepairTicket | undefined =>
  ticketStore.rows.find((ticket) => ticket.id === id);

// 按资产分组：每个资产下列出未关闭主故障与其已合并报修。
const groupedByAsset = computed(() => {
  const roots = faultStore.rows.filter(
    (row) => row.merged_into_id === null && row.status === "OPEN"
  );
  return assetStore.rows.map((asset) => ({
    asset,
    roots: roots.filter((row) => row.asset_id === asset.id)
  }));
});

const mergedRowsOf = (rootId: number): FaultReportView[] =>
  faultStore.rows.filter((row) => row.merged_into_id === rootId);

const closedRows = computed(() =>
  faultStore.rows.filter((row) => row.merged_into_id === null && row.status !== "OPEN")
);

const timelineItems = (row: FaultReportView) => {
  const items: { key: string; text: string; tone?: string }[] = [];
  items.push({
    key: "report",
    text: `报修时间 ${formatDate(row.reported_at)} · ${formatFaultStatus(row.status)}`
  });
  if (row.merged_count > 0) {
    items.push({
      key: "merge",
      tone: "merged",
      text: `${LOG_TEMPLATES.FaultReport[4]}：累计并入 ${row.merged_count} 次重复报修，未另建工单`
    });
  }
  if (row.escalated) {
    items.push({
      key: "escalate",
      tone: "escalated",
      text: `${LOG_TEMPLATES.FaultReport[5]}：${formatSeverityChange(row.previous_severity, row.severity)}`
    });
  }
  for (const id of row.linked_ticket_ids) {
    const ticket = ticketById(id);
    items.push({
      key: `ticket-${id}`,
      tone: "ticket",
      text: ticket
        ? `关联工单 #${id} · ${formatTicketPriority(ticket.priority)} · ${formatTicketStatus(ticket.status)}${
            ticket.restored_at ? "（已复电，优先级保持原样）" : "（未复电）"
          }`
        : `关联工单 #${id}`
    });
  }
  return items;
};

const resetToken = () => {
  form.client_token = `web-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
};

const submit = async () => {
  notice.value = null;
  try {
    const result = await faultStore.submit({ ...form });
    // 并发提交同一报修只合并一次：每次提交后换新令牌，不影响用户连续登记不同报修。
    resetToken();
    if (result.merged) {
      const parts = [`已并入故障 #${result.merge_target_id}，合并次数 +1`];
      parts.push(result.escalated ? "故障等级与未复电工单优先级已升级" : "等级未变（只升不降）");
      if (!result.bumped_ticket_ids.length) parts.push("无工单优先级调整");
      notice.value = { kind: "ok", text: parts.join("；") };
    } else {
      notice.value = { kind: "ok", text: `30 分钟内无同资产未关闭故障，已新建故障 #${result.fault.id}` };
    }
  } catch (error) {
    notice.value = {
      kind: "err",
      text: `${(error as Error).message || ERROR_MESSAGES.FAULT_MERGE_CONFLICT}（故障、工单和计数均未改变）`
    };
  }
};

// 模拟"并发提交同一报修"：同一 payload（含同一 client_token）同时发两次，验证只合并一次。
const submitConcurrent = async () => {
  notice.value = null;
  try {
    const payload = { ...form };
    const [a, b] = await Promise.all([
      faultStore.submit(payload),
      new Promise((resolve) => setTimeout(resolve, 20)).then(() => faultStore.submit(payload))
    ]);
    resetToken();
    notice.value = {
      kind: "ok",
      text:
        a.merged_report_id === b.merged_report_id
          ? `并发两单返回同一报修 #${a.merged_report_id}，只合并一次；合并次数仅 +1`
          : "并发请求生成了不同记录，异常！"
    };
  } catch (error) {
    notice.value = { kind: "err", text: (error as Error).message };
  }
};
</script>

<template>
  <section class="faults-page">
    <div class="faults-head">
      <div>
        <p class="eyebrow">grid-repair / faults</p>
        <h2>故障报修 · 重复合并与严重度升级</h2>
        <p class="hint">同一资产 30 分钟内出现未关闭故障时，新报修并入原故障并累计合并次数；新报修更严重时，原故障等级与未复电工单优先级只升不降，已复电/已关闭工单保持原样。</p>
      </div>
      <button class="refresh" :disabled="faultStore.loading" @click="refresh">刷新（与接口一致）</button>
    </div>

    <div class="faults-layout">
      <form class="panel report-form" @submit.prevent="submit">
        <h3>登记报修</h3>
        <label>资产
          <select v-model.number="form.asset_id">
            <option v-for="asset in assetStore.rows" :key="asset.id" :value="asset.id">
              #{{ asset.id }} {{ asset.asset_code }}（{{ asset.location_desc }}）
            </option>
          </select>
        </label>
        <label>报修人<input v-model="form.reporter_name" required maxlength="30" placeholder="报修人姓名" /></label>
        <label>联系电话<input v-model="form.phone" required pattern="[0-9\-]{6,20}" placeholder="联系电话" /></label>
        <label>故障类型
          <select v-model="form.fault_type">
            <option v-for="type in FaultType" :key="type" :value="type">{{ FaultTypeLabel[type] }}（{{ type }}）</option>
          </select>
        </label>
        <label>严重度
          <select v-model="form.severity">
            <option v-for="level in FaultSeverity" :key="level" :value="level">
              {{ FaultSeverityText[level] }}（{{ level }}）
            </option>
          </select>
        </label>
        <label>报修渠道<input v-model="form.report_channel" placeholder="HOTLINE / APP / WECHAT" /></label>
        <label class="full">地址描述<textarea v-model="form.address_desc" rows="2" placeholder="故障地址描述"></textarea></label>
        <div class="form-actions">
          <button type="submit" class="primary" :disabled="faultStore.submitting">提交报修</button>
          <button type="button" class="ghost" :disabled="faultStore.submitting" @click="submitConcurrent">并发提交同一报修 ×2</button>
        </div>
        <p v-if="notice" class="notice" :class="notice.kind">{{ notice.text }}</p>
      </form>

      <div class="fault-list">
        <EmptyState v-if="!faultStore.rows.length && !faultStore.loading" title="暂无故障报修" />
        <article v-for="group in groupedByAsset" :key="group.asset.id" class="panel asset-group">
          <header class="asset-head">
            <div>
              <strong>资产 #{{ group.asset.id }} · {{ group.asset.asset_code }}</strong>
              <span class="muted">{{ group.asset.location_desc }} / {{ group.asset.feeder_line }}</span>
            </div>
            <span class="muted">未关闭故障 {{ group.roots.length }}</span>
          </header>

          <EmptyState v-if="!group.roots.length" title="30 分钟内无未关闭故障" />
          <div v-for="row in group.roots" :key="row.id" class="fault-card">
            <div class="fault-main">
              <div class="fault-title">
                <span>故障 #{{ row.id }}</span>
                <StatusBadge :value="row.status" />
                <PriorityTag kind="severity" :value="row.severity" />
                <span v-if="row.escalated" class="upgrade" title="升级前等级">
                  升级前：<PriorityTag kind="severity" :value="row.previous_severity" />
                </span>
              </div>
              <div class="fault-meta">
                <span>合并次数：<strong>{{ row.merged_count }}</strong></span>
                <span v-if="row.escalated">
                  升级前后等级：{{ formatSeverityChange(row.previous_severity, row.severity) }}
                </span>
                <span v-else>未发生升级</span>
                <span>已关联工单：<template v-if="row.linked_ticket_ids.length">#{{ row.linked_ticket_ids.join("、#") }}</template><em v-else>无（合并不另建工单）</em></span>
              </div>
              <div v-if="mergedRowsOf(row.id).length" class="merged-rows">
                <span class="muted">已合并报修：</span>
                <span v-for="merged in mergedRowsOf(row.id)" :key="merged.id" class="merged-chip">
                  #{{ merged.id }} {{ FaultSeverityText[merged.severity as keyof typeof FaultSeverityText] ?? merged.severity }} · {{ formatDate(merged.reported_at) }}
                </span>
              </div>
            </div>
            <TimelineList :items="timelineItems(row)" />
          </div>
        </article>

        <article v-if="closedRows.length" class="panel asset-group">
          <header class="asset-head"><strong>已关闭/历史故障</strong></header>
          <div v-for="row in closedRows" :key="row.id" class="fault-card muted">
            故障 #{{ row.id }} · {{ formatFaultStatus(row.status) }} · 合并次数 {{ row.merged_count }}
          </div>
        </article>
      </div>
    </div>
  </section>
</template>

<style scoped>
.faults-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; }
.hint { color: #596257; font-size: 13px; max-width: 820px; margin: 6px 0 0; }
.refresh { background: #274335; color: #f5f1e6; padding: 8px 14px; border-radius: 6px; white-space: nowrap; }
.faults-layout { display: grid; grid-template-columns: 320px 1fr; gap: 18px; align-items: start; }
.report-form { display: grid; gap: 10px; position: sticky; top: 18px; }
.report-form label { display: grid; gap: 4px; font-size: 13px; color: #44504a; }
.report-form input, .report-form select, .report-form textarea { width: 100%; box-sizing: border-box; padding: 8px; border: 1px solid #c9c7b8; border-radius: 6px; font: inherit; background: #fff; }
.form-actions { display: flex; gap: 8px; }
.primary { background: #7d4d18; color: #fff; padding: 9px 14px; border-radius: 6px; }
.ghost { background: #efece1; color: #44504a; padding: 9px 12px; border-radius: 6px; }
.notice { font-size: 13px; padding: 10px; border-radius: 6px; margin: 0; }
.notice.ok { background: #e4efe4; color: #244b31; }
.notice.err { background: #f6d5d2; color: #93231c; }
.fault-list { display: grid; gap: 14px; }
.asset-group { padding: 14px 16px; display: grid; gap: 12px; }
.asset-head { display: flex; justify-content: space-between; align-items: center; gap: 12px; border-bottom: 1px solid #e4e0d3; padding-bottom: 8px; }
.asset-head > div { display: grid; gap: 2px; }
.muted { color: #7a8278; font-size: 12px; }
.fault-card { display: grid; grid-template-columns: 1.2fr 1fr; gap: 14px; padding: 10px 0; border-top: 1px dashed #ddd8c8; }
.fault-title { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; font-weight: 700; }
.upgrade { font-size: 12px; color: #93231c; display: inline-flex; align-items: center; gap: 4px; }
.fault-meta { display: flex; flex-wrap: wrap; gap: 14px; margin-top: 8px; font-size: 13px; color: #44504a; }
.merged-rows { margin-top: 8px; display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
.merged-chip { background: #f4ecd8; border-radius: 999px; padding: 2px 10px; font-size: 12px; color: #7d5a12; }
@media (max-width: 980px) { .faults-layout { grid-template-columns: 1fr; } .report-form { position: static; } .fault-card { grid-template-columns: 1fr; } }
</style>
