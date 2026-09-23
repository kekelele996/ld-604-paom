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

const pageMap = {
  "/dashboard": DashboardPage,
  "/assets": AssetsPage,
  "/faults": FaultsPage,
  "/tickets": TicketsPage,
  "/parts": PartsPage
} as const;
const activeComponent = computed(() => pageMap[active.value as keyof typeof pageMap] ?? DashboardPage);
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
        <div><p class="eyebrow">grid-repair</p><h1>{{ current?.name }}</h1></div>
        <StatusBadge value="LOCAL_DB" kind="raw" />
      </section>
      <section v-if="active === '/dashboard'" class="metrics">
        <StatCard label="待派工故障" :value="0" />
        <StatCard label="进行中工单" :value="0" />
        <StatCard label="在值班组" :value="0" />
      </section>
      <component :is="activeComponent" />
    </main>
  </div>
</template>
