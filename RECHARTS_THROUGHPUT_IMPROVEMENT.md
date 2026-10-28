# Throughput Analytics Modernization & State Management: Dashboard_IGL

## 1. Engine Evaluation: Recharts vs. uPlot
For industrial manufacturing dashboards like India Glycols Limited (IGL), **Recharts** was selected over uPlot for the following architectural reasons:

| Evaluation Dimension | Recharts (Selected) | uPlot (Alternative Considered) |
|---|---|---|
| **Data Volume Appropriateness** | Tailored for 10–500 points (our shift intervals: 12–30 points). Ultra-smooth 60fps rendering. | Engineered for 100,000+ points on raw HTML5 canvas. Overkill for batch/shift cadence. |
| **React 19 Integration** | First-class declarative React components (`<ResponsiveContainer>`, `<AreaChart>`, `<ReferenceLine>`, `<Brush>`). | Imperative canvas context lifecycle requiring manual DOM bindings and sync hooks. |
| **Draggable Target Overlay** | Native SVG layering with mouse/touch drag handle coordinate mapping. | Requires manual canvas cursor event interceptors and redraw triggers. |
| **Visual Accessibility & Tooltips** | Accessible DOM elements, customizable glassmorphism tooltips, formatted legends, and aria labels. | Fixed canvas raster rendering with limited DOM accessibility for screen readers. |
| **Zoom & Range Control** | Native `<Brush />` slider for zooming across daily 24h, monthly 30-day, and yearly 12-month data. | Manual drag-zoom selection. |

---

## 2. Key Enhancements Delivered

### 1. Interactive Target Line & Attainment Badge
- Retained the **draggable horizontal target line** with Recharts's `<ReferenceLine />` and an absolute-positioned drag pill handle (`.dragHandleOverlay`).
- Supported on all inputs:
  - Mouse drag directly on the chart canvas.
  - Touch swipe on industrial tablets.
  - Increment/decrement step buttons (`+` and `-`).
  - Target slider input range.
- Real-time attainment pill dynamically updates pacing attainment `%` and cases difference.

### 2. Secondary Filter Bar: Shift Focus & Comparison
- **Shift Filter Tabs**:
  - `All Shifts`
  - `Shift A (Morning, 06:00 - 14:00)`
  - `Shift B (Evening, 14:00 - 22:00)`
  - `Shift C (Night, 22:00 - 06:00)`
- **Compare to Previous Period**:
  - Checkbox toggle displays a dashed secondary baseline curve (`previousVolume`) alongside the actual volume.
  - Tooltip shows comparison difference (`+X cases` or `-X cases`).

### 3. Responsive Range Brush for Dense Views
- When viewing `daily`, `monthly`, or `yearly` data, a native mini `<Brush />` slider appears below the chart.
- Operators can pan across 30 days of October or 12 annual months without horizontal scrollbars.

### 4. Empty, Loading, and Error States across All Modules
Added industrial-grade visual fallbacks across all dashboard modules:
1. **`ThroughputAnalytics`**:
   - Loading: Pulsing spinner + "Synchronizing PLC Throughput Telemetry...".
   - Error: High-contrast alert + "Throughput Telemetry Unavailable" + Retry action.
   - Empty: Clean inbox icon + "No Carton Dispatch Records Found".
2. **`CarrierScorecard`**: Table loading spinner, error row, and empty manifest state.
3. **`SupervisorScorecard`**: Loading, error, and unassigned shift states.
4. **`ExciseIntelligence`**: Loading gateway state, error banner, and zero-diversion state.
5. **`IncidentsLossPrevention`**: Loading camera stream state and empty filter result state.

---

## 3. Verification & Build
- `npx tsc --noEmit`: **0 errors**
- `npx oxlint`: **0 warnings, 0 errors** across all 30 files
- `npm run build`: **Success in 438ms**

---

## 4. Manual Testing Checklist

1. **Recharts Rendering & Tooltips**:
   - [ ] Navigate to [http://localhost:5173/plant](http://localhost:5173/plant).
   - [ ] Hover over any point on the Throughput curve: verify the custom glassmorphism tooltip displays interval, actual volume, and attainment percentage.
2. **Interactive Target Quota Dragging**:
   - [ ] Click and drag the amber target handle on the right of the chart up and down: verify the reference line and the attainment badge update smoothly.
   - [ ] Click `+` and `-` on the target toolbar; check that the line moves accordingly.
3. **Shift Filter Selection**:
   - [ ] In the header, select `Daily (Shifts)`.
   - [ ] Click `Shift A (06-14)`: verify the chart filters to morning hours (06:00–12:00).
   - [ ] Click `Shift B (14-22)`: verify evening hours display.
   - [ ] Click `All Shifts`: verify full 24-hour curve returns.
4. **Compare to Previous Period**:
   - [ ] Check `Compare to Prev. Period`: verify a dashed grey comparison line appears with a matching legend item.
   - [ ] Hover over a point: verify the tooltip lists both current volume and previous volume difference.
5. **Range Brush**:
   - [ ] Select `Monthly` timeframe.
   - [ ] Drag the brush handles at the bottom of the chart to zoom into specific weeks of the month.

