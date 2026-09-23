<script setup lang="ts">
import { computed } from "vue";
import { formatSeverity, formatTicketPriority } from "../../utils/formatters";

const props = withDefaults(
  defineProps<{
    title?: string;
    // severity 渲染故障等级；priority 渲染工单优先级；缺省时退化为占位标题。
    kind?: "severity" | "priority";
    value?: string;
  }>(),
  { title: "", kind: "priority", value: "" }
);

const tone = computed(() => {
  const rankMap: Record<string, string> = {
    LOW: "lv1",
    ROUTINE: "lv1",
    MEDIUM: "lv2",
    URGENT: "lv2",
    HIGH: "lv3",
    EXPRESS: "lv3",
    CRITICAL: "lv4",
    EMERGENCY: "lv4"
  };
  return rankMap[props.value] ?? "lv1";
});

const label = computed(() => {
  if (!props.value) return props.title || "PriorityTag";
  return props.kind === "severity" ? formatSeverity(props.value) : formatTicketPriority(props.value);
});
</script>

<template>
  <span class="priority-tag" :class="tone">
    <strong>{{ label }}</strong>
  </span>
</template>

<style scoped>
.priority-tag {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 2px 10px;
  font-size: 12px;
  font-weight: 800;
  white-space: nowrap;
}
.lv1 { background: #e7efe6; color: #2f5233; }
.lv2 { background: #fdf3d7; color: #7d5a12; }
.lv3 { background: #fbe2cf; color: #9a4a16; }
.lv4 { background: #f6d5d2; color: #93231c; }
</style>
