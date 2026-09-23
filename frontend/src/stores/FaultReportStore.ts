import { defineStore } from "pinia";
import {
  getFaultReportDetail,
  listFaultReport,
  saveFaultReport,
  type CreateFaultReportResult,
  type FaultReportQuery
} from "../api/FaultReport";
import type { CreateFaultReportPayload, FaultReport, FaultReportDetail } from "../types/FaultReport";
import { renderMergeAudit, renderSeverityUpgradeAudit } from "../constants/logTemplates";

interface SubmitFeedback extends CreateFaultReportResult {
  auditMessages: string[];
}

export const useFaultReportStore = defineStore("faultReport", {
  state: () => ({
    rows: [] as FaultReport[],
    detail: null as FaultReportDetail | null,
    loading: false,
    submitting: false,
    error: "" as string,
    lastFeedback: null as SubmitFeedback | null
  }),
  getters: {
    // 故障页只展示主故障（被并入的报修在主故障详情内呈现）
    primaryFaults: (state): FaultReport[] =>
      state.rows.filter((row) => row.merged_into_id === null),
    faultsByAsset: (state) => (assetId: number): FaultReport[] =>
      state.rows.filter((row) => row.asset_id === assetId && row.merged_into_id === null)
  },
  actions: {
    async load(query: FaultReportQuery = {}): Promise<void> {
      this.loading = true;
      this.error = "";
      try {
        this.rows = await listFaultReport(query);
        // 刷新后与接口一致：详情同步重取，避免本地残留
        if (this.detail) await this.loadDetail(this.detail.id);
      } catch (error) {
        this.error = (error as Error).message;
      } finally {
        this.loading = false;
      }
    },

    async loadDetail(id: number): Promise<void> {
      this.loading = true;
      this.error = "";
      try {
        this.detail = await getFaultReportDetail(id);
      } catch (error) {
        this.error = (error as Error).message;
      } finally {
        this.loading = false;
      }
    },

    clearDetail(): void {
      this.detail = null;
    },

    // 登记报修：命中重复则由后端并入原故障，不另建工单
    async submit(payload: CreateFaultReportPayload): Promise<SubmitFeedback | null> {
      this.submitting = true;
      this.error = "";
      try {
        const result = await saveFaultReport(payload);
        const auditMessages: string[] = [];
        if (result.merged) {
          const mergedReports = result.detail.merged_reports;
          const newReportId = mergedReports.length > 0 ? mergedReports[mergedReports.length - 1].id : 0;
          auditMessages.push(renderMergeAudit(newReportId, result.detail.id, result.detail.merged_count));
        }
        if (result.escalated && result.detail.severity_before && result.detail.severity_upgraded_to) {
          auditMessages.push(
            renderSeverityUpgradeAudit(
              result.detail.id,
              result.detail.severity_before,
              result.detail.severity_upgraded_to
            )
          );
        }
        this.lastFeedback = { ...result, auditMessages };
        // 提交完成后重新拉取，页面数据始终与接口一致
        await this.load();
        return this.lastFeedback;
      } catch (error) {
        this.error = (error as Error).message;
        // 合并失败时故障、工单和计数全部不变（后端事务回滚），刷新到接口状态
        await this.load();
        return null;
      } finally {
        this.submitting = false;
      }
    }
  }
});
