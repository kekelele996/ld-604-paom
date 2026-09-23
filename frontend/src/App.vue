<script setup lang="ts">
import { computed, ref } from "vue";
import { routes } from "./router/routes";
import StatusBadge from "./components/common/StatusBadge.vue";
import StatCard from "./components/common/StatCard.vue";
import FaultsPage from "./pages/FaultsPage.vue";
import DashboardPage from "./pages/DashboardPage.vue";
import AssetsPage from "./pages/AssetsPage.vue";
import TicketsPage from "./pages/TicketsPage.vue";
import PartsPage from "./pages/PartsPage.vue";

const active = ref<string>(routes[0]?.route ?? "/dashboard");
const current = computed(() => routes.find((route) => route.route === active.value) ?? routes[0]);
</script>

<template>
  <div class="shell">
    <aside>
      <div class="brand">电力配网抢修工单系统</div>
      <nav>
        <button v-for="route in routes" :key="route.route" :class="{ active: active === route.route }" @click="active = route.route">{{ route.name }}</button>
      </nav>
    </aside>
    <main class="page">
      <section class="page-head">
        <div>
          <p class="eyebrow">grid-repair</p>
          <h1>{{ current?.name }}</h1>
        </div>
        <StatusBadge value="LOCAL_DATA" />
      </section>

      <FaultsPage v-if="active === '/faults'" />
      <template v-else>
        <section class="metrics"><StatCard label="核心模型" :value="5" /><StatCard label="共享枚举" :value="5" /><StatCard label="合并窗口(分钟)" :value="30" /></section>
        <section class="workbench">
          <div class="panel wide">
            <h2>{{ current?.name }}工作台</h2>
            <p class="muted">请切换到“故障报修”页面体验重复合并、严重度升级与关联工单展示。</p>
          </div>
          <div class="panel"><h2>联动检查</h2><p>页面、store、API、构造器、日志模板和枚举常量均按分层拆分。</p></div>
        </section>
      </template>
    </main>
  </div>
</template>
