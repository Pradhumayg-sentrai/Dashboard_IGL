"""Pydantic models that define the public API contract.

These models are also the source of ``src/api/generated.ts``.  Keep response
models explicit (rather than returning raw dictionaries) so the generated
TypeScript stays useful.
"""

from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


class ActorIn(BaseModel):
    """Actor identity supplied by the caller.

    ``username``/``employee_id`` are preferred, but ``name``/``id`` are accepted
    so the dashboard's existing ``IncidentActionActor`` shape can be posted
    unchanged.
    """

    model_config = ConfigDict(extra="ignore")

    username: str | None = None
    name: str | None = None
    employee_id: str | None = None
    id: str | None = None
    user_id: int | None = None

    @property
    def resolved_username(self) -> str:
        return (self.username or self.name or "api").strip() or "api"

    @property
    def resolved_employee_id(self) -> str | None:
        value = self.employee_id or self.id
        return value.strip() if isinstance(value, str) and value.strip() else None


class IncidentReviewRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")

    status: Literal["reviewed", "dismissed"] = "reviewed"
    reason: str | None = None
    notes: str | None = None
    actor: ActorIn = Field(default_factory=ActorIn)

    @field_validator("reason", "notes")
    @classmethod
    def _strip_text(cls, value: str | None) -> str | None:
        if value is None:
            return None
        value = value.strip()
        return value or None


class RemovalCreateRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")

    session_id: int | None = None
    scan_id: int | None = None
    barcode_value: str | None = None
    reason: str
    actor: ActorIn = Field(default_factory=ActorIn)
    answers: list[dict[str, Any]] | None = None

    @field_validator("barcode_value")
    @classmethod
    def _strip_barcode(cls, value: str | None) -> str | None:
        if value is None:
            return None
        value = value.strip()
        return value or None

    @field_validator("reason")
    @classmethod
    def _require_reason(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("A removal reason is required.")
        return value

    def validate_scan_selector(self) -> None:
        if self.scan_id is None and not self.barcode_value:
            raise ValueError("Provide either scan_id or barcode_value.")


class Supervisor(BaseModel):
    userId: int
    name: str
    employeeId: str
    shift: str
    phoneExt: str
    avatarColor: str
    rating: float
    avgTatMinutes: float
    paceCpm: float
    removalsCount: int
    activeAlarmsCount: int


class LiveBay(BaseModel):
    bayId: int
    bayName: str
    dockLocation: str
    truckReg: str
    indentNo: str
    licenceNo: str
    allocatedQty: int
    loadedQty: int
    beltState: Literal["running", "paused", "stopped", "warning"]
    status: Literal["loading", "preparing", "stopped", "standby"]
    stopCause: str | None
    paceCpm: float
    gateFlag: Literal["pass", "divert", "waiting"]
    gateReason: str
    lastScannedBarcode: str
    estimatedRemainingMinutes: float
    sessionDurationMinutes: float
    supervisor: Supervisor
    lastUpdated: int


class Incident(BaseModel):
    id: int
    session_id: int
    camera_id: int
    type: str
    severity: Literal["low", "medium", "high", "critical"]
    occurred_at: str
    barcode_value: str | None = None
    status: Literal["open", "reviewed", "dismissed"]
    details: str
    bay_id: int | None = None
    bay_name: str | None = None
    truck_reg: str | None = None
    notes: str | None = None
    dismissal_reason: str | None = None
    reviewed_by: str | None = None
    reviewed_by_id: str | None = None
    reviewed_at: str | None = None
    dismissed_by: str | None = None
    dismissed_by_id: str | None = None
    dismissed_at: str | None = None
    detections: list[dict[str, Any]] = Field(default_factory=list)


class Session(BaseModel):
    id: int
    truck_id: int
    manifest_id: int | None = None
    started_at: str | None = None
    ended_at: str | None = None
    status: str
    operator: str | None = None
    notes: str | None = None
    created_at: str | None = None
    total_boxes_loaded: int | None = None
    bay_id: int | None = None
    allocation_id: int | None = None
    indent_number: str | None = None
    licence_no: str | None = None
    indent_qty: int | None = None
    bay_phase: str | None = None
    mode: str | None = None
    sending_paused: bool | int | None = None
    truck_confirmed_by: int | None = None
    truck_confirmed_at: str | None = None
    closed_by: int | None = None
    close_reason: str | None = None
    lock_number: str | None = None
    lock_photo_path: str | None = None
    locked_by: int | None = None
    locked_at: str | None = None
    truck_reg: str | None = None
    bay_name: str | None = None


class Removal(BaseModel):
    id: int
    session_id: int
    truck_reg: str
    indent_no: str
    barcode_value: str
    reason: str
    authorizer: str
    employee_id: str
    timestamp: str
    requested_by: str | None = None
    requested_by_id: str | None = None
    requested_at: str | None = None
    approved_by: str | None = None
    approved_by_id: str | None = None
    approved_at: str | None = None
    hash_verified: bool = False
    hash: str | None = None
    removal_event_id: int | None = None
    removed_carton_id: int | None = None
    carton_count: int = 1


class Kpis(BaseModel):
    totalDispatched: int
    dispatchTarget: int
    trucksCleared: int
    trucksTarget: int
    avgTatMinutes: float
    tatBenchmarkMinutes: float
    clearanceRate: float
    refusalCount: int
    activeAlarmsCount: int
    as_of: str


class Snapshot(BaseModel):
    bays: list[LiveBay]
    incidents: list[Incident]
    sessions: list[Session]
    removals: list[Removal]
    kpis: Kpis
    scan_cursor: int
    seq: int
    timestamp: int
    incident_count: int


class AuditEntry(BaseModel):
    id: int
    action: str
    session_id: int | None = None
    scan_id: int | None = None
    barcode_value: str | None = None
    bay_id: int | None = None
    truck_reg: str | None = None
    indent_no: str | None = None
    reason: str | None = None
    user_id: int | None = None
    username_given: str
    employee_id_given: str | None = None
    client_ip: str | None = None
    device: str | None = None
    outcome: str
    at: str
    prev_hash: str
    entry_hash: str
    hash_version: int


class IncidentReviewResponse(BaseModel):
    incident: Incident
    audit: AuditEntry


class RemovalCreateResponse(BaseModel):
    removal: Removal
    audit: AuditEntry


class AuditVerifyResponse(BaseModel):
    ok: bool
    entries: int
    head_hash: str | None = None
    broken_at: int | None = None
    error: str | None = None
    checked_at: str


class HealthResponse(BaseModel):
    status: str
    database: str
    audit_chain_ok: bool
    audit_entries: int
    scan_cursor: int


class ErrorResponse(BaseModel):
    detail: str
