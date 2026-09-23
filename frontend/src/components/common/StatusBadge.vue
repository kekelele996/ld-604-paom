<script setup lang="ts">
import { computed } from "vue";
import { formatFaultStatus, formatSeverity, formatTicketStatus } from "../../utils/formatters";

const props = defineProps<{
  value: string;
  kind?: "fault" | "ticket" | "severity" | "raw";
}>();

const text = computed(() => {
  switch (props.kind) {
    case "fault":
      return formatFaultStatus(props.value);
    case "ticket":
      return formatTicketStatus(props.value);
    case "severity":
      return formatSeverity(props.value);
    default:
      return props.value.replace(/_/g, " ");
  }
});

const tone = computed(() => {
  if (props.kind === "severity") {
    return { "sev-critical": props.value === "CRITICAL", "sev-high": props.value === "HIGH", "sev-medium": props.value === "MEDIUM", "sev-low": props.value === "LOW" } as Record<string, boolean>;
  }
  if (props.kind === "fault") {
    return { "fault-open": props.value === "OPEN", "fault-merged": props.value === "MERGED", "fault-closed": props.value === "CLOSED" } as Record<string, boolean>;
  }
  if (props.kind === "ticket") {
    return { "ticket-locked": props.value === "RESTORED" || props.value === "CLOSED" } as Record<string, boolean>;
  }
  return {};
});
</script>

<template>
  <span class="badge" :class="tone">{{ text }}</span>
</template>
