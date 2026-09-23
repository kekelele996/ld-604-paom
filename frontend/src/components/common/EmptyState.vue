<script setup lang="ts">
withDefaults(defineProps<{ title?: string }>(), { title: "暂无数据" });
</script>
<template><div class="empty">{{ title }}</div></template>
