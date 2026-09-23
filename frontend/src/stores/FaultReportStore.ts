import { defineStore } from "pinia";
import { listFaultReport, saveFaultReport } from "../api/FaultReport";
import { useGridAssetStore } from "./GridAssetStore";
import { useRepairTicketStore } from "./RepairTicketStore";
import type { FaultReportFormPayload, FaultReportSaveResult, FaultReportView } from "../types/FaultReport";

interface FaultReportState {
  rows: FaultReportView[];
  loading: boolean;
  submitting: boolean;
  lastResult: FaultReportSaveResult | null;
  lastError: string;
}

export const useFaultReportStore = defineStore("faultReport", {
  state: (): FaultReportState => ({
    rows: [],
    loading: false,
    submitting: false,
    lastResult: null,
    lastError: ""
  }),
  actions: {
    async load() {
      this.loading = true;
      try {
        // 刷新后与接口一致：视图（合并次数/升级前后等级/关联工单）全部来自后端。
        this.rows = await listFaultReport();
      } finally {
        this.loading = false;
      }
    },
    async submit(payload: FaultReportFormPayload): Promise<FaultReportSaveResult> {
      this.submitting = true;
      this.lastError = "";
      try {
        const result = await saveFaultReport(payload);
        this.lastResult = result;
        // 提交成功后立即与接口对齐：故障、资产、工单（含升级后的优先级）全部重新拉取，
        // 因此页面即时展示与浏览器刷新后看到的内容完全一致。
        const assetStore = useGridAssetStore();
        const ticketStore = useRepairTicketStore();
        await Promise.all([this.load(), assetStore.load(), ticketStore.load()]);
        return result;
      } catch (error) {
        this.lastError = error instanceof Error ? error.message : String(error);
        throw error;
      } finally {
        this.submitting = false;
      }
    }
  }
});
