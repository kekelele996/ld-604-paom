<script setup lang="ts">
export interface TimelineItem {
  id: string | number;
  time?: string;
  title: string;
  desc?: string;
  tone?: "merge" | "upgrade" | "normal" | "locked";
}

defineProps<{
  title?: string;
  items: TimelineItem[];
}>();
</script>

<template>
  <div class="timeline">
    <h3 v-if="title">{{ title }}</h3>
    <p v-if="items.length === 0" class="timeline-empty">暂无记录</p>
    <ol>
      <li v-for="item in items" :key="item.id" :class="['timeline-item', `tone-${item.tone ?? 'normal'}`]">
        <span class="dot" />
        <div>
          <p class="timeline-title">
            {{ item.title }}
            <time v-if="item.time">{{ item.time }}</time>
          </p>
          <p v-if="item.desc" class="timeline-desc">{{ item.desc }}</p>
        </div>
      </li>
    </ol>
  </div>
</template>
