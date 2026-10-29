# IGL Loading-Bay Dashboard

React + TypeScript dashboard for the IGL loading-bay operation, with a FastAPI
service that reads the existing SQLite database (`app.db`) and writes incident
reviews, carton removals and the tamper-evident authorisation log.

## Repository layout

```
src/                 React dashboard (Vite)
server/              FastAPI service
app.db               Existing SQLite database
src/api/generated.ts TypeScript types generated from the OpenAPI schema
```

## Frontend

Requires Node.js 20+.

```bash
npm install
npm run dev
```

The Vite dev server runs on `http://localhost:5173` by default.

The dashboard currently defaults to the in-browser mock adapter. To consume the
FastAPI WebSocket feed instead:

```bash
VITE_DATA_SOURCE=ws npm run dev
```

The WebSocket URL is `ws://localhost:8000/ws` (see `src/data/wsAdapter.ts`).

## API service

Requires Python 3.11+.

```bash
python3 -m venv server/.venv
server/.venv/bin/pip install -r server/requirements.txt
server/.venv/bin/uvicorn server.main:app --reload --port 8000
# or, after installing the venv:
npm run api
```

Then:

- API root: `http://localhost:8000/`
- Interactive docs: `http://localhost:8000/docs`
- OpenAPI schema: `http://localhost:8000/openapi.json`
- Health check: `http://localhost:8000/api/health`

By default the service uses the repository's `app.db`. Point it at another
database with `IGL_DB_PATH`:

```bash
IGL_DB_PATH=/path/to/app.db server/.venv/bin/uvicorn server.main:app --port 8000
```

### CORS

CORS is configured for the Vite dev server. Both of these are accepted, and any
port on localhost/127.0.0.1 is allowed by the origin regex:

- `http://localhost:5173`
- `http://127.0.0.1:5173`
- e.g. `http://localhost:5189` when Vite falls back to another port

`X-Total-Count` and `Content-Disposition` are exposed to browser clients.

## API endpoints

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/snapshot` | Dashboard snapshot: bays, incidents, sessions, removals, KPIs and scan cursor. |
| `GET` | `/api/incidents` | Paginated incident list. Filters: `status`, `severity`, `type`, `session_id`, `bay_id`, `search`, `from`, `to`; sorting/paging: `sort`, `order`, `limit`, `offset`. Total count is in `X-Total-Count`. |
| `GET` | `/api/incidents/{id}` | Single incident. |
| `POST` | `/api/incidents/{id}/review` | Review or dismiss an incident. Dismissal requires `reason`. |
| `GET` | `/api/removals` | Paginated carton-removal history. |
| `POST` | `/api/removals` | Record a carton removal; writes the audit entry, removal event and removed-carton snapshot atomically. |
| `GET` | `/api/audit` | Authorisation log entries, newest first. |
| `GET` | `/api/audit/verify` | Recompute the whole hash chain and report the first broken link, if any. |
| `GET` | `/api/reports/dispatch.csv` | CSV dispatch report. Optional filters: `from`, `to`, `bay_id`, `status`. |
| `WS` | `/ws` | Snapshot first, then sequenced deltas from polling `scans` every second. |

### Review example

```bash
curl -X POST http://localhost:8000/api/incidents/4272/review \
  -H 'Content-Type: application/json' \
  -d '{
    "status": "dismissed",
    "reason": "Duplicate camera alarm",
    "notes": "Checked the clip",
    "actor": {"username": "anil", "employee_id": "SAI-003"}
  }'
```

### Removal example

Provide either `scan_id` or `barcode_value`. `session_id` is optional when a
scan selector uniquely identifies the session:

```bash
curl -X POST http://localhost:8000/api/removals \
  -H 'Content-Type: application/json' \
  -d '{
    "session_id": 118,
    "scan_id": 891,
    "reason": "Damaged carton",
    "actor": {"username": "anil", "employee_id": "SAI-003"}
  }'
```

### WebSocket protocol

The server sends a snapshot immediately after the connection is accepted:

```json
{
  "type": "snapshot",
  "seq": 1,
  "timestamp": 1791186045492,
  "data": { "bays": [], "incidents": [], "sessions": [], "removals": [], "kpis": {}, "scan_cursor": 891, "seq": 1, "timestamp": 1791186045492, "incident_count": 4272 }
}
```

It then polls `scans` once per second and emits deltas with consecutive
sequence numbers:

```json
{
  "type": "delta",
  "seq": 2,
  "timestamp": 1791186046492,
  "data": {
    "bays": [{ "bayId": 1, "loadedQty": 8, "lastScannedBarcode": "...", "lastUpdated": 1791186046492 }],
    "scans": [],
    "incidents": []
  }
}
```

`get_snapshot` and `ping` control messages are accepted. The snapshot is already
sent on connect, so `get_snapshot` is a no-op.

## Authorisation log

`authorisation_log` is append-only and hash-chained:

- Each row stores `prev_hash` (the previous row's `entry_hash`) and `entry_hash`.
- `entry_hash` is `sha256(canonical JSON of the row + prev_hash + hash_version)`.
- The first row chains from 64 zeroes.
- SQLite triggers reject `UPDATE`, `DELETE`, duplicate ids and broken chain links.
- API writes use `BEGIN IMMEDIATE`, so concurrent appends serialize.
- `GET /api/audit/verify` recomputes every link.

The service performs an idempotent schema bootstrap on startup. If the existing
`authorisation_log` predates hash chaining, it is rebuilt in place (with existing
rows backfilled into the chain), and the action constraint is extended with
`review_incident` and `dismiss_incident`. **The Alembic version table and
Alembic history are not modified.** No Alembic migration directory exists in
this repository; the runtime bootstrap is the current migration path.

## Generating TypeScript types

The types in `src/api/generated.ts` come directly from the FastAPI OpenAPI
schema:

```bash
server/.venv/bin/python -m server.generate_types
# or
npm run generate:api
```

The generated file is committed so the frontend can type-check without running
the API.

## Useful checks

```bash
npm run lint
npm run build
curl http://localhost:8000/api/health
curl http://localhost:8000/api/audit/verify
```
