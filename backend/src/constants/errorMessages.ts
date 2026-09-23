export const ERROR_MESSAGES = {
  AUTH_REQUIRED: "missing bearer token",
  RBAC_DENIED: "role denied",
  VALIDATION_FAILED: "invalid payload",
  RATE_LIMITED: "too many requests",
  FAULT_MERGE_CONFLICT: "fault merge failed, fault, tickets and counters remain unchanged",
  FAULT_REPORT_FIELD_REQUIRED: "reporter_name, phone, asset_id, fault_type and severity are required",
  FAULT_SEVERITY_UNKNOWN: "severity must be one of LOW, MEDIUM, HIGH, CRITICAL",
  ASSET_NOT_FOUND: "grid asset does not exist"
};
