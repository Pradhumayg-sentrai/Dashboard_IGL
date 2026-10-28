# Architecture & Role-Based Routing Report: Dashboard_IGL

## 1. Executive Summary
The monolithic single-scrolling dashboard has been transformed into a modern, role-based multi-page application with **React Router 7**, structured feature slicing under `src/features/*`, clean page components under `src/pages/*`, and a centralized **Zustand** state store with narrow selectors (`src/store/dashboardStore.ts`).

---

## 2. Route Slices & Role-Based Workspaces

| Route | View Role | Key Modules Rendered | Contextual Header Controls |
|---|---|---|---|
| `/wall` | **Control-Room Wall View** | 4 Key KPIs (`KpiScorecard`), 4-Bay Fleet Grid (`MultiBayFleetGrid`), and Real-Time Active Alarms Panel (`ActiveAlarmsPanel`). Formatted for non-scrolling single-screen viewing on 1920x1080 displays. | Fleet loading count, alarms indicator, simulation toggle, live IST clock |
| `/bay/:id` | **Dock Supervisor Single-Bay Cockpit** | Dedicated Bay Cockpit (`LiveBayMonitor`) with bay switcher tabs (1 to 4), in-truck CCTV incident alerts, and hardware diagnostics for that bay. | Bay switcher pills (Bay 1–4 with live status dots), simulation toggle, IST clock |
| `/plant` | **Plant Operations Manager** | Executive KPI scorecard, Throughput cadence with draggable target line, Supervisor Shift Accountability scorecard, Carrier SLA scorecard. | Timeframe selector tabs (`Real-Time`, `Daily`, `Monthly`, `Yearly`), simulation toggle, CSV Export, IST clock |
| `/excise` | **State Regulatory Compliance** | State Excise portal bridge intelligence (Pareto diversion reasons, chute operator resolutions) and cryptographic carton removal audit ledger. | Zero-penalty standing badge, official CSV report download, schema info |
| `/` | **Default Entrypoint** | Redirects automatically to `/plant`. | — |

---

## 3. Architecture & File Structure

```
src/
├── store/
│   ├── dashboardStore.ts         # Central Zustand store with fine-grained selectors
│   └── useSimulationTicker.ts    # Background ticker for conveyor belt progression
├── features/
│   ├── navigation/
│   │   ├── Navbar.tsx            # Persistent top nav with contextual sub-bar
│   │   ├── Navbar.module.css
│   │   ├── BottomNav.tsx         # Mobile-first bottom navigation (< 768px)
│   │   └── BottomNav.module.css
│   ├── wall/
│   │   ├── ActiveAlarmsPanel.tsx # Live alarm pauses, stoppages, and high-severity CV alerts
│   │   └── ActiveAlarmsPanel.module.css
│   └── layout/
│       ├── AppLayout.tsx         # Global layout with persistent nav, modal, and footer
│       └── AppLayout.module.css
├── pages/
│   ├── WallDisplayPage.tsx       # 1920x1080 control room wall display
│   ├── WallDisplayPage.module.css
│   ├── BayCockpitPage.tsx        # Single bay drilldown cockpit with tabs 1-4
│   ├── BayCockpitPage.module.css
│   ├── PlantManagerPage.tsx      # Executive throughput, shift, and carrier scorecards
│   ├── PlantManagerPage.module.css
│   ├── ExciseCompliancePage.tsx  # Excise gate intelligence and removal audit ledger
│   └── ExciseCompliancePage.module.css
├── App.tsx                       # Clean declarative router and route definitions only
```

---

## 4. Performance Optimizations & Narrow Selectors

To prevent the conveyor belt ticker (which fires every 2.5 seconds) from causing unnecessary re-renders across unaffected modules:
- Components use narrow custom hooks:
  - `useTimeframe()`
  - `useBays()`
  - `useBayById(id)`
  - `useIsSimulating()`
  - `useIncidents()`
  - `useInspectedIncident()`
- Pages like `/excise` or `/plant` do not re-render heavy subcomponents when individual bay carton counts increment, ensuring fluid 60fps interaction even while dragging the SVG target line.

---

## 5. Verification Results
- `npx tsc --noEmit`: **0 errors**
- `npx oxlint`: **0 warnings, 0 errors** across all 25 project files
- `npm run build`: **Success in 302ms** (bundle: `dist/assets/index-idmOaMur.js`)

---

## 6. Manual Testing Checklist

1. **Default Redirection**:
   - [ ] Navigate to `http://localhost:5173/` or root URL. Confirm immediate redirect to `/plant`.
2. **Top Navigation Switching**:
   - [ ] Click **Wall Display** in top navigation. Verify URL changes to `/wall`, showing the 4-bay fleet grid and the Active Alarms panel.
   - [ ] Click **Plant Manager** in top navigation. Verify URL changes to `/plant`, showing the KPI cards, throughput chart, and scorecards.
   - [ ] Click **Bay Cockpit** in top navigation. Verify URL changes to `/bay/1`, showing Bay 1's live monitor and CCTV alerts.
   - [ ] Click **Excise & Audit** in top navigation. Verify URL changes to `/excise`, showing the gate diversion Pareto chart and the removal audit log.
3. **Control Room Wall View (`/wall`)**:
   - [ ] Check display on a 1920x1080 screen. Confirm layout displays without vertical page scrolling.
   - [ ] Verify the Active Alarms panel lists stopped bays (e.g. Bay 3) with a `Resume` and `Cockpit` quick button.
   - [ ] Click `Resume` on Bay 3; verify its status flips to loading and the alarm clears.
4. **Single-Bay Cockpit (`/bay/:id`)**:
   - [ ] Click the dock selection tabs (Bay 1, Bay 2, Bay 3, Bay 4). Confirm URL changes to `/bay/1`, `/bay/2`, `/bay/3`, `/bay/4` and loads the respective bay's data and license number.
   - [ ] Click `Frame` on any incident in the right column to open the CCTV modal. Confirm modal closes properly on `Close` or `Acknowledge & Mark Reviewed`.
5. **Contextual Controls & Timeframe Persistence**:
   - [ ] On `/plant`, switch timeframe to `Daily (Shifts)`.
   - [ ] Switch to `/wall` and back to `/plant`. Verify the `Daily (Shifts)` timeframe selection is preserved in the Zustand store.
   - [ ] Click `Export CSV` on `/plant` or `/excise`. Confirm CSV download starts.
6. **Mobile Bottom Navigation**:
   - [ ] Resize viewport below 768px in DevTools.
   - [ ] Confirm top navigation links collapse cleanly and the persistent bottom navigation bar appears with 4 touch-friendly tabs (≥44px height).

