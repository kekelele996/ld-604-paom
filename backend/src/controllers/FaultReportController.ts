import type { Request, Response } from "express";
import { faultReportService } from "../services/FaultReportService";
import { ERROR_CODES } from "../constants/errorCodes";
import { ServiceError } from "../utils/serviceError";

// controller 层再包一次异常，禁止只在一个全局位置吞掉全部异常。
const toControllerError = (error: unknown): ServiceError => {
  if (error instanceof ServiceError) return error;
  return new ServiceError(
    500,
    ERROR_CODES.VALIDATION_FAILED,
    error instanceof Error ? error.message : "fault report request failed"
  );
};

export const faultReportController = {
  list: async (_req: Request, res: Response) => {
    try {
      res.json(faultReportService.list());
    } catch (error) {
      const wrapped = toControllerError(error);
      res.status(wrapped.status).json({ code: wrapped.code, message: wrapped.message });
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      const result = await faultReportService.create(req.body ?? {});
      res.status(201).json(result);
    } catch (error) {
      const wrapped = toControllerError(error);
      res.status(wrapped.status).json({ code: wrapped.code, message: wrapped.message });
    }
  }
};
