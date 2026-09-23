import { restoreDb, snapshotDb } from "./inMemoryDb";

// 串行化所有写事务：同一时刻只有一个事务在执行，
// 并发提交同一报修时第二个请求只能看到第一个请求合并后的状态。
// 事务体内抛错则整库回滚到快照——故障、工单、合并计数全部不变。
let tail: Promise<unknown> = Promise.resolve();

export function runInTransaction<T>(fn: () => T): Promise<T> {
  const execute = (): T => {
    const snapshot = snapshotDb();
    try {
      return fn();
    } catch (error) {
      restoreDb(snapshot);
      throw error;
    }
  };
  const result = tail.then(execute, execute);
  tail = result.then(
    () => undefined,
    () => undefined
  );
  return result;
}
