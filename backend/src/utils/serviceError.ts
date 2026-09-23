import { ERROR_CODES } from "../constants/errorCodes";

// service 与 controller 必须分别包装异常，禁止只在全局中间件吞掉。
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

export class ValidationServiceError extends ServiceError {
  constructor(message: string) {
    super(400, ERROR_CODES.VALIDATION_FAILED, message);
    this.name = "ValidationServiceError";
  }
}

export class MergeConflictServiceError extends ServiceError {
  constructor(message: string) {
    super(409, ERROR_CODES.FAULT_MERGE_CONFLICT, message);
    this.name = "MergeConflictServiceError";
  }
}
