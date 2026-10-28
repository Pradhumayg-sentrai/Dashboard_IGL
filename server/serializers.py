"""Row-to-API serialisers.

The database predates this API, so a few fields need a little interpretation:

* ``incidents.resolution`` stores either free text or a small JSON object with
  the actor/reason/notes written by the review endpoint.
* removal audit metadata lives in ``authorisation_log`` and is joined onto the
  removal event.
"""

from __future__ import annotations

import json
from typing import Any, Mapping

from .audit import AUDIT_FIELDS, row_hash_valid
from .db import parse_datetime


def iso(value: Any) -> str | None:
    if value is None or value == "":
        return None
    parsed = parse_datetime(value)
    if parsed is None:
        return str(value)
    return f"{parsed.isoformat()}Z"


def _as_dict(row: Mapping[str, Any] | None) -> dict[str, Any]:
    return dict(row) if row is not None else {}


def _json_value(value: Any) -> Any:
    if value is None or value == "":
        return None
    if isinstance(value, (dict, list)):
        return value
    try:
        return json.loads(value)
    except (TypeError, ValueError):
        return None


def details_text(raw: Any) -> str:
    if raw is None or raw == "":
        return ""
    if isinstance(raw, str):
        parsed = _json_value(raw)
        if parsed is None:
            return raw
    else:
        parsed = raw
    if isinstance(parsed, str):
        return parsed
    if isinstance(parsed, dict):
        for key in ("reason", "message", "description", "detail", "summary"):
            value = parsed.get(key)
            if isinstance(value, str) and value:
                return value
        return json.dumps(parsed, ensure_ascii=False, sort_keys=True)
    if isinstance(parsed, list):
        return json.dumps(parsed, ensure_ascii=False)
    return str(parsed)


def detections(raw: Any) -> list[dict[str, Any]]:
    parsed = _json_value(raw) if isinstance(raw, str) else raw
    if not isinstance(parsed, dict):
        return []
    values = parsed.get("detections")
    if not isinstance(values, list):
        return []
    result: list[dict[str, Any]] = []
    for index, item in enumerate(values):
        if not isinstance(item, dict):
            continue
        bbox = item.get("bbox")
        if not isinstance(bbox, dict):
            continue
        try:
            normalised_bbox = {
                "x": float(bbox["x"]),
                "y": float(bbox["y"]),
                "width": float(bbox["width"]),
                "height": float(bbox["height"]),
            }
        except (KeyError, TypeError, ValueError):
            continue
        detection: dict[str, Any] = {
            "id": str(item.get("id") or f"det-{index}"),
            "label": str(item.get("label") or "detection"),
            "confidence": float(item.get("confidence") or 0),
            "bbox": normalised_bbox,
        }
        for key in ("color", "dashed", "startTime", "endTime"):
            if key in item and item[key] is not None:
                detection[key] = item[key]
        result.append(detection)
    return result


def _resolution_parts(row: Mapping[str, Any]) -> tuple[str | None, str | None, dict[str, Any] | None]:
    raw = row.get("resolution")
    status = row.get("status")
    if raw is None or raw == "":
        return None, None, None

    parsed = _json_value(raw) if isinstance(raw, str) else raw
    if isinstance(parsed, dict):
        notes = parsed.get("notes")
        reason = parsed.get("reason")
        actor = parsed.get("actor") if isinstance(parsed.get("actor"), dict) else None
        return (
            str(notes).strip() or None if notes else None,
            str(reason).strip() or None if reason else None,
            actor,
        )

    text = str(raw).strip() or None
    if status == "dismissed":
        return None, text, None
    return text, None, None


def incident_to_out(row: Mapping[str, Any]) -> dict[str, Any]:
    row = _as_dict(row)
    notes, reason, actor = _resolution_parts(row)
    actor = actor or {}
    actor_employee_id = actor.get("employee_id")
    actor_username = actor.get("username")
    reviewed_by = row.get("reviewed_by")
    reviewed_at = iso(row.get("reviewed_at"))
    status = row.get("status") or "open"

    result: dict[str, Any] = {
        "id": int(row["id"]),
        "session_id": int(row["session_id"]),
        "camera_id": int(row["camera_id"]),
        "type": str(row.get("type") or "unknown"),
        "severity": str(row.get("severity") or "low"),
        "occurred_at": iso(row.get("occurred_at")) or str(row.get("occurred_at") or ""),
        "barcode_value": row.get("barcode_value"),
        "status": status,
        "details": details_text(row.get("details_json")),
        "bay_id": row.get("session_bay_id") if row.get("session_bay_id") is not None else row.get("bay_id"),
        "bay_name": row.get("bay_name"),
        "truck_reg": row.get("truck_reg"),
        "notes": notes,
        "dismissal_reason": reason,
        "reviewed_by": None,
        "reviewed_by_id": None,
        "reviewed_at": None,
        "dismissed_by": None,
        "dismissed_by_id": None,
        "dismissed_at": None,
        "detections": detections(row.get("details_json")),
    }

    if status == "reviewed":
        result["reviewed_by"] = reviewed_by
        result["reviewed_by_id"] = actor_employee_id
        result["reviewed_at"] = reviewed_at
    elif status == "dismissed":
        result["dismissed_by"] = reviewed_by
        result["dismissed_by_id"] = actor_employee_id
        result["dismissed_at"] = reviewed_at
    elif status == "open":
        # Open rows can still carry an acknowledgement actor.
        if actor_username:
            result["notes"] = notes or f"Acknowledged by {actor_username}"

    return result


def session_to_out(row: Mapping[str, Any]) -> dict[str, Any]:
    row = _as_dict(row)
    return {
        "id": int(row["id"]),
        "truck_id": int(row["truck_id"]),
        "manifest_id": row.get("manifest_id"),
        "started_at": iso(row.get("started_at")),
        "ended_at": iso(row.get("ended_at")),
        "status": str(row.get("status") or "unknown"),
        "operator": row.get("operator"),
        "notes": row.get("notes"),
        "created_at": iso(row.get("created_at")),
        "total_boxes_loaded": row.get("total_boxes_loaded"),
        "bay_id": row.get("bay_id"),
        "allocation_id": row.get("allocation_id"),
        "indent_number": row.get("indent_number"),
        "licence_no": row.get("licence_no"),
        "indent_qty": row.get("indent_qty"),
        "bay_phase": row.get("bay_phase"),
        "mode": row.get("mode"),
        "sending_paused": row.get("sending_paused"),
        "truck_confirmed_by": row.get("truck_confirmed_by"),
        "truck_confirmed_at": iso(row.get("truck_confirmed_at")),
        "closed_by": row.get("closed_by"),
        "close_reason": row.get("close_reason"),
        "lock_number": row.get("lock_number"),
        "lock_photo_path": row.get("lock_photo_path"),
        "locked_by": row.get("locked_by"),
        "locked_at": iso(row.get("locked_at")),
        "truck_reg": row.get("truck_reg"),
        "bay_name": row.get("bay_name"),
    }


def audit_row_from_removal(row: Mapping[str, Any]) -> dict[str, Any]:
    row = _as_dict(row)
    audit = {field: row.get(f"al_{field}") for field in AUDIT_FIELDS}
    audit["prev_hash"] = row.get("al_prev_hash")
    audit["entry_hash"] = row.get("al_entry_hash")
    audit["hash_version"] = row.get("al_hash_version")
    return audit


def removal_to_out(row: Mapping[str, Any]) -> dict[str, Any]:
    row = _as_dict(row)
    audit = audit_row_from_removal(row)
    event_id = int(row["removal_event_id"])
    barcode = row.get("barcode_value") or row.get("al_barcode_value") or ""
    return {
        "id": event_id,
        "session_id": int(row["session_id"]),
        "truck_reg": str(row.get("truck_reg") or row.get("al_truck_reg") or ""),
        "indent_no": str(row.get("indent_no") or row.get("al_indent_no") or ""),
        "barcode_value": str(barcode),
        "reason": str(row.get("reason") or row.get("al_reason") or ""),
        "authorizer": str(row.get("al_username_given") or "unknown"),
        "employee_id": str(row.get("al_employee_id_given") or ""),
        "timestamp": iso(row.get("started_at")) or str(row.get("started_at") or ""),
        "requested_by": row.get("al_username_given"),
        "requested_by_id": row.get("al_employee_id_given"),
        "requested_at": iso(row.get("started_at")),
        "approved_by": row.get("al_username_given"),
        "approved_by_id": row.get("al_employee_id_given"),
        "approved_at": iso(row.get("al_at")),
        "hash_verified": row_hash_valid(audit),
        "hash": row.get("al_entry_hash"),
        "removal_event_id": event_id,
        "removed_carton_id": row.get("removed_carton_id"),
        "carton_count": int(row.get("carton_count") or 0),
    }


def audit_to_out(row: Mapping[str, Any]) -> dict[str, Any]:
    row = _as_dict(row)
    result: dict[str, Any] = {}
    for field in AUDIT_FIELDS:
        value = row.get(field)
        if field == "at":
            result[field] = iso(value) or str(value or "")
        else:
            result[field] = value
    result["prev_hash"] = str(row.get("prev_hash") or "")
    result["entry_hash"] = str(row.get("entry_hash") or "")
    result["hash_version"] = int(row.get("hash_version") or 1)
    return result
