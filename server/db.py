from __future__ import annotations

import os
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterator

from sqlalchemy import create_engine, event
from sqlalchemy.engine import Connection, Engine

REPO_ROOT = Path(__file__).resolve().parents[1]
DB_PATH = Path(os.getenv("IGL_DB_PATH", str(REPO_ROOT / "app.db"))).expanduser().resolve()


def _readonly_url(path: Path) -> str:
    return f"sqlite:///file:{path.as_posix()}?mode=ro&uri=true"


read_engine: Engine = create_engine(
    _readonly_url(DB_PATH),
    future=True,
    connect_args={"timeout": 5, "check_same_thread": False},
)

write_engine: Engine = create_engine(
    f"sqlite:///{DB_PATH.as_posix()}",
    future=True,
    connect_args={
        "timeout": 5,
        "check_same_thread": False,
        # Disable pysqlite's implicit transaction handling so the API can use
        # an explicit ``BEGIN IMMEDIATE`` for serialized audit appends.
        "isolation_level": None,
    },
)


@event.listens_for(read_engine, "connect")
def _configure_read_connection(dbapi_connection, _connection_record) -> None:
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA query_only=ON")
    cursor.execute("PRAGMA busy_timeout=5000")
    cursor.close()


@event.listens_for(write_engine, "connect")
def _configure_write_connection(dbapi_connection, _connection_record) -> None:
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA journal_mode=WAL")
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.execute("PRAGMA busy_timeout=5000")
    cursor.close()


def get_read_db() -> Iterator[Connection]:
    with read_engine.connect() as connection:
        yield connection


def get_write_db() -> Iterator[Connection]:
    """Yield a serialized write transaction (BEGIN IMMEDIATE)."""
    connection = write_engine.connect()
    try:
        connection.exec_driver_sql("BEGIN IMMEDIATE")
        yield connection
        connection.commit()
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()


@contextmanager
def read_connection() -> Iterator[Connection]:
    with read_engine.connect() as connection:
        yield connection


def utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def db_now() -> str:
    return utcnow().strftime("%Y-%m-%d %H:%M:%S.%f")


def parse_datetime(value: object) -> datetime | None:
    if value is None or value == "":
        return None
    if isinstance(value, datetime):
        parsed = value
    else:
        text = str(value).strip().replace("Z", "+00:00")
        try:
            parsed = datetime.fromisoformat(text)
        except ValueError:
            return None
    if parsed.tzinfo is not None:
        parsed = parsed.astimezone(timezone.utc).replace(tzinfo=None)
    return parsed


def to_epoch_ms(value: object, fallback: int | None = None) -> int:
    parsed = parse_datetime(value)
    if parsed is None:
        return fallback if fallback is not None else int(datetime.now(timezone.utc).timestamp() * 1000)
    return int(parsed.replace(tzinfo=timezone.utc).timestamp() * 1000)
