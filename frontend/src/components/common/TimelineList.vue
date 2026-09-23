<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string;
    items?: { key: string | number; text: string; tone?: string }[];
  }>(),
  { title: "", items: () => [] }
);
</script>

<template>
  <div class="timeline">
    <strong v-if="title">{{ title }}</strong>
    <slot v-if="!items.length"></slot>
    <ol v-else>
      <li v-for="item in items" :key="item.key" :class="item.tone">
        <span class="dot"></span><span class="text">{{ item.text }}</span>
      </li>
    </ol>
  </div>
</template>

<style scoped>
.timeline {
  border: 1px dashed #b8b09f;
  border-radius: 8px;
  padding: 12px 14px;
  background: #fdfcf7;
}
ol {
  list-style: none;
  margin: 8px 0 0;
  padding: 0;
  display: grid;
  gap: 8px;
}
li {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #3c463d;
}
.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #8a9385;
  flex: none;
}
li.escalated .dot {
  background: #c84a2e;
}
li.merged .dot {
  background: #b8862e;
}
li.ticket .dot {
  background: #355f46;
}
</style>
