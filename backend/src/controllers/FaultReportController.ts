import type { Request, Response, NextFunction } from "express";
import { faultReportService } from "../services/FaultReportService";
import { ServiceError } from "../utils/ServiceError";

const toOptionalNumber = (value: unknown): number | undefined => {
  if (value === undefined || value === null || value === "") return undefined;
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
};

// Controller 层统一包装成 HTTP 错误，业务异常信息不在此吞掉，交由 errorHandler 输出
const wrap = (handler: (req: Request, res: Response) => unknown | Promise<unknown>) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await handler(req, res);
    } catch (error) {
      if (error instanceof ServiceError) {
        next(error);
      } else {
        next(new ServiceError(500, "FAULT_REPORT_ERROR", (error as Error).message));
      }
    }
  };

export const faultReportController = {
  list: wrap((req, res) => {
    const rows = faultReportService.list({
      asset_id: toOptionalNumber(req.query.asset_id),
      status: typeof req.query.status === "string" ? req.query.status : undefined
    });
    res.json(rows);
  }),

  detail: wrap((req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      throw new ServiceError(400, "VALIDATION_FAILED", "故障编号无效");
    }
    res.json(faultReportService.detail(id));
  }),

  create: wrap(async (req, res) => {
    const outcome = await faultReportService.create({
      ...req.body,
      client_request_id: req.body?.client_request_id ?? req.header("x-idempotency-key")
    });
    res.status(outcome.reusedIdempotencyKey ? 200 : 201).json({
      merged: outcome.merged,
      escalated: outcome.escalated,
      reused: Boolean(outcome.reusedIdempotencyKey),
      detail: outcome.response
    });
  })
};
