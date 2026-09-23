import { Router } from "express";
import { resetTables } from "../repositories/tables";

const router = Router();

// 仅在非生产环境暴露：把内存数据表恢复到种子状态，供本地端到端测试重复执行。
if (process.env.NODE_ENV !== "production") {
  router.post("/reset", (_req, res) => {
    resetTables();
    res.json({ reset: true });
  });
}

export default router;
