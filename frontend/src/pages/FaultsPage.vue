<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { storeToRefs } from "pinia";
import { useFaultReportStore } from "../stores/FaultReportStore";
import { listGridAsset } from "../api/GridAsset";
import type { GridAsset } from "../types/GridAsset";
import type { FaultReport, FaultReportDetail } from "../types/FaultReport";
import { createFaultReportForm } from "../constructors/FaultReportConstructor";
import { FaultType } from "../types/FaultType";
import { Severity, SeverityText } from "../constants/Severity";
import { MERGE_WINDOW_MINUTES, TICKET_LOCKED_STATUSES } from "../constants/FaultStatus";
import { formatDate, formatFaultStatus, formatSeverity, formatSeverityTrace, formatTicketStatus } from "../utils/formatters";
import StatusBadge from "../components/common/StatusBadge.vue";
import PriorityTag from "../components/common/PriorityTag.vue";
import TimelineList, { type TimelineItem } from "../components/common/TimelineList.vue";
import EmptyState from "../components/common/EmptyState.vue";

const faultStore = useFaultReportStore();
const { rows, detail, loading, submitting, error } = storeToRefs(faultStore);

const assets = ref<GridAsset[]>([]);
const assetName = (assetId: number): string => {
  const asset = assets.value.find((item) => item.id === assetId);
  return asset ? `${asset.asset_code} · ${asset.feeder_line}` : `资产#${assetId}`;
};

const selectedAsset = ref<number | undefined>(undefined);
const form = reactive(createFaultReportForm(1));

const feedback = ref<{ merged: boolean; escalated: boolean; reused: boolean; messages: string[] } | null>(null);

// 主故障按资产分组展示
const groups = computed(() => {
  const primaries = rows.value.filter((row) => row.merged_into_id === null);
  const map = new Map<number, FaultReport[]>();
  for (const row of primaries) {
    const list = map.get(row.asset_id) ?? [];
    list.push(row);
    map.set(row.asset_id, list);
  }
  return [...map.entries()].map(([assetId, faults]) => ({
    assetId,
    label: assetName(assetId),
    faults: faults.sort((a, b) => +new Date(b.reported_at) - +new Date(a.reported_at))
  }));
});

const isLockedTicket = (status: string) => (TICKET_LOCKED_STATUSES as readonly string[]).includes(status);

// 故障详情时间线：主故障 + 每次并入 + 升级
const detailTimeline = computed<TimelineItem[]>(() => {
  if (!detail.value) return [];
  const items: TimelineItem[] = [];
  const d = detail.value as FaultReportDetail;
  items.push({
    id: `self-${d.id}`,
    time: formatDate(d.reported_at),
    title: `首次报修 #${d.id}（${d.reporter_name}）`,
    desc: d.address_desc,
    tone: "normal"
  });
  for (const merged of d.merged_reports) {
    items.push({
      id: `merged-${merged.id}`,
      time: formatDate(merged.reported_at),
      title: `重复报修 #${merged.id} 并入本故障（${merged.reporter_name}）`,
      desc: merged.address_desc,
      tone: "merge"
    });
  }
  if (d.severity_before && d.severity_upgraded_to && d.severity_before !== d.severity_upgraded_to) {
    items.push({
      id: "upgrade",
      title: `严重度升级：${formatSeverityTrace(d.severity_before, d.severity_upgraded_to)}`,
      tone: "upgrade"
    });
  }
  return items.sort((a, b) => +new Date(b.time ?? 0) - +new Date(a.time ?? 0));
});

const selectFault = (row: FaultReport) => {
  feedback.value = null;
  faultStore.loadDetail(row.id);
};

const submitReport = async () => {
  feedback.value = null;
  const payload = createFaultReportForm(form.asset_id, { ...form });
  const result = await faultStore.submit(payload);
  if (result) {
    feedback.value = { merged: result.merged, escalated: result.escalated, reused: result.reused, messages: result.auditMessages };
    if (result.detail?.id) await faultStore.loadDetail(result.detail.id);
  }
};

const refresh = async () => {
  feedback.value = null;
  await faultStore.load(selectedAsset.value !== undefined ? { asset_id: selectedAsset.value } : {});
};

const onAssetFilter = async (assetId: number | undefined) => {
  selectedAsset.value = assetId;
  await faultStore.load(assetId !== undefined ? { asset_id: assetId } : {});
};

onMounted(async () => {
  assets.value = await listGridAsset();
  form.asset_id = assets.value[0]?.id ?? 1;
  await faultStore.load();
  const firstPrimary = faultStore.rows.find((row) => row.merged_into_id === null);
  if (firstPrimary) selectFault(firstPrimary);
});
</script>

<template>
  <section class="faults-page">
    <header class="faults-head">
      <div>
        <p class="eyebrow">Fault Reports</p>
        <h2>故障报修 · 重复合并与严重度升级</h2>
        <p class="hint">同一资产 {{ MERGE_WINDOW_MINUTES }} 分钟内出现未关闭故障时，新报修并入原故障，不另建工单；更严重时故障等级与未复电工单优先级只升不降。</p>
      </div>
      <button class="btn" :disabled="loading" @click="refresh">{{ loading ? "刷新中…" : "刷新（与接口同步）" }}</button>
    </header>

    <p v-if="error" class="error-banner">{{ error }}</p>

    <div class="faults-layout">
      <div class="panel">
        <h3>登记报修</h3>
        <form class="report-form" @submit.prevent="submitReport">
          <label>报修资产
            <select v-model.number="form.asset_id">
              <option v-for="asset in assets" :key="asset.id" :value="asset.id">
                {{ asset.asset_code }} · {{ asset.feeder_line }}
              </option>
            </select>
          </label>
          <label>报修人
            <input v-model="form.reporter_name" required maxlength="20" placeholder="姓名" />
          </label>
          <label>联系电话
            <input v-model="form.phone" required pattern="[\d-]{6,20}" placeholder="手机号" />
          </label>
          <label>故障类型
            <select v-model="form.fault_type">
              <option v-for="type in FaultType" :key="type" :value="type">{{ type.replace(/_/g, " ") }}</option>
            </select>
          </label>
          <label>严重度
            <select v-model="form.severity">
              <option v-for="sev in Severity" :key="sev" :value="sev">{{ SeverityText[sev] }}（{{ sev }}）</option>
            </select>
          </label>
          <label>报修渠道
            <input v-model="form.report_channel" required placeholder="HOTLINE / APP / PATROL" />
          </label>
          <label class="full">地址/现象描述
            <textarea v-model="form.address_desc" required rows="2" placeholder="故障地址与现象" />
          </label>
          <button class="btn primary full" type="submit" :disabled="submitting">
            {{ submitting ? "提交中…" : "提交报修" }}
          </button>
        </form>

        <div v-if="feedback" class="feedback" :class="{ merged: feedback.merged }">
          <p v-if="feedback.reused">检测到重复/并发提交，已按幂等键只合并一次。</p>
          <p v-else-if="feedback.merged">该报修已并入原故障 #{{ detail?.id }}，未另建工单。</p>
          <p v-else>已登记为新的主故障。</p>
          <p v-if="feedback.escalated" class="escalated">严重度升级，未复电工单优先级同步只升不降；已复电/已关闭工单保持原样。</p>
          <ul v-if="feedback.messages.length">
            <li v-for="(msg, i) in feedback.messages" :key="i">{{ msg }}</li>
          </ul>
        </div>
      </div>

      <div class="panel faults-list-panel">
        <div class="list-head">
          <h3>按资产查看故障</h3>
          <select :value="selectedAsset" @change="onAssetFilter(($event.target as HTMLSelectElement).value ? Number(($event.target as HTMLSelectElement).value) : undefined)">
            <option :value="undefined">全部资产</option>
            <option v-for="asset in assets" :key="asset.id" :value="asset.id">{{ asset.asset_code }}</option>
          </select>
        </div>

        <EmptyState v-if="groups.length === 0 && !loading" />
        <article v-for="group in groups" :key="group.assetId" class="asset-group">
          <h4 class="asset-title">{{ group.label }}<span>{{ group.faults.length }} 起未关闭/历史故障</span></h4>
          <div
            v-for="fault in group.faults"
            :key="fault.id"
            class="fault-card"
            :class="{ active: detail?.id === fault.id }"
            @click="selectFault(fault)"
          >
            <div class="fault-card-main">
              <strong>故障 #{{ fault.id }}</strong>
              <StatusBadge :value="fault.status" kind="fault" />
              <StatusBadge :value="fault.severity" kind="severity" />
            </div>
            <p class="fault-meta">
              {{ fault.address_desc }} · {{ formatDate(fault.reported_at) }}
            </p>
            <div class="fault-stats">
              <span>合并次数 <b>{{ fault.merged_count }}</b></span>
              <span>升级轨迹 <b>{{ formatSeverityTrace(fault.severity_before, fault.severity_upgraded_to) }}</b></span>
              <span>当前等级 <b>{{ formatSeverity(fault.severity) }}</b></span>
            </div>
          </div>
        </article>
      </div>

      <div class="panel fault-detail-panel" v-if="detail">
        <h3>故障 #{{ detail.id }} 详情</h3>
        <p class="detail-status">
          <StatusBadge :value="detail.status" kind="fault" />
          <StatusBadge :value="detail.severity" kind="severity" />
        </p>
        <dl class="detail-grid">
          <div><dt>所属资产</dt><dd>{{ assetName(detail.asset_id) }}</dd></div>
          <div><dt>故障状态</dt><dd>{{ formatFaultStatus(detail.status) }}</dd></div>
          <div><dt>合并次数</dt><dd>累计并入 {{ detail.merged_count }} 条重复报修</dd></div>
          <div><dt>升级前等级</dt><dd>{{ detail.severity_before ? formatSeverity(detail.severity_before) : "—" }}</dd></div>
          <div><dt>升级后等级</dt><dd>{{ detail.severity_upgraded_to ? formatSeverity(detail.severity_upgraded_to) : "未升级" }}</dd></div>
          <div><dt>首次报修</dt><dd>{{ formatDate(detail.reported_at) }}</dd></div>
        </dl>

        <h4>已关联工单（{{ detail.tickets.length }}）</h4>
        <EmptyState v-if="detail.tickets.length === 0" />
        <table v-else class="ticket-table">
          <thead><tr><th>工单</th><th>状态</th><th>优先级</th><th>派单时间</th></tr></thead>
          <tbody>
            <tr v-for="ticket in detail.tickets" :key="ticket.id">
              <td>#{{ ticket.id }}</td>
              <td><StatusBadge :value="ticket.status" kind="ticket" /></td>
              <td>
                <PriorityTag
                  :priority="ticket.priority"
                  :before="ticket.priority_before"
                  :locked="isLockedTicket(ticket.status)"
                />
              </td>
              <td>{{ formatDate(ticket.assigned_at) }}</td>
            </tr>
          </tbody>
        </table>

        <TimelineList title="合并与升级记录" :items="detailTimeline" />
      </div>
    </div>
  </section>
</template>
