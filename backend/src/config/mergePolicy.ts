// 重复合并窗口：同一资产在该毫秒数内出现未关闭故障时，新报修并入原故障。
// 新增配置需同步 .env.example、docker-compose.yml 与 README。
export const MERGE_WINDOW_MS = Number(process.env.FAULT_MERGE_WINDOW_MINUTES ?? 30) * 60 * 1000;

// 并发提交同一报修（无显式 client_token 时按内容指纹判重）的幂等保留窗口。
export const IDEMPOTENT_TTL_MS = 60 * 1000;
export const FINGERPRINT_TTL_MS = 5 * 1000;
