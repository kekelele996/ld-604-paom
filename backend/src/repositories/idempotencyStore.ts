import type { FaultReportDetailDto } from "../constructors/FaultReportDtoFactory";

export interface IdempotentCreateResult {
  response: FaultReportDetailDto;
  merged: boolean;
  escalated: boolean;
}

interface CacheEntry {
  result: IdempotentCreateResult;
  expiresAt: number;
}

// 报修幂等键缓存：相同 client_request_id 的并发/重试提交直接复用首次结果
const TTL_MS = 60 * 60 * 1000;
const cache = new Map<string, CacheEntry>();

export const idempotencyStore = {
  get(requestId: string): IdempotentCreateResult | undefined {
    const entry = cache.get(requestId);
    if (!entry) return undefined;
    if (entry.expiresAt < Date.now()) {
      cache.delete(requestId);
      return undefined;
    }
    return entry.result;
  },

  set(requestId: string, result: IdempotentCreateResult): void {
    cache.set(requestId, { result, expiresAt: Date.now() + TTL_MS });
  },

  clear(): void {
    cache.clear();
  }
};
