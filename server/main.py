"""FastAPI service for the IGL loading-bay dashboard."""

from __future__ import annotations

import asyncio
import contextlib
import json
import time
from contextlib import asynccontextmanager
from typing import AsyncIterator, Literal

from fastapi import Depends, FastAPI, HTTPException, Query, Request, Response, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse
from sqlalchemy.engine import Connection
from starlette.websockets import WebSocketDisconnect

from .audit import bootstrap_audit_schema, verify_chain
from .db import get_read_db, get_write_db
from .repository import (
    bay_deltas_for_sessions,
    create_removal,
    create_review,
    dispatch_report,
    fetch_snapshot,
    get_incident,
    health,
    incidents_after,
    list_audit,
    list_incidents,
    list_removals,
    max_incident_id,
    scan_cursor,
    scans_after,
)
from .schemas import (
    AuditEntry,
    AuditVerifyResponse,
    ErrorResponse,
    HealthResponse,
    Incident,
    IncidentReviewRequest,
    IncidentReviewResponse,
    Removal,
    RemovalCreateRequest,
    RemovalCreateResponse,
    Snapshot,
)


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    # Upgrade the legacy authorisation_log once, then serve.  This does not
    # touch alembic_version or any other table.
    bootstrap_audit_schema()
    yield


app = FastAPI(
    title="IGL Dashboard API",
    version="1.0.0",
    description=(
        "Read-mostly API for the IGL loading-bay dashboard. Snapshot and report "
        "endpoints read from the existing SQLite database; incident reviews and "
        "carton removals append to the hash-chained authorisation log."
    ),
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Total-Count", "Content-Disposition"],
)


def _client_ip(request: Request) -> str | None:
    if request.client is None:
        return None
    return request.client.host


@app.get("/", include_in_schema=False)
def root() -> dict[str, str]:
    return {
        "service": "IGL Dashboard API",
        "docs": "/docs",
        "snapshot": "/api/snapshot",
        "websocket": "/ws",
    }


@app.get("/api/health", response_model=HealthResponse, tags=["system"])
def api_health(connection: Connection = Depends(get_read_db)) -> dict:
    return health(connection)


@app.get("/api/snapshot", response_model=Snapshot, tags=["dashboard"])
def api_snapshot(
    connection: Connection = Depends(get_read_db),
    incident_limit: int = Query(250, ge=1, le=2000, include_in_schema=False),
) -> dict:
    return fetch_snapshot(connection, seq=1, incident_limit=incident_limit)


@app.get(
    "/api/incidents",
    response_model=list[Incident],
    responses={200: {"headers": {"X-Total-Count": {"schema": {"type": "integer"}}}}},
    tags=["incidents"],
)
def api_incidents(
    response: Response,
    connection: Connection = Depends(get_read_db),
    status: list[Literal["open", "reviewed", "dismissed"]] | None = Query(None),
    severity: list[Literal["low", "medium", "high", "critical"]] | None = Query(None),
    incident_type: str | None = Query(None, alias="type"),
    session_id: int | None = Query(None),
    bay_id: int | None = Query(None),
    search: str | None = Query(None),
    date_from: str | None = Query(None, alias="from"),
    date_to: str | None = Query(None, alias="to"),
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    sort: Literal["occurred_at", "id", "type", "status", "severity"] = Query("occurred_at"),
    order: Literal["asc", "desc"] = Query("desc"),
) -> list[dict]:
    incidents, total = list_incidents(
        connection,
        status=status,
        severity=severity,
        incident_type=incident_type,
        session_id=session_id,
        bay_id=bay_id,
        search=search,
        date_from=date_from,
        date_to=date_to,
        limit=limit,
        offset=offset,
        sort=sort,
        order=order,
    )
    response.headers["X-Total-Count"] = str(total)
    return incidents


@app.get("/api/incidents/{incident_id}", response_model=Incident, tags=["incidents"])
def api_incident(incident_id: int, connection: Connection = Depends(get_read_db)) -> dict:
    incident = get_incident(connection, incident_id)
    if incident is None:
        raise HTTPException(status_code=404, detail=f"Incident #{incident_id} was not found.")
    return incident


@app.post(
    "/api/incidents/{incident_id}/review",
    response_model=IncidentReviewResponse,
    responses={404: {"model": ErrorResponse}, 409: {"model": ErrorResponse}},
    tags=["incidents"],
)
def api_review_incident(
    incident_id: int,
    payload: IncidentReviewRequest,
    request: Request,
    connection: Connection = Depends(get_write_db),
) -> dict:
    if payload.status == "dismissed" and not payload.reason:
        raise HTTPException(status_code=400, detail="A dismissal reason is required.")
    try:
        incident, audit = create_review(
            connection,
            incident_id,
            payload,
            client_ip=_client_ip(request),
        )
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    return {"incident": incident, "audit": audit}


@app.get(
    "/api/removals",
    response_model=list[Removal],
    responses={200: {"headers": {"X-Total-Count": {"schema": {"type": "integer"}}}}},
    tags=["removals"],
)
def api_removals(
    response: Response,
    connection: Connection = Depends(get_read_db),
    session_id: int | None = Query(None),
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
) -> list[dict]:
    removals, total = list_removals(
        connection,
        session_id=session_id,
        limit=limit,
        offset=offset,
    )
    response.headers["X-Total-Count"] = str(total)
    return removals


@app.post(
    "/api/removals",
    response_model=RemovalCreateResponse,
    status_code=201,
    responses={404: {"model": ErrorResponse}, 409: {"model": ErrorResponse}},
    tags=["removals"],
)
def api_create_removal(
    payload: RemovalCreateRequest,
    request: Request,
    connection: Connection = Depends(get_write_db),
) -> dict:
    try:
        payload.validate_scan_selector()
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    try:
        removal, audit = create_removal(
            connection,
            payload,
            client_ip=_client_ip(request),
        )
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    return {"removal": removal, "audit": audit}


@app.get(
    "/api/audit",
    response_model=list[AuditEntry],
    responses={200: {"headers": {"X-Total-Count": {"schema": {"type": "integer"}}}}},
    tags=["audit"],
)
def api_audit(
    response: Response,
    connection: Connection = Depends(get_read_db),
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
) -> list[dict]:
    entries, total = list_audit(connection, limit=limit, offset=offset)
    response.headers["X-Total-Count"] = str(total)
    return entries


@app.get("/api/audit/verify", response_model=AuditVerifyResponse, tags=["audit"])
def api_verify_audit(connection: Connection = Depends(get_read_db)) -> dict:
    return verify_chain(connection)


@app.get(
    "/api/reports/dispatch.csv",
    response_class=PlainTextResponse,
    responses={200: {"content": {"text/csv": {}}}},
    tags=["reports"],
)
def api_dispatch_report(
    connection: Connection = Depends(get_read_db),
    date_from: str | None = Query(None, alias="from"),
    date_to: str | None = Query(None, alias="to"),
    bay_id: int | None = Query(None),
    status: str | None = Query(None),
) -> Response:
    csv_text = dispatch_report(
        connection,
        date_from=date_from,
        date_to=date_to,
        bay_id=bay_id,
        status=status,
    )
    return Response(
        content=csv_text,
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": 'attachment; filename="dispatch.csv"'},
    )


def _poll_once(
    cursor: int,
    incident_cursor: int,
    timestamp: int,
) -> tuple[int, int, list[dict], list[dict], list[dict]]:
    with get_read_connection() as connection:
        scans = scans_after(connection, cursor)
        incidents = incidents_after(connection, incident_cursor)
        session_ids = [int(scan["session_id"]) for scan in scans]
        deltas = bay_deltas_for_sessions(connection, session_ids, timestamp=timestamp)
        new_cursor = max((int(scan["id"]) for scan in scans), default=cursor)
        new_incident_cursor = max(
            (int(incident["id"]) for incident in incidents),
            default=incident_cursor,
        )
        scan_deltas = [
            {
                "id": scan["id"],
                "session_id": scan["session_id"],
                "camera_id": scan["camera_id"],
                "barcode_value": scan["barcode_value"],
                "first_seen": scan["first_seen"],
                "last_seen": scan["last_seen"],
                "custody_state": scan["custody_state"],
                "gate_flag": scan["gate_flag"],
                "gate_reason": scan["gate_reason"],
            }
            for scan in scans
        ]
    return new_cursor, new_incident_cursor, deltas, scan_deltas, incidents


def get_read_connection():
    """Small helper that keeps the WebSocket poller independent of FastAPI DI."""

    from .db import read_engine

    return read_engine.connect()


async def _receive_loop(websocket: WebSocket) -> None:
    while True:
        message = await websocket.receive_text()
        try:
            payload = json.loads(message)
        except (TypeError, ValueError):
            continue
        if not isinstance(payload, dict):
            continue
        message_type = payload.get("type")
        if message_type == "ping":
            await websocket.send_json({"type": "pong", "timestamp": int(time.time() * 1000)})
        # The snapshot is sent immediately after accept(), so get_snapshot is a
        # no-op.  Unknown control messages are ignored rather than closing the
        # socket; this keeps older dashboard clients compatible.


async def _poll_loop(
    websocket: WebSocket,
    cursor: int,
    incident_cursor: int,
    seq: int,
) -> None:
    while True:
        await asyncio.sleep(1)
        timestamp = int(time.time() * 1000)
        (
            cursor,
            incident_cursor,
            bay_deltas,
            scan_deltas,
            incidents,
        ) = await asyncio.to_thread(_poll_once, cursor, incident_cursor, timestamp)
        if not bay_deltas and not scan_deltas and not incidents:
            continue
        seq += 1
        await websocket.send_json(
            {
                "type": "delta",
                "data": {
                    "bays": bay_deltas,
                    "scans": scan_deltas,
                    "incidents": incidents,
                },
                "seq": seq,
                "timestamp": timestamp,
            }
        )


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket) -> None:
    await websocket.accept()
    seq = 1
    with get_read_connection() as connection:
        snapshot = fetch_snapshot(connection, seq=seq)
        cursor = scan_cursor(connection)
        incident_cursor = max_incident_id(connection)

    await websocket.send_json(
        {
            "type": "snapshot",
            "data": snapshot,
            "seq": seq,
            "timestamp": snapshot["timestamp"],
        }
    )

    receive_task = asyncio.create_task(_receive_loop(websocket))
    poll_task = asyncio.create_task(
        _poll_loop(websocket, cursor, incident_cursor, seq)
    )
    try:
        done, pending = await asyncio.wait(
            {receive_task, poll_task},
            return_when=asyncio.FIRST_COMPLETED,
        )
        for task in pending:
            task.cancel()
        for task in done:
            try:
                task.result()
            except WebSocketDisconnect:
                pass
    except asyncio.CancelledError:
        # The client disconnected (or the server is shutting down).  Cleanup is
        # handled in ``finally``; do not surface this as an application error.
        pass
    finally:
        for task in (receive_task, poll_task):
            if not task.done():
                task.cancel()
        with contextlib.suppress(asyncio.CancelledError):
            await asyncio.gather(receive_task, poll_task, return_exceptions=True)
