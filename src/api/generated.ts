/* eslint-disable */
/**
 * AUTO-GENERATED FILE - DO NOT EDIT.
 * Generated from the FastAPI OpenAPI schema by:
 *   server/.venv/bin/python -m server.generate_types
 */

/** Actor identity supplied by the caller. ``username``/``employee_id`` are preferred, but ``name``/``id`` are accepted so the dashboard's existing ``IncidentActionActor`` shape can be posted unchanged. */
export interface ActorIn {
  username?: string | null;
  name?: string | null;
  employee_id?: string | null;
  id?: string | null;
  user_id?: number | null;
}

export interface AuditEntry {
  id: number;
  action: string;
  session_id?: number | null;
  scan_id?: number | null;
  barcode_value?: string | null;
  bay_id?: number | null;
  truck_reg?: string | null;
  indent_no?: string | null;
  reason?: string | null;
  user_id?: number | null;
  username_given: string;
  employee_id_given?: string | null;
  client_ip?: string | null;
  device?: string | null;
  outcome: string;
  at: string;
  prev_hash: string;
  entry_hash: string;
  hash_version: number;
}

export interface AuditVerifyResponse {
  ok: boolean;
  entries: number;
  head_hash?: string | null;
  broken_at?: number | null;
  error?: string | null;
  checked_at: string;
}

export interface ErrorResponse {
  detail: string;
}

export interface HTTPValidationError {
  detail?: Array<ValidationError>;
}

export interface HealthResponse {
  status: string;
  database: string;
  audit_chain_ok: boolean;
  audit_entries: number;
  scan_cursor: number;
}

export interface Incident {
  id: number;
  session_id: number;
  camera_id: number;
  type: string;
  severity: "low" | "medium" | "high" | "critical";
  occurred_at: string;
  barcode_value?: string | null;
  status: "open" | "reviewed" | "dismissed";
  details: string;
  bay_id?: number | null;
  bay_name?: string | null;
  truck_reg?: string | null;
  notes?: string | null;
  dismissal_reason?: string | null;
  reviewed_by?: string | null;
  reviewed_by_id?: string | null;
  reviewed_at?: string | null;
  dismissed_by?: string | null;
  dismissed_by_id?: string | null;
  dismissed_at?: string | null;
  detections?: Array<Record<string, unknown>>;
}

export interface IncidentReviewRequest {
  status?: "reviewed" | "dismissed";
  reason?: string | null;
  notes?: string | null;
  actor?: ActorIn;
}

export interface IncidentReviewResponse {
  incident: Incident;
  audit: AuditEntry;
}

export interface Kpis {
  totalDispatched: number;
  dispatchTarget: number;
  trucksCleared: number;
  trucksTarget: number;
  avgTatMinutes: number;
  tatBenchmarkMinutes: number;
  clearanceRate: number;
  refusalCount: number;
  activeAlarmsCount: number;
  as_of: string;
}

export interface LiveBay {
  bayId: number;
  bayName: string;
  dockLocation: string;
  truckReg: string;
  indentNo: string;
  licenceNo: string;
  allocatedQty: number;
  loadedQty: number;
  beltState: "running" | "paused" | "stopped" | "warning";
  status: "loading" | "preparing" | "stopped" | "standby";
  stopCause: string | null;
  paceCpm: number;
  gateFlag: "pass" | "divert" | "waiting";
  gateReason: string;
  lastScannedBarcode: string;
  estimatedRemainingMinutes: number;
  sessionDurationMinutes: number;
  supervisor: Supervisor;
  lastUpdated: number;
}

export interface Removal {
  id: number;
  session_id: number;
  truck_reg: string;
  indent_no: string;
  barcode_value: string;
  reason: string;
  authorizer: string;
  employee_id: string;
  timestamp: string;
  requested_by?: string | null;
  requested_by_id?: string | null;
  requested_at?: string | null;
  approved_by?: string | null;
  approved_by_id?: string | null;
  approved_at?: string | null;
  hash_verified?: boolean;
  hash?: string | null;
  removal_event_id?: number | null;
  removed_carton_id?: number | null;
  carton_count?: number;
}

export interface RemovalCreateRequest {
  session_id?: number | null;
  scan_id?: number | null;
  barcode_value?: string | null;
  reason: string;
  actor?: ActorIn;
  answers?: Array<Record<string, unknown>> | null;
}

export interface RemovalCreateResponse {
  removal: Removal;
  audit: AuditEntry;
}

export interface Session {
  id: number;
  truck_id: number;
  manifest_id?: number | null;
  started_at?: string | null;
  ended_at?: string | null;
  status: string;
  operator?: string | null;
  notes?: string | null;
  created_at?: string | null;
  total_boxes_loaded?: number | null;
  bay_id?: number | null;
  allocation_id?: number | null;
  indent_number?: string | null;
  licence_no?: string | null;
  indent_qty?: number | null;
  bay_phase?: string | null;
  mode?: string | null;
  sending_paused?: boolean | number | null;
  truck_confirmed_by?: number | null;
  truck_confirmed_at?: string | null;
  closed_by?: number | null;
  close_reason?: string | null;
  lock_number?: string | null;
  lock_photo_path?: string | null;
  locked_by?: number | null;
  locked_at?: string | null;
  truck_reg?: string | null;
  bay_name?: string | null;
}

export interface Snapshot {
  bays: Array<LiveBay>;
  incidents: Array<Incident>;
  sessions: Array<Session>;
  removals: Array<Removal>;
  kpis: Kpis;
  scan_cursor: number;
  seq: number;
  timestamp: number;
  incident_count: number;
}

export interface Supervisor {
  userId: number;
  name: string;
  employeeId: string;
  shift: string;
  phoneExt: string;
  avatarColor: string;
  rating: number;
  avgTatMinutes: number;
  paceCpm: number;
  removalsCount: number;
  activeAlarmsCount: number;
}

export interface ValidationError {
  loc: Array<string | number>;
  msg: string;
  type: string;
  input?: unknown;
  ctx?: Record<string, unknown>;
}

export interface ApiOperations {
  "GET /api/audit": {
    response: Array<AuditEntry>;
  };
  "GET /api/audit/verify": {
    response: AuditVerifyResponse;
  };
  "GET /api/health": {
    response: HealthResponse;
  };
  "GET /api/incidents": {
    response: Array<Incident>;
  };
  "GET /api/incidents/{incident_id}": {
    response: Incident;
  };
  "POST /api/incidents/{incident_id}/review": {
    request: IncidentReviewRequest;
    response: IncidentReviewResponse;
  };
  "GET /api/removals": {
    response: Array<Removal>;
  };
  "POST /api/removals": {
    request: RemovalCreateRequest;
    response: RemovalCreateResponse;
  };
  "GET /api/reports/dispatch.csv": {
    response: string;
  };
  "GET /api/snapshot": {
    response: Snapshot;
  };
}
