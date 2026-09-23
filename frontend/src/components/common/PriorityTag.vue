<script setup lang="ts">
import { computed } from "vue";
import { formatPriority } from "../../utils/formatters";

const props = defineProps<{
  priority: string;
  before?: string | null;
  locked?: boolean;
}>();

const text = computed(() => formatPriority(props.priority));
const upgraded = computed(() => Boolean(props.before && props.before !== props.priority));
</script>

<template>
  <span class="prio-tag" :class="[`prio-${priority.toLowerCase()}`, { locked }]">
    <strong>{{ text }}</strong>
    <template v-if="locked">
      <em>已复电保持原样</em>
    </template>
    <template v-else-if="upgraded">
      <em>{{ formatPriority(before as string) }} → {{ text }}</em>
    </template>
  </span>
</template>
