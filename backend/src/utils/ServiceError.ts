import { ERROR_CODES } from "../constants/errorCodes";

// Service 层统一抛出的带 HTTP 状态和错误码的异常，由 controller/errorHandler 分别包装
export class ServiceError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "ServiceError";
    this.status = status;
    this.code = code;
  }
}

export const validationError = (message: string) =>
  new ServiceError(400, ERROR_CODES.VALIDATION_FAILED, message);

export const notFoundError = (message: string) =>
  new ServiceError(404, ERROR_CODES.NOT_FOUND, message);

export const conflictError = (message: string) =>
  new ServiceError(409, ERROR_CODES.CONFLICT, message);
