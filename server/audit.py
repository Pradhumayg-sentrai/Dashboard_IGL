"""Append-only, hash-chained authorisation log.

The dashboard's SQLite database already ships an ``authorisation_log`` table,
but the original schema only allows a handful of actions and has no tamper
evidence.  This module upgrades that table in place (without touching the
Alembic version table) and exposes helpers for appending and verifying chain
entries.

The chain is intentionally simple and dependency-free:

* every row stores ``prev_hash`` (the previous row's ``entry_hash``)
* ``entry_hash`` is ``sha256(canonical_json(payload))``
* the genesis ``prev_hash`` is 64 zeroes
* SQLite triggers reject UPDATE/DELETE and reject broken chain links

The API's write endpoints use ``BEGIN IMMEDIATE`` so appends are serialized.
"""

from __future__ import annotations

import hashlib
import json
from datetime import datetime
from typing import Any, Mapping

from sqlalchemy import text
from sqlalchemy.engine import Connection

from .db import db_now, write_engine

GENESIS_HASH = "0" * 64
HASH_VERSION = 1

AUDIT_ACTIONS = (
    "unload_truck",
    "unload_finish",
    "remove_carton",
    "ack_all_alarms",
    "pause_alarms",
    "review_incident",
    "dismiss_incident",
)

AUDIT_OUTCOMES = ("ok", "bad_credentials", "locked_out", "truck_locked", "truck_unloaded")

AUDIT_FIELDS = (
    "id",
    "action",
    "session_id",
    "scan_id",
    "barcode_value",
    "bay_id",
    "truck_reg",
    "indent_no",
    "reason",
    "user_id",
    "username_given",
    "employee_id_given",
    "client_ip",
    "device",
    "outcome",
    "at",
)

_NEW_TABLE_SQL = f"""
CREATE TABLE authorisation_log (
    id INTEGER NOT NULL,
    action VARCHAR(32) NOT NULL,
    session_id INTEGER,
    scan_id INTEGER,
    barcode_value VARCHAR(255),
    bay_id INTEGER,
    truck_reg VARCHAR(64),
    indent_no VARCHAR(128),
    reason TEXT,
    user_id INTEGER,
    username_given VARCHAR(64) NOT NULL,
    employee_id_given VARCHAR(64),
    client_ip VARCHAR(64),
    device VARCHAR(16),
    outcome VARCHAR(16) NOT NULL,
    at DATETIME NOT NULL,
    prev_hash CHAR(64) NOT NULL,
    entry_hash CHAR(64) NOT NULL,
    hash_version INTEGER NOT NULL DEFAULT {HASH_VERSION},
    CONSTRAINT pk_authorisation_log PRIMARY KEY (id),
    CONSTRAINT ck_authorisation_log_action_valid CHECK (action IN (
        {", ".join(repr(action) for action in AUDIT_ACTIONS)}
    )),
    CONSTRAINT ck_authorisation_log_outcome_valid CHECK (outcome IN (
        {", ".join(repr(outcome) for outcome in AUDIT_OUTCOMES)}
    )),
    CONSTRAINT fk_authorisation_log_user_id_users
        FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE SET NULL
)
"""

_INDEX_SQL = (
    "CREATE INDEX IF NOT EXISTS ix_authorisation_log_username_given_at "
    "ON authorisation_log (username_given, at)",
    "CREATE INDEX IF NOT EXISTS ix_authorisation_log_session_id "
    "ON authorisation_log (session_id)",
)

_TRIGGER_SQL = (
    """
    CREATE TRIGGER IF NOT EXISTS authorisation_log_no_update
    BEFORE UPDATE ON authorisation_log
    BEGIN
        SELECT RAISE(ABORT, 'authorisation_log is append-only: UPDATE is forbidden');
    END
    """,
    """
    CREATE TRIGGER IF NOT EXISTS authorisation_log_no_delete
    BEFORE DELETE ON authorisation_log
    BEGIN
        SELECT RAISE(ABORT, 'authorisation_log is append-only: DELETE is forbidden');
    END
    """,
    """
    CREATE TRIGGER IF NOT EXISTS authorisation_log_no_replace
    BEFORE INSERT ON authorisation_log
    WHEN EXISTS (SELECT 1 FROM authorisation_log WHERE id = NEW.id)
    BEGIN
        SELECT RAISE(ABORT, 'authorisation_log ids are immutable');
    END
    """,
    """
    CREATE TRIGGER IF NOT EXISTS authorisation_log_require_hash
    BEFORE INSERT ON authorisation_log
    WHEN NEW.prev_hash IS NULL
      OR length(NEW.prev_hash) != 64
      OR NEW.entry_hash IS NULL
      OR length(NEW.entry_hash) != 64
    BEGIN
        SELECT RAISE(ABORT, 'authorisation_log requires 64-character hash fields');
    END
    """,
    f"""
    CREATE TRIGGER IF NOT EXISTS authorisation_log_chain_continuity
    BEFORE INSERT ON authorisation_log
    WHEN NEW.prev_hash IS NOT COALESCE(
        (SELECT entry_hash FROM authorisation_log ORDER BY id DESC LIMIT 1),
        '{GENESIS_HASH}'
    )
    BEGIN
        SELECT RAISE(ABORT, 'authorisation_log hash chain is broken');
    END
    """,
)


def _normalise(value: Any) -> Any:
    if isinstance(value, datetime):
        return value.strftime("%Y-%m-%d %H:%M:%S.%f")
    if isinstance(value, bytes):
        return value.hex()
    return value


def _payload(row: Mapping[str, Any], prev_hash: str) -> dict[str, Any]:
    payload = {field: _normalise(row.get(field)) for field in AUDIT_FIELDS}
    payload["prev_hash"] = prev_hash
    payload["hash_version"] = int(row.get("hash_version") or HASH_VERSION)
    return payload


def _canonical_bytes(payload: Mapping[str, Any]) -> bytes:
    return json.dumps(
        payload,
        sort_keys=True,
        separators=(",", ":"),
        ensure_ascii=False,
        default=str,
    ).encode("utf-8")


def hash_payload(payload: Mapping[str, Any]) -> str:
    return hashlib.sha256(_canonical_bytes(payload)).hexdigest()


def entry_hash(row: Mapping[str, Any]) -> str:
    return hash_payload(_payload(row, str(row.get("prev_hash") or GENESIS_HASH)))


def _table_sql(connection: Connection) -> str | None:
    row = connection.execute(
        text("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'authorisation_log'")
    ).first()
    return row[0] if row else None


def _table_columns(connection: Connection) -> set[str]:
    return {row[1] for row in connection.execute(text("PRAGMA table_info(authorisation_log)")).all()}


def _needs_rebuild(connection: Connection) -> bool:
    sql = _table_sql(connection)
    if sql is None:
        return True
    columns = _table_columns(connection)
    if not {"prev_hash", "entry_hash", "hash_version"} <= columns:
        return True
    return not all(action in sql for action in ("review_incident", "dismiss_incident"))


def _create_triggers(connection: Connection) -> None:
    for trigger_sql in _TRIGGER_SQL:
        connection.exec_driver_sql(trigger_sql)


def _create_indexes(connection: Connection) -> None:
    for index_sql in _INDEX_SQL:
        connection.exec_driver_sql(index_sql)


def _rebuild_table() -> None:
    """Rebuild the legacy table and backfill a valid hash chain.

    The raw DBAPI connection is used because ``PRAGMA foreign_keys`` is a no-op
    inside a SQLAlchemy-managed transaction.  DDL in SQLite is transactional, so
    a failure leaves the original table intact.
    """

    raw = write_engine.raw_connection()
    dbapi = raw.driver_connection
    try:
        dbapi.execute("PRAGMA foreign_keys=OFF")
        dbapi.execute("PRAGMA busy_timeout=5000")
        dbapi.execute("BEGIN IMMEDIATE")

        exists = dbapi.execute(
            "SELECT sql FROM sqlite_master WHERE type='table' AND name='authorisation_log'"
        ).fetchone()
        legacy_rows: list[Mapping[str, Any]] = []
        if exists is not None:
            cursor = dbapi.execute("SELECT * FROM authorisation_log ORDER BY id")
            names = [description[0] for description in cursor.description]
            legacy_rows = [dict(zip(names, row, strict=True)) for row in cursor.fetchall()]

        dbapi.execute("DROP TABLE IF EXISTS authorisation_log_v2")
        dbapi.execute(_NEW_TABLE_SQL.replace("authorisation_log", "authorisation_log_v2", 1))

        previous_hash = GENESIS_HASH
        insert_sql = f"""
            INSERT INTO authorisation_log_v2 (
                {", ".join(AUDIT_FIELDS)}, prev_hash, entry_hash, hash_version
            ) VALUES (
                {", ".join("?" for _ in AUDIT_FIELDS)}, ?, ?, ?
            )
        """
        for row in legacy_rows:
            row = {**row, "hash_version": HASH_VERSION}
            payload = _payload(row, previous_hash)
            current_hash = hash_payload(payload)
            values = [row.get(field) for field in AUDIT_FIELDS]
            dbapi.execute(
                insert_sql,
                (*values, previous_hash, current_hash, HASH_VERSION),
            )
            previous_hash = current_hash

        if exists is not None:
            dbapi.execute("DROP TABLE authorisation_log")
        dbapi.execute("ALTER TABLE authorisation_log_v2 RENAME TO authorisation_log")
        for index_sql in _INDEX_SQL:
            dbapi.execute(index_sql)
        for trigger_sql in _TRIGGER_SQL:
            dbapi.execute(trigger_sql)
        dbapi.commit()
    except Exception:
        dbapi.rollback()
        raise
    finally:
        try:
            dbapi.execute("PRAGMA foreign_keys=ON")
        finally:
            raw.close()


def bootstrap_audit_schema() -> None:
    """Idempotently ensure the audit table, hash columns and triggers exist."""

    with write_engine.connect() as connection:
        if _needs_rebuild(connection):
            connection.close()
            _rebuild_table()
            return
        _create_indexes(connection)
        _create_triggers(connection)
        connection.commit()


def _head(connection: Connection) -> tuple[int, str]:
    row = connection.execute(
        text("SELECT id, entry_hash FROM authorisation_log ORDER BY id DESC LIMIT 1")
    ).mappings().first()
    if row is None:
        return 0, GENESIS_HASH
    return int(row["id"]), str(row["entry_hash"])


def append_audit_entry(
    connection: Connection,
    *,
    action: str,
    username_given: str,
    outcome: str = "ok",
    session_id: int | None = None,
    scan_id: int | None = None,
    barcode_value: str | None = None,
    bay_id: int | None = None,
    truck_reg: str | None = None,
    indent_no: str | None = None,
    reason: str | None = None,
    user_id: int | None = None,
    employee_id_given: str | None = None,
    client_ip: str | None = None,
    device: str | None = "api",
    at: str | None = None,
) -> dict[str, Any]:
    """Append one entry inside an existing ``BEGIN IMMEDIATE`` transaction."""

    if action not in AUDIT_ACTIONS:
        raise ValueError(f"Unsupported audit action: {action}")
    if outcome not in AUDIT_OUTCOMES:
        raise ValueError(f"Unsupported audit outcome: {outcome}")

    last_id, previous_hash = _head(connection)
    row = {
        "id": last_id + 1,
        "action": action,
        "session_id": session_id,
        "scan_id": scan_id,
        "barcode_value": barcode_value,
        "bay_id": bay_id,
        "truck_reg": truck_reg,
        "indent_no": indent_no,
        "reason": reason,
        "user_id": user_id,
        "username_given": username_given,
        "employee_id_given": employee_id_given,
        "client_ip": client_ip,
        "device": device,
        "outcome": outcome,
        "at": at or db_now(),
        "prev_hash": previous_hash,
        "entry_hash": "",
        "hash_version": HASH_VERSION,
    }
    row["entry_hash"] = hash_payload(_payload(row, previous_hash))

    connection.execute(
        text(
            f"""
            INSERT INTO authorisation_log (
                {", ".join(AUDIT_FIELDS)}, prev_hash, entry_hash, hash_version
            ) VALUES (
                {", ".join(f":{field}" for field in AUDIT_FIELDS)},
                :prev_hash, :entry_hash, :hash_version
            )
            """
        ),
        row,
    )
    return row


def _now_iso() -> str:
    return db_now().replace(" ", "T") + "Z"


def verify_chain(connection: Connection) -> dict[str, Any]:
    """Recompute every link and return a verification report."""

    rows = connection.execute(
        text("SELECT * FROM authorisation_log ORDER BY id")
    ).mappings().all()

    previous_hash = GENESIS_HASH
    for row in rows:
        row_dict = dict(row)
        if str(row_dict.get("prev_hash")) != previous_hash:
            return {
                "ok": False,
                "entries": len(rows),
                "head_hash": previous_hash,
                "broken_at": row_dict.get("id"),
                "error": (
                    f"Entry {row_dict.get('id')} prev_hash does not match the previous entry"
                ),
                "checked_at": _now_iso(),
            }
        expected_hash = hash_payload(_payload(row_dict, previous_hash))
        if str(row_dict.get("entry_hash")) != expected_hash:
            return {
                "ok": False,
                "entries": len(rows),
                "head_hash": previous_hash,
                "broken_at": row_dict.get("id"),
                "error": f"Entry {row_dict.get('id')} content hash does not match",
                "checked_at": _now_iso(),
            }
        previous_hash = expected_hash

    return {
        "ok": True,
        "entries": len(rows),
        "head_hash": previous_hash if rows else None,
        "broken_at": None,
        "error": None,
        "checked_at": _now_iso(),
    }


def row_hash_valid(row: Mapping[str, Any]) -> bool:
    """Cheap per-row check used when serialising removal audit metadata."""

    try:
        return str(row.get("entry_hash")) == hash_payload(
            _payload(row, str(row.get("prev_hash") or GENESIS_HASH))
        )
    except Exception:
        return False
