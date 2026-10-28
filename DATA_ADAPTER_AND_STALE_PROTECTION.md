# Real-Time Data Adapter & Stale Data Protection: Dashboard_IGL

## 1. Architectural Summary
To prepare the IGL Multi-Bay Surveillance & Dispatch dashboard for live plant ingestion (e.g., Python edge bridge, SQLite WAL streaming, or Redis pub/sub over WebSocket), the simulator has been decoupled from React state and placed behind a unified **`DataAdapter`** abstraction.

```
                  ┌──────────────────────────────────────────────┐
                  │                 DataAdapter                  │
                  │  - getSnapshot(): Promise<SnapshotData>      │
                  │  - subscribe(onEvent: DataEvent): UnsubFn    │
                  │  - getStatus(): ConnectionStatus             │
                  └───────────────┬──────────────────────────────┘
                                  │
                 ┌────────────────┴────────────────┐
                 ▼                                 ▼
   ┌───────────────────────────┐     ┌───────────────────────────┐
   │      MockDataAdapter      │     │       WsDataAdapter       │
   │  - In-memory simulation   │     │  - ws://localhost:8000/ws │
   │  - Emits seq & timestamp  │     │  - Strict seq continuity  │
   │  - Default (dev / test)   │     │  - Exponential backoff    │
   └─────────────┬─────────────┘     └─────────────┬─────────────┘
                 │                                 │
                 └────────────────┬────────────────┘
                                  │ Selection: VITE_DATA_SOURCE=mock|ws
                                  ▼
                     ┌─────────────────────────┐
                     │   Zustand Plant Store   │
                     │ (src/store/dashboard...) │
                     └────────────┬────────────┘
                                  │ Narrow Selectors
                                  ▼
                     ┌─────────────────────────┐
                     │    UI Page Components   │
                     │  (/wall, /bay, /plant)  │
                     └─────────────────────────┘
```

---

## 2. Implemented Components & Modules

### 1. Unified Adapter Interface (`src/data/adapter.ts`)
- Defines `SnapshotData`, `BayDelta`, `DataEvent`, `ConnectionStatus` (`'live' | 'reconnecting' | 'offline'`).
- Enforces monotonically increasing sequence numbers (`seq`) and millisecond timestamps (`timestamp`).
- Dynamic factory function `getActiveAdapter()` selects adapter based on `VITE_DATA_SOURCE` environment variable (`ws` or `mock`).

### 2. Standalone Mock Simulator (`src/data/mockAdapter.ts`)
- Implements `DataAdapter` completely outside React component lifecycles.
- Generates periodic barcode scan events, conveyor pace increments, and remaining ETA adjustments every 2500ms.
- Components never touch the simulator directly; they only consume read-only snapshots and deltas through the Zustand store.

### 3. Production WebSocket Adapter (`src/data/wsAdapter.ts`)
- Connects to `ws://localhost:8000/ws`.
- Expects initial `snapshot` message, followed by sequential `delta` messages.
- **Strict Sequence Continuity**: If `delta.seq !== lastSeq + 1`, logs an out-of-order sequence warning, severs the socket, and reconnects with exponential backoff (1s, 1.5s, 2.25s, ... max 15s) to request a fresh snapshot.

### 4. Live Connection Status (`src/components/ConnectionStatus.tsx`)
- Positioned in the top navigation header next to the live clock.
- **Visual Indicators**:
  - `Live` (Green glowing pulse dot, `<1s ago` or `${age}s ago`).
  - `Reconnecting` (Amber warning dot, `${age}s ago`).
  - `Offline` (Red indicator, `${age}s ago`).
- Smooth 1-second ticker dynamically recalculates elapsed seconds since the last message.

### 5. Stale-Data Protection & Grey-Out UI (`src/components/MultiBayFleetGrid.tsx`)
- Every bay tracks its own `lastUpdated` timestamp.
- **Stale Rule**: If a bay has received no telemetry for **> 10 seconds**:
  - The tile is greyed out (`opacity: 0.65`, `filter: grayscale(0.65)`, subdued dark background).
  - A prominent amber badge appears in the bay header: `DATA STALE (${age}s)`.
  - Fully visible on the `/wall` control-room display and `/bay/:id` cockpit.
  - In default simulation, Bay 3 ("Excise Portal Silent") and Bay 4 ("Preparing") do not generate new scans and immediately showcase this stale protection!

---

## 3. Verification
- `npx tsc --noEmit`: **0 errors**
- `npx oxlint`: **0 warnings, 0 errors** across all 29 project files
- `npm run build`: **Success in 270ms**

---

## 4. Manual Testing Checklist

1. **Connection Status Header Widget**:
   - [ ] Look at top navigation header. Verify `LIVE (<1s ago)` (or `LIVE (2s ago)`) appears with a pulsing green dot.
   - [ ] Notice the age updates every second.
2. **Simulation Pausing & Stale Detection**:
   - [ ] Click `Simulating` in the header to pause the simulation ticker.
   - [ ] Wait 10 seconds.
   - [ ] Verify Bay 1 and Bay 2 transition to greyed-out cards (`filter: grayscale`, reduced opacity).
   - [ ] Verify the amber `DATA STALE (10s)` badge appears and increments (`11s`, `12s`, `13s`...).
   - [ ] Click `Resume`. Verify Bay 1 and Bay 2 immediately regain full color and clear the stale badge on the next tick.
3. **Control Room Wall View (`/wall`)**:
   - [ ] Navigate to `/wall`.
   - [ ] Observe Bay 3 and Bay 4: because they are in stopped/preparing states with no incoming scans, they show the `DATA STALE` badge.
   - [ ] Click `Resume` on Bay 3 in the Active Alarms panel.
   - [ ] Notice Bay 3 resumes conveyor movement, updates `lastUpdated`, and immediately clears its stale state!
4. **WebSocket Adapter Switching (Optional / Future Backend)**:
   - [ ] Set `VITE_DATA_SOURCE=ws` in `.env.local` or environment.
   - [ ] Run `npm run dev`. Without a running WS server, notice the header transitions to `RECONNECTING` (amber) with exponential backoff retries.

