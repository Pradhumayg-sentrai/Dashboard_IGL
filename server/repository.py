"""Database queries and write operations for the dashboard API."""

from __future__ import annotations

import csv
import io
import json
import time
from datetime import datetime
from typing import Any, Iterable

from sqlalchemy import bindparam, text
from sqlalchemy.engine import Connection

from .audit import append_audit_entry, verify_chain
from .db import db_now, parse_datetime, to_epoch_ms, utcnow
from .schemas import ActorIn, IncidentReviewRequest, RemovalCreateRequest
from .serializers import (
    audit_to_out,
    incident_to_out,
    iso,
    removal_to_out,
    session_to_out,
)

INCIDENT_SELECT = """
    SELECT
        i.*,
        s.bay_id AS session_bay_id,
        b.name AS bay_name,
        t.registration_number AS truck_reg
    FROM incidents i
    JOIN sessions s ON s.id = i.session_id
    LEFT JOIN bays b ON b.id = s.bay_id
    LEFT JOIN trucks t ON t.id = s.truck_id
"""

SESSION_SELECT = """
    SELECT s.*, t.registration_number AS truck_reg, b.name AS bay_name
    FROM sessions s
    LEFT JOIN trucks t ON t.id = s.truck_id
    LEFT JOIN bays b ON b.id = s.bay_id
"""

REMOVAL_SELECT = """
    SELECT
        re.id AS removal_event_id,
        re.session_id,
        re.bay_id,
        re.truck_reg,
        re.indent_no,
        re.reason,
        re.started_at,
        re.finished_at,
        re.authorisation_log_id,
        al.id AS al_id,
        al.action AS al_action,
        al.session_id AS al_session_id,
        al.scan_id AS al_scan_id,
        al.barcode_value AS al_barcode_value,
        al.bay_id AS al_bay_id,
        al.truck_reg AS al_truck_reg,
        al.indent_no AS al_indent_no,
        al.reason AS al_reason,
        al.user_id AS al_user_id,
        al.username_given AS al_username_given,
        al.employee_id_given AS al_employee_id_given,
        al.client_ip AS al_client_ip,
        al.device AS al_device,
        al.outcome AS al_outcome,
        al.at AS al_at,
        al.prev_hash AS al_prev_hash,
        al.entry_hash AS al_entry_hash,
        al.hash_version AS al_hash_version,
        (SELECT rc.barcode_value FROM removed_cartons rc
            WHERE rc.removal_event_id = re.id ORDER BY rc.id LIMIT 1) AS barcode_value,
        (SELECT rc.id FROM removed_cartons rc
            WHERE rc.removal_event_id = re.id ORDER BY rc.id LIMIT 1) AS removed_carton_id,
        (SELECT COUNT(*) FROM removed_cartons rc
            WHERE rc.removal_event_id = re.id) AS carton_count
    FROM removal_events re
    JOIN authorisation_log al ON al.id = re.authorisation_log_id
"""

_SEVERITY_ORDER = """
    CASE i.severity
        WHEN 'critical' THEN 4
        WHEN 'high' THEN 3
        WHEN 'medium' THEN 2
        ELSE 1
    END
"""


def _rows(connection: Connection, sql: str, params: dict[str, Any] | None = None) -> list[dict[str, Any]]:
    result = connection.execute(text(sql), params or {})
    return [dict(row) for row in result.mappings().all()]


def _one(connection: Connection, sql: str, params: dict[str, Any] | None = None) -> dict[str, Any] | None:
    result = connection.execute(text(sql), params or {}).mappings().first()
    return dict(result) if result is not None else None


def _scalar(connection: Connection, sql: str, params: dict[str, Any] | None = None) -> Any:
    result = connection.execute(text(sql), params or {}).scalar()
    return result


def _minutes_between(start: Any, end: Any) -> float:
    start_dt = parse_datetime(start)
    end_dt = parse_datetime(end)
    if start_dt is None:
        return 0.0
    if end_dt is None:
        end_dt = utcnow()
    return max(0.0, (end_dt - start_dt).total_seconds() / 60.0)


def _latest_scan(connection: Connection, session_id: int) -> dict[str, Any] | None:
    return _one(
        connection,
        """
        SELECT * FROM scans
        WHERE session_id = :session_id
        ORDER BY last_seen DESC, id DESC
        LIMIT 1
        """,
        {"session_id": session_id},
    )


def _placed_count(connection: Connection, session_id: int) -> int:
    """Count placed cartons that are still in the truck.

    Removed cartons are excluded by scan id.  Older removals may reference scan
    rows that have already been deleted, so subtracting the removal-event count
    from the raw placed count would double-count those historical removals.
    """

    return int(
        _scalar(
            connection,
            """
            SELECT COUNT(*)
            FROM scans sc
            WHERE sc.session_id = :session_id
              AND sc.custody_state = 'placed'
              AND NOT EXISTS (
                  SELECT 1 FROM removed_cartons rc
                  WHERE rc.original_scan_id = sc.id
              )
            """,
            {"session_id": session_id},
        )
        or 0
    )


def _removed_count(connection: Connection, session_id: int) -> int:
    return int(
        _scalar(
            connection,
            """
            SELECT COUNT(*)
            FROM removed_cartons rc
            JOIN removal_events re ON re.id = rc.removal_event_id
            WHERE re.session_id = :session_id
            """,
            {"session_id": session_id},
        )
        or 0
    )


def _supervisor(
    connection: Connection,
    *,
    bay_id: int,
    pace_cpm: float,
    removals_count: int,
    active_alarms_count: int,
) -> dict[str, Any]:
    user = _one(
        connection,
        """
        SELECT * FROM users
        WHERE bay_id = :bay_id AND role = 'bay' AND active = 1
        ORDER BY id
        LIMIT 1
        """,
        {"bay_id": bay_id},
    )
    if user is None:
        user = _one(
            connection,
            """
            SELECT * FROM users
            WHERE role = 'bay' AND active = 1
            ORDER BY id
            LIMIT 1
            """,
        )
    if user is None:
        return {
            "userId": 0,
            "name": "Unassigned",
            "employeeId": "",
            "shift": "Shift B (14:00-22:00)",
            "phoneExt": "",
            "avatarColor": "#0284c7",
            "rating": 0.0,
            "avgTatMinutes": 0.0,
            "paceCpm": round(pace_cpm, 1),
            "removalsCount": removals_count,
            "activeAlarmsCount": active_alarms_count,
        }

    user_id = int(user["id"])
    colours = ("#0284c7", "#059669", "#d97706", "#7c3aed", "#db2777")
    return {
        "userId": user_id,
        "name": str(user["username"]),
        "employeeId": str(user["employee_id"]),
        "shift": "Shift B (14:00-22:00)",
        "phoneExt": f"#{100 + user_id}",
        "avatarColor": colours[(user_id - 1) % len(colours)],
        "rating": 98.4,
        "avgTatMinutes": 34.0,
        "paceCpm": round(pace_cpm, 1),
        "removalsCount": removals_count,
        "activeAlarmsCount": active_alarms_count,
    }


def _live_bay(
    connection: Connection,
    bay: dict[str, Any],
    session: dict[str, Any] | None,
) -> dict[str, Any]:
    bay_id = int(bay["id"])
    if session is None:
        return {
            "bayId": bay_id,
            "bayName": str(bay["name"]),
            "dockLocation": "North Dock" if bay_id == 1 else f"{bay['name']} Dock",
            "truckReg": "",
            "indentNo": "",
            "licenceNo": "",
            "allocatedQty": 0,
            "loadedQty": 0,
            "beltState": "stopped",
            "status": "standby",
            "stopCause": "No active session",
            "paceCpm": 0.0,
            "gateFlag": "waiting",
            "gateReason": "not_ready",
            "lastScannedBarcode": "Awaiting Slip Scan",
            "estimatedRemainingMinutes": 0.0,
            "sessionDurationMinutes": 0.0,
            "supervisor": _supervisor(
                connection,
                bay_id=bay_id,
                pace_cpm=0.0,
                removals_count=0,
                active_alarms_count=0,
            ),
            "lastUpdated": int(time.time() * 1000),
        }

    session_id = int(session["id"])
    status = str(session.get("status") or "unknown")
    placed = _placed_count(connection, session_id)
    loaded_qty = max(0, placed)
    allocated_qty = int(session.get("indent_qty") or 0)
    duration = _minutes_between(session.get("started_at"), session.get("ended_at"))
    latest_scan = _latest_scan(connection, session_id)

    open_incidents = int(
        _scalar(
            connection,
            "SELECT COUNT(*) FROM incidents WHERE session_id = :session_id AND status = 'open'",
            {"session_id": session_id},
        )
        or 0
    )
    removals_count = int(
        _scalar(
            connection,
            "SELECT COUNT(*) FROM removal_events WHERE session_id = :session_id",
            {"session_id": session_id},
        )
        or 0
    )
    recent_high_incident = _one(
        connection,
        """
        SELECT type, occurred_at
        FROM incidents
        WHERE session_id = :session_id
          AND status = 'open'
          AND severity IN ('high', 'critical')
        ORDER BY occurred_at DESC
        LIMIT 1
        """,
        {"session_id": session_id},
    )

    is_active = status in {"open", "loading"}
    is_setup = status == "setup"
    pace_cpm = 0.0
    if is_active and duration > 0:
        pace_cpm = loaded_qty / duration
    remaining = max(0, allocated_qty - loaded_qty)
    eta = 0.0
    if is_active and pace_cpm > 0:
        eta = remaining / pace_cpm

    if status == "closed":
        bay_status = "standby"
        belt_state = "stopped"
        stop_cause = "Session closed"
    elif status == "aborted":
        bay_status = "stopped"
        belt_state = "stopped"
        stop_cause = "Session aborted"
    elif is_setup:
        bay_status = "preparing"
        belt_state = "paused"
        stop_cause = "Session setup"
    elif is_active:
        bay_status = "loading"
        belt_state = "running"
        stop_cause = None
    else:
        bay_status = "stopped"
        belt_state = "stopped"
        stop_cause = f"Session {status}"

    if recent_high_incident is not None and belt_state != "stopped":
        belt_state = "warning"
        stop_cause = f"Open incident: {recent_high_incident['type']}"

    latest_seen = None
    if latest_scan is not None:
        latest_seen = latest_scan.get("last_seen")
    last_updated = to_epoch_ms(
        latest_seen or session.get("ended_at") or session.get("started_at"),
        fallback=int(time.time() * 1000),
    )

    return {
        "bayId": bay_id,
        "bayName": str(bay["name"]),
        "dockLocation": "North Dock" if bay_id == 1 else f"{bay['name']} Dock",
        "truckReg": str(session.get("truck_reg") or ""),
        "indentNo": str(session.get("indent_number") or ""),
        "licenceNo": str(session.get("licence_no") or ""),
        "allocatedQty": allocated_qty,
        "loadedQty": loaded_qty,
        "beltState": belt_state,
        "status": bay_status,
        "stopCause": stop_cause,
        "paceCpm": round(pace_cpm, 1),
        "gateFlag": str((latest_scan or {}).get("gate_flag") or "waiting"),
        "gateReason": str((latest_scan or {}).get("gate_reason") or "not_ready"),
        "lastScannedBarcode": str(
            (latest_scan or {}).get("barcode_value") or "Awaiting Slip Scan"
        ),
        "estimatedRemainingMinutes": round(eta, 1),
        "sessionDurationMinutes": round(duration, 1),
        "supervisor": _supervisor(
            connection,
            bay_id=bay_id,
            pace_cpm=pace_cpm,
            removals_count=removals_count,
            active_alarms_count=open_incidents,
        ),
        "lastUpdated": last_updated,
    }


def _latest_sessions_by_bay(connection: Connection) -> dict[int, dict[str, Any]]:
    rows = _rows(
        connection,
        """
        SELECT s.*, t.registration_number AS truck_reg, b.name AS bay_name
        FROM sessions s
        LEFT JOIN trucks t ON t.id = s.truck_id
        LEFT JOIN bays b ON b.id = s.bay_id
        WHERE s.bay_id IS NOT NULL
          AND s.id = (
              SELECT s2.id FROM sessions s2
              WHERE s2.bay_id = s.bay_id
              ORDER BY s2.started_at DESC, s2.id DESC
              LIMIT 1
          )
        """,
    )
    return {int(row["bay_id"]): row for row in rows}


def _kpis(connection: Connection) -> dict[str, Any]:
    reference = _scalar(connection, "SELECT MAX(started_at) FROM sessions")
    reference_date = None
    if reference is not None:
        parsed = parse_datetime(reference)
        if parsed is not None:
            reference_date = parsed.date().isoformat()

    if reference_date is None:
        return {
            "totalDispatched": 0,
            "dispatchTarget": 0,
            "trucksCleared": 0,
            "trucksTarget": 0,
            "avgTatMinutes": 0.0,
            "tatBenchmarkMinutes": 40.0,
            "clearanceRate": 0.0,
            "refusalCount": 0,
            "activeAlarmsCount": 0,
            "as_of": iso(utcnow()) or "",
        }

    totals = _one(
        connection,
        """
        SELECT
            COUNT(*) AS sessions,
            COALESCE(SUM(COALESCE(total_boxes_loaded, 0)), 0) AS dispatched,
            COALESCE(SUM(COALESCE(indent_qty, 0)), 0) AS target,
            SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) AS cleared
        FROM sessions
        WHERE date(started_at) = :reference_date
        """,
        {"reference_date": reference_date},
    ) or {}
    durations = [
        _minutes_between(row["started_at"], row["ended_at"])
        for row in _rows(
            connection,
            """
            SELECT started_at, ended_at FROM sessions
            WHERE date(started_at) = :reference_date AND status = 'closed'
            """,
            {"reference_date": reference_date},
        )
    ]
    avg_tat = sum(durations) / len(durations) if durations else 0.0
    dispatched = int(totals.get("dispatched") or 0)
    target = int(totals.get("target") or 0)
    refusal_count = int(
        _scalar(
            connection,
            """
            SELECT COUNT(*) FROM scans sc
            JOIN sessions s ON s.id = sc.session_id
            WHERE date(s.started_at) = :reference_date
              AND sc.gate_reason = 'refused'
            """,
            {"reference_date": reference_date},
        )
        or 0
    )
    active_alarms = int(
        _scalar(
            connection,
            """
            SELECT COUNT(*) FROM incidents i
            JOIN sessions s ON s.id = i.session_id
            WHERE date(s.started_at) = :reference_date
              AND i.status = 'open'
            """,
            {"reference_date": reference_date},
        )
        or 0
    )

    return {
        "totalDispatched": dispatched,
        "dispatchTarget": target,
        "trucksCleared": int(totals.get("cleared") or 0),
        "trucksTarget": int(totals.get("sessions") or 0),
        "avgTatMinutes": round(avg_tat, 1),
        "tatBenchmarkMinutes": 40.0,
        "clearanceRate": round((dispatched / target) * 100, 2) if target else 0.0,
        "refusalCount": refusal_count,
        "activeAlarmsCount": active_alarms,
        "as_of": f"{reference_date}T00:00:00Z",
    }


def fetch_snapshot(
    connection: Connection,
    *,
    seq: int,
    incident_limit: int = 250,
) -> dict[str, Any]:
    bays = _rows(connection, "SELECT * FROM bays ORDER BY id")
    latest_sessions = _latest_sessions_by_bay(connection)
    live_bays = [_live_bay(connection, bay, latest_sessions.get(int(bay["id"]))) for bay in bays]

    sessions = _rows(
        connection,
        f"{SESSION_SELECT} ORDER BY s.started_at DESC, s.id DESC LIMIT 50",
    )
    incidents = _rows(
        connection,
        f"""
        {INCIDENT_SELECT}
        ORDER BY CASE WHEN i.status = 'open' THEN 0 ELSE 1 END,
                 i.occurred_at DESC, i.id DESC
        LIMIT :limit
        """,
        {"limit": incident_limit},
    )
    removals = _rows(
        connection,
        f"""
        {REMOVAL_SELECT}
        WHERE re.kind = 'carton_removed'
        ORDER BY re.started_at DESC, re.id DESC
        LIMIT 100
        """,
    )
    incident_count = int(_scalar(connection, "SELECT COUNT(*) FROM incidents") or 0)
    scan_cursor = int(_scalar(connection, "SELECT COALESCE(MAX(id), 0) FROM scans") or 0)

    return {
        "bays": live_bays,
        "incidents": [incident_to_out(row) for row in incidents],
        "sessions": [session_to_out(row) for row in sessions],
        "removals": [removal_to_out(row) for row in removals],
        "kpis": _kpis(connection),
        "scan_cursor": scan_cursor,
        "seq": seq,
        "timestamp": int(time.time() * 1000),
        "incident_count": incident_count,
    }


def _incident_filters(
    *,
    status: Iterable[str] | None,
    severity: Iterable[str] | None,
    incident_type: str | None,
    session_id: int | None,
    bay_id: int | None,
    search: str | None,
    date_from: str | None,
    date_to: str | None,
) -> tuple[str, dict[str, Any]]:
    clauses: list[str] = ["1 = 1"]
    params: dict[str, Any] = {}

    status_values = [value for value in (status or []) if value]
    if status_values:
        placeholders = ", ".join(f":status_{index}" for index in range(len(status_values)))
        clauses.append(f"i.status IN ({placeholders})")
        params.update(
            {f"status_{index}": value for index, value in enumerate(status_values)}
        )
    severity_values = [value for value in (severity or []) if value]
    if severity_values:
        placeholders = ", ".join(f":severity_{index}" for index in range(len(severity_values)))
        clauses.append(f"i.severity IN ({placeholders})")
        params.update(
            {f"severity_{index}": value for index, value in enumerate(severity_values)}
        )
    if incident_type:
        clauses.append("i.type = :incident_type")
        params["incident_type"] = incident_type
    if session_id is not None:
        clauses.append("i.session_id = :session_id")
        params["session_id"] = session_id
    if bay_id is not None:
        clauses.append("s.bay_id = :bay_id")
        params["bay_id"] = bay_id
    if search:
        clauses.append(
            "(i.barcode_value LIKE :search OR i.type LIKE :search "
            "OR s.indent_number LIKE :search OR t.registration_number LIKE :search)"
        )
        params["search"] = f"%{search}%"
    if date_from:
        clauses.append("i.occurred_at >= :date_from")
        params["date_from"] = date_from
    if date_to:
        value = date_to
        if len(value) == 10:
            value = f"{value} 23:59:59.999999"
        clauses.append("i.occurred_at <= :date_to")
        params["date_to"] = value

    return " AND ".join(clauses), params


def list_incidents(
    connection: Connection,
    *,
    status: Iterable[str] | None = None,
    severity: Iterable[str] | None = None,
    incident_type: str | None = None,
    session_id: int | None = None,
    bay_id: int | None = None,
    search: str | None = None,
    date_from: str | None = None,
    date_to: str | None = None,
    limit: int = 100,
    offset: int = 0,
    sort: str = "occurred_at",
    order: str = "desc",
) -> tuple[list[dict[str, Any]], int]:
    where, params = _incident_filters(
        status=status,
        severity=severity,
        incident_type=incident_type,
        session_id=session_id,
        bay_id=bay_id,
        search=search,
        date_from=date_from,
        date_to=date_to,
    )

    count_sql = f"""
        SELECT COUNT(*)
        FROM incidents i
        JOIN sessions s ON s.id = i.session_id
        LEFT JOIN trucks t ON t.id = s.truck_id
        WHERE {where}
    """
    total = int(_scalar(connection, count_sql, params) or 0)

    sort_columns = {
        "occurred_at": "i.occurred_at",
        "id": "i.id",
        "type": "i.type",
        "status": "i.status",
        "severity": _SEVERITY_ORDER,
    }
    order_sql = "ASC" if order.lower() == "asc" else "DESC"
    sort_sql = sort_columns.get(sort, "i.occurred_at")
    data_sql = f"""
        {INCIDENT_SELECT}
        WHERE {where}
        ORDER BY {sort_sql} {order_sql}, i.id {order_sql}
        LIMIT :limit OFFSET :offset
    """
    rows = _rows(
        connection,
        data_sql,
        {**params, "limit": limit, "offset": offset},
    )
    return [incident_to_out(row) for row in rows], total


def get_incident(connection: Connection, incident_id: int) -> dict[str, Any] | None:
    row = _one(
        connection,
        f"{INCIDENT_SELECT} WHERE i.id = :incident_id",
        {"incident_id": incident_id},
    )
    return incident_to_out(row) if row is not None else None


def list_removals(
    connection: Connection,
    *,
    limit: int = 100,
    offset: int = 0,
    session_id: int | None = None,
) -> tuple[list[dict[str, Any]], int]:
    where = "re.kind = 'carton_removed'"
    params: dict[str, Any] = {}
    if session_id is not None:
        where += " AND re.session_id = :session_id"
        params["session_id"] = session_id
    total = int(
        _scalar(connection, f"SELECT COUNT(*) FROM removal_events re WHERE {where}", params) or 0
    )
    rows = _rows(
        connection,
        f"""
        {REMOVAL_SELECT}
        WHERE {where}
        ORDER BY re.started_at DESC, re.id DESC
        LIMIT :limit OFFSET :offset
        """,
        {**params, "limit": limit, "offset": offset},
    )
    return [removal_to_out(row) for row in rows], total


def _resolve_actor(
    connection: Connection,
    actor: ActorIn,
) -> tuple[int | None, str, str | None]:
    user_id = actor.user_id
    username = actor.resolved_username
    employee_id = actor.resolved_employee_id

    user = None
    if user_id is not None:
        user = _one(connection, "SELECT * FROM users WHERE id = :id", {"id": user_id})
    if user is None and username and username != "api":
        user = _one(connection, "SELECT * FROM users WHERE username = :username", {"username": username})
    if user is None and employee_id:
        user = _one(
            connection,
            "SELECT * FROM users WHERE employee_id = :employee_id",
            {"employee_id": employee_id},
        )
    if user is not None:
        user_id = int(user["id"])
        username = str(user["username"])
        employee_id = str(user["employee_id"])
    return user_id, username, employee_id


def _session_context(connection: Connection, session_id: int) -> dict[str, Any] | None:
    return _one(
        connection,
        f"{SESSION_SELECT} WHERE s.id = :session_id",
        {"session_id": session_id},
    )


def create_review(
    connection: Connection,
    incident_id: int,
    request: IncidentReviewRequest,
    *,
    client_ip: str | None = None,
) -> tuple[dict[str, Any], dict[str, Any]]:
    row = _one(
        connection,
        f"{INCIDENT_SELECT} WHERE i.id = :incident_id",
        {"incident_id": incident_id},
    )
    if row is None:
        raise LookupError(f"Incident #{incident_id} was not found.")
    if row.get("status") == "dismissed":
        raise ValueError(f"Incident #{incident_id} has already been dismissed.")
    if request.status == "dismissed" and not request.reason:
        raise ValueError("A dismissal reason is required.")

    user_id, username, employee_id = _resolve_actor(connection, request.actor)
    at = db_now()
    resolution = json.dumps(
        {
            "notes": request.notes,
            "reason": request.reason,
            "actor": {
                "username": username,
                "employee_id": employee_id,
                "user_id": user_id,
            },
        },
        ensure_ascii=False,
        sort_keys=True,
    )
    connection.execute(
        text(
            """
            UPDATE incidents
            SET status = :status,
                reviewed_by = :reviewed_by,
                reviewed_at = :reviewed_at,
                resolution = :resolution
            WHERE id = :incident_id
            """
        ),
        {
            "status": request.status,
            "reviewed_by": username,
            "reviewed_at": at,
            "resolution": resolution,
            "incident_id": incident_id,
        },
    )

    session = _session_context(connection, int(row["session_id"])) or {}
    scan = None
    if row.get("barcode_value"):
        scan = _one(
            connection,
            """
            SELECT id FROM scans
            WHERE session_id = :session_id AND barcode_value = :barcode_value
            ORDER BY id DESC
            LIMIT 1
            """,
            {"session_id": row["session_id"], "barcode_value": row["barcode_value"]},
        )

    audit = append_audit_entry(
        connection,
        action="review_incident" if request.status == "reviewed" else "dismiss_incident",
        session_id=int(row["session_id"]),
        scan_id=int(scan["id"]) if scan else None,
        barcode_value=row.get("barcode_value"),
        bay_id=session.get("bay_id"),
        truck_reg=session.get("truck_reg"),
        indent_no=session.get("indent_number"),
        reason=request.reason or request.notes,
        user_id=user_id,
        username_given=username,
        employee_id_given=employee_id,
        client_ip=client_ip,
        device="api",
        outcome="ok",
        at=at,
    )

    updated = get_incident(connection, incident_id)
    if updated is None:  # pragma: no cover - guarded by the update above
        raise LookupError(f"Incident #{incident_id} disappeared during review.")
    return updated, audit_to_out(audit)


def create_removal(
    connection: Connection,
    request: RemovalCreateRequest,
    *,
    client_ip: str | None = None,
) -> tuple[dict[str, Any], dict[str, Any]]:
    session = _session_context(connection, request.session_id)
    if session is None:
        raise LookupError(f"Session #{request.session_id} was not found.")

    scan = None
    if request.scan_id is not None:
        scan = _one(
            connection,
            "SELECT * FROM scans WHERE id = :scan_id AND session_id = :session_id",
            {"scan_id": request.scan_id, "session_id": request.session_id},
        )
    elif request.barcode_value:
        scan = _one(
            connection,
            """
            SELECT * FROM scans
            WHERE session_id = :session_id AND barcode_value = :barcode_value
            ORDER BY id DESC
            LIMIT 1
            """,
            {"session_id": request.session_id, "barcode_value": request.barcode_value},
        )
    if scan is None:
        raise LookupError("The selected carton scan was not found for this session.")

    already_removed = _scalar(
        connection,
        "SELECT id FROM removed_cartons WHERE original_scan_id = :scan_id LIMIT 1",
        {"scan_id": scan["id"]},
    )
    if already_removed is not None:
        raise ValueError(f"Carton scan #{scan['id']} has already been removed.")

    user_id, username, employee_id = _resolve_actor(connection, request.actor)
    at = db_now()
    audit = append_audit_entry(
        connection,
        action="remove_carton",
        session_id=request.session_id,
        scan_id=int(scan["id"]),
        barcode_value=str(scan["barcode_value"]),
        bay_id=session.get("bay_id"),
        truck_reg=session.get("truck_reg"),
        indent_no=session.get("indent_number"),
        reason=request.reason,
        user_id=user_id,
        username_given=username,
        employee_id_given=employee_id,
        client_ip=client_ip,
        device="api",
        outcome="ok",
        at=at,
    )

    event_result = connection.execute(
        text(
            """
            INSERT INTO removal_events (
                kind, session_id, bay_id, truck_reg, indent_no, reason,
                authorisation_log_id, started_at, finished_at, mismatch_json
            ) VALUES (
                'carton_removed', :session_id, :bay_id, :truck_reg, :indent_no, :reason,
                :authorisation_log_id, :started_at, :finished_at, NULL
            )
            """
        ),
        {
            "session_id": request.session_id,
            "bay_id": session.get("bay_id"),
            "truck_reg": session.get("truck_reg"),
            "indent_no": session.get("indent_number"),
            "reason": request.reason,
            "authorisation_log_id": audit["id"],
            "started_at": at,
            "finished_at": at,
        },
    )
    event_id = int(event_result.lastrowid)

    if request.answers is not None:
        answers = request.answers
    else:
        answers = [
            dict(row)
            for row in connection.execute(
                text(
                    """
                    SELECT * FROM portal_answers
                    WHERE scan_id = :scan_id
                    ORDER BY seq, id
                    """
                ),
                {"scan_id": scan["id"]},
            ).mappings().all()
        ]

    connection.execute(
        text(
            """
            INSERT INTO removed_cartons (
                removal_event_id, original_scan_id, barcode_value,
                scan_json, answers_json, removed_at
            ) VALUES (
                :removal_event_id, :original_scan_id, :barcode_value,
                :scan_json, :answers_json, :removed_at
            )
            """
        ),
        {
            "removal_event_id": event_id,
            "original_scan_id": int(scan["id"]),
            "barcode_value": str(scan["barcode_value"]),
            "scan_json": json.dumps(dict(scan), default=str, ensure_ascii=False),
            "answers_json": json.dumps(answers, default=str, ensure_ascii=False),
            "removed_at": at,
        },
    )

    removal_row = _one(
        connection,
        f"{REMOVAL_SELECT} WHERE re.id = :event_id",
        {"event_id": event_id},
    )
    if removal_row is None:  # pragma: no cover - guarded by the insert above
        raise LookupError(f"Removal event #{event_id} was not found after creation.")
    return removal_to_out(removal_row), audit_to_out(audit)


def list_audit(
    connection: Connection,
    *,
    limit: int = 100,
    offset: int = 0,
) -> tuple[list[dict[str, Any]], int]:
    total = int(_scalar(connection, "SELECT COUNT(*) FROM authorisation_log") or 0)
    rows = _rows(
        connection,
        """
        SELECT * FROM authorisation_log
        ORDER BY id DESC
        LIMIT :limit OFFSET :offset
        """,
        {"limit": limit, "offset": offset},
    )
    return [audit_to_out(row) for row in rows], total


def dispatch_report(
    connection: Connection,
    *,
    date_from: str | None = None,
    date_to: str | None = None,
    bay_id: int | None = None,
    status: str | None = None,
) -> str:
    clauses = ["1 = 1"]
    params: dict[str, Any] = {}
    if date_from:
        clauses.append("date(s.started_at) >= date(:date_from)")
        params["date_from"] = date_from
    if date_to:
        clauses.append("date(s.started_at) <= date(:date_to)")
        params["date_to"] = date_to
    if bay_id is not None:
        clauses.append("s.bay_id = :bay_id")
        params["bay_id"] = bay_id
    if status:
        clauses.append("s.status = :status")
        params["status"] = status

    rows = _rows(
        connection,
        f"""
        SELECT
            s.id AS session_id,
            s.bay_id,
            b.name AS bay_name,
            b.code AS bay_code,
            t.registration_number AS truck_reg,
            s.indent_number,
            s.licence_no,
            s.status,
            s.started_at,
            s.ended_at,
            s.total_boxes_loaded,
            s.indent_qty,
            (SELECT COUNT(*) FROM scans sc
                WHERE sc.session_id = s.id AND sc.custody_state = 'placed') AS placed_scans,
            (SELECT COUNT(*) FROM removed_cartons rc
                JOIN removal_events re ON re.id = rc.removal_event_id
                WHERE re.session_id = s.id) AS removed_cartons,
            (SELECT COUNT(*) FROM incidents i
                WHERE i.session_id = s.id AND i.status = 'open') AS open_incidents
        FROM sessions s
        LEFT JOIN bays b ON b.id = s.bay_id
        LEFT JOIN trucks t ON t.id = s.truck_id
        WHERE {" AND ".join(clauses)}
        ORDER BY s.started_at DESC, s.id DESC
        """,
        params,
    )

    output = io.StringIO()
    writer = csv.writer(output, lineterminator="\n")
    writer.writerow(
        [
            "session_id",
            "bay_id",
            "bay_name",
            "bay_code",
            "truck_reg",
            "indent_number",
            "licence_no",
            "status",
            "started_at",
            "ended_at",
            "total_boxes_loaded",
            "indent_qty",
            "placed_scans",
            "removed_cartons",
            "open_incidents",
        ]
    )
    for row in rows:
        writer.writerow(
            [
                row.get("session_id"),
                row.get("bay_id"),
                row.get("bay_name") or "",
                row.get("bay_code") or "",
                row.get("truck_reg") or "",
                row.get("indent_number") or "",
                row.get("licence_no") or "",
                row.get("status") or "",
                row.get("started_at") or "",
                row.get("ended_at") or "",
                row.get("total_boxes_loaded") if row.get("total_boxes_loaded") is not None else "",
                row.get("indent_qty") if row.get("indent_qty") is not None else "",
                row.get("placed_scans") or 0,
                row.get("removed_cartons") or 0,
                row.get("open_incidents") or 0,
            ]
        )
    return output.getvalue()


def health(connection: Connection) -> dict[str, Any]:
    report = verify_chain(connection)
    scan_cursor = int(_scalar(connection, "SELECT COALESCE(MAX(id), 0) FROM scans") or 0)
    return {
        "status": "ok",
        "database": "sqlite",
        "audit_chain_ok": bool(report["ok"]),
        "audit_entries": int(report["entries"]),
        "scan_cursor": scan_cursor,
    }


def scans_after(connection: Connection, cursor: int, limit: int = 500) -> list[dict[str, Any]]:
    return _rows(
        connection,
        """
        SELECT * FROM scans
        WHERE id > :cursor
        ORDER BY id
        LIMIT :limit
        """,
        {"cursor": cursor, "limit": limit},
    )


def incidents_after(connection: Connection, cursor: int, limit: int = 100) -> list[dict[str, Any]]:
    rows = _rows(
        connection,
        f"{INCIDENT_SELECT} WHERE i.id > :cursor ORDER BY i.id LIMIT :limit",
        {"cursor": cursor, "limit": limit},
    )
    return [incident_to_out(row) for row in rows]


def bay_deltas_for_sessions(
    connection: Connection,
    session_ids: Iterable[int],
    *,
    timestamp: int,
) -> list[dict[str, Any]]:
    deltas: list[dict[str, Any]] = []
    seen: set[int] = set()
    for session_id in session_ids:
        if session_id in seen:
            continue
        seen.add(session_id)
        session = _session_context(connection, session_id)
        if session is None or session.get("bay_id") is None:
            continue
        bay_id = int(session["bay_id"])
        placed = _placed_count(connection, session_id)
        loaded_qty = max(0, placed)
        allocated_qty = int(session.get("indent_qty") or 0)
        duration = _minutes_between(session.get("started_at"), session.get("ended_at"))
        is_active = session.get("status") in {"open", "loading"}
        pace = loaded_qty / duration if is_active and duration > 0 else 0.0
        latest_scan = _latest_scan(connection, session_id)
        remaining = max(0, allocated_qty - loaded_qty)
        deltas.append(
            {
                "bayId": bay_id,
                "loadedQty": loaded_qty,
                "lastScannedBarcode": str(
                    (latest_scan or {}).get("barcode_value") or "Awaiting Slip Scan"
                ),
                "estimatedRemainingMinutes": round(remaining / pace, 1) if pace > 0 else 0.0,
                "status": "loading" if is_active else "standby",
                "beltState": "running" if is_active else "stopped",
                "stopCause": None if is_active else f"Session {session.get('status')}",
                "paceCpm": round(pace, 1),
                "lastUpdated": timestamp,
            }
        )
    return deltas


def scan_cursor(connection: Connection) -> int:
    return int(_scalar(connection, "SELECT COALESCE(MAX(id), 0) FROM scans") or 0)


def max_incident_id(connection: Connection) -> int:
    return int(_scalar(connection, "SELECT COALESCE(MAX(id), 0) FROM incidents") or 0)
