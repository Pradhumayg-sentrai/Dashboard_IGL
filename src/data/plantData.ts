export type Timeframe = 'realtime' | 'daily' | 'monthly' | 'yearly';
export type Shift = 'all' | 'shift_a' | 'shift_b' | 'shift_c';

export interface KPIStats {
  totalDispatched: number;
  dispatchTarget: number;
  trucksCleared: number;
  trucksTarget: number;
  avgTatMinutes: number;
  tatBenchmarkMinutes: number;
  clearanceRate: number;
  refusalCount: number;
  activeAlarmsCount: number;
}

export interface ChartDataPoint {
  label: string;
  volume: number;
  target?: number;
  tatMinutes?: number;
  clearanceRate?: number;
  shiftA?: number;
  shiftB?: number;
  shiftC?: number;
  previousVolume?: number;
  shift?: 'shift_a' | 'shift_b' | 'shift_c';
}

export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical';
export type IncidentStatus = 'open' | 'reviewed' | 'dismissed';

export interface VideoBoundingBox {
  /** Normalized 0..1 values relative to the source video frame. */
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface VideoDetection {
  id: string;
  label: string;
  confidence: number;
  bbox: VideoBoundingBox;
  color?: string;
  dashed?: boolean;
  /** Optional playback window, in seconds. Omit to always render. */
  startTime?: number;
  endTime?: number;
}

export interface IncidentItem {
  id: number;
  type: string;
  severity: IncidentSeverity;
  occurred_at: string;
  barcode_value: string | null;
  status: IncidentStatus;
  details: string;
  bay_id?: number;
  bay_name?: string;
  truck_reg?: string | null;
  notes?: string | null;
  dismissal_reason?: string | null;
  reviewed_by?: string | null;
  reviewed_by_id?: string | null;
  reviewed_at?: string | null;
  dismissed_by?: string | null;
  dismissed_by_id?: string | null;
  dismissed_at?: string | null;
  detections?: VideoDetection[];
}

export interface RemovalItem {
  id: number;
  session_id: number;
  truck_reg: string;
  indent_no: string;
  barcode_value: string;
  reason: string;
  authorizer: string;
  employee_id: string;
  timestamp: string;
  requested_by?: string;
  requested_by_id?: string;
  requested_at?: string;
  approved_by?: string | null;
  approved_by_id?: string | null;
  approved_at?: string | null;
  hash_verified?: boolean;
  hash?: string;
}

export type AuditAction = 'review' | 'dismiss' | 'bulk_review' | 'bulk_dismiss';

export interface AuditEntry {
  id: string;
  /** ISO 8601 timestamp. */
  timestamp: string;
  actor_name: string;
  actor_id: string;
  action: AuditAction;
  incident_ids: number[];
  reason?: string;
  notes?: string;
  summary: string;
}

export interface SupervisorInfo {
  userId: number;
  name: string;
  employeeId: string;
  assignedBayIds: number[];
  shift: string;
  phoneExt: string;
  avatarColor: string;
  rating: number;
  avgTatMinutes: number;
  paceCpm: number;
  removalsCount: number;
  activeAlarmsCount: number;
}

export interface LiveBayState {
  bayId: number;
  bayName: string;
  dockLocation: string;
  truckReg: string;
  indentNo: string;
  licenceNo: string;
  allocatedQty: number;
  loadedQty: number;
  beltState: 'running' | 'paused' | 'stopped' | 'warning';
  status: 'loading' | 'preparing' | 'stopped' | 'standby';
  stopCause: string | null;
  paceCpm: number;
  gateFlag: 'pass' | 'divert' | 'waiting';
  gateReason: string;
  lastScannedBarcode: string;
  estimatedRemainingMinutes: number;
  sessionDurationMinutes: number;
  supervisor: SupervisorInfo;
  lastUpdated: number;
}

export const initialSupervisors: SupervisorInfo[] = [
  {
    userId: 3,
    name: 'Anil Kumar',
    employeeId: 'SAI-003',
    assignedBayIds: [1, 5, 9],
    shift: 'Shift B (14:00-22:00)',
    phoneExt: '104',
    avatarColor: 'var(--chart-1)',
    rating: 98.4,
    avgTatMinutes: 34.0,
    paceCpm: 19.2,
    removalsCount: 2,
    activeAlarmsCount: 0,
  },
  {
    userId: 4,
    name: 'Rajesh Sharma',
    employeeId: 'SAI-004',
    assignedBayIds: [2, 6, 10],
    shift: 'Shift B (14:00-22:00)',
    phoneExt: '105',
    avatarColor: 'var(--chart-4)',
    rating: 99.1,
    avgTatMinutes: 31.5,
    paceCpm: 21.4,
    removalsCount: 0,
    activeAlarmsCount: 0,
  },
  {
    userId: 2,
    name: 'Avinash Singh',
    employeeId: 'SAI-002',
    assignedBayIds: [3, 7],
    shift: 'Shift B (14:00-22:00)',
    phoneExt: '106',
    avatarColor: 'var(--chart-2)',
    rating: 96.2,
    avgTatMinutes: 38.2,
    paceCpm: 18.0,
    removalsCount: 1,
    activeAlarmsCount: 1,
  },
  {
    userId: 5,
    name: 'Pawan Verma',
    employeeId: 'SAI-005',
    assignedBayIds: [4, 8],
    shift: 'Shift B (14:00-22:00)',
    phoneExt: '107',
    avatarColor: 'var(--chart-5)',
    rating: 98.8,
    avgTatMinutes: 33.0,
    paceCpm: 20.0,
    removalsCount: 0,
    activeAlarmsCount: 0,
  },
];

export const initialMultiBays: LiveBayState[] = [
  {
    bayId: 1,
    bayName: 'Bay 1',
    dockLocation: 'North Dock',
    truckReg: 'UP58AT9207',
    indentNo: 'BOTTELING288987-CLB2-WHOLESALE544831-CL2-GORA-Oct26_00000070',
    licenceNo: 'LIC/BOTTLING/CLB2/11/2024/462322/26_27',
    allocatedQty: 500,
    loadedQty: 384,
    beltState: 'running',
    status: 'loading',
    stopCause: null,
    paceCpm: 19.2,
    gateFlag: 'pass',
    gateReason: 'registered',
    lastScannedBarcode: '0890801489635500260101102614540662',
    estimatedRemainingMinutes: 6.0,
    sessionDurationMinutes: 24,
    supervisor: initialSupervisors[0],
    lastUpdated: Date.now(),
  },
  {
    bayId: 2,
    bayName: 'Bay 2',
    dockLocation: 'Central Dock',
    truckReg: 'UP16AT5656',
    indentNo: 'BOTTELINGCLB102-CLB1-WHOLESALE417104-CL2-GORA-Oct26_00000536',
    licenceNo: 'LIC/BOTTLING/CLB1/02/26_27',
    allocatedQty: 600,
    loadedQty: 218,
    beltState: 'running',
    status: 'loading',
    stopCause: null,
    paceCpm: 21.4,
    gateFlag: 'pass',
    gateReason: 'registered',
    lastScannedBarcode: '0890801489635500260101102614589110',
    estimatedRemainingMinutes: 17.8,
    sessionDurationMinutes: 11,
    supervisor: initialSupervisors[1],
    lastUpdated: Date.now(),
  },
  {
    bayId: 3,
    bayName: 'Bay 3',
    dockLocation: 'South Dock',
    truckReg: 'HR38AB1234',
    indentNo: 'BOTTELING341209-CLB2-WHOLESALE512900-CL2-GORA-Oct26_00000088',
    licenceNo: 'LIC/BOTTLING/CLB2/11/2024/462322/26_27',
    allocatedQty: 500,
    loadedQty: 490,
    beltState: 'stopped',
    status: 'stopped',
    stopCause: 'Excise Portal Silent (>8.0s hold limit)',
    paceCpm: 0,
    gateFlag: 'waiting',
    gateReason: 'no_answer',
    lastScannedBarcode: '0890801489635500260101102614599901',
    estimatedRemainingMinutes: 0.5,
    sessionDurationMinutes: 29,
    supervisor: initialSupervisors[2],
    lastUpdated: Date.now() - 14000,
  },
  {
    bayId: 4,
    bayName: 'Bay 4',
    dockLocation: 'West Dock',
    truckReg: 'UP65BT7890',
    indentNo: 'BOTTELING199823-CLB1-WHOLESALE398101-CL2-GORA-Oct26_00000102',
    licenceNo: 'LIC/BOTTLING/CLB1/02/26_27',
    allocatedQty: 450,
    loadedQty: 0,
    beltState: 'paused',
    status: 'preparing',
    stopCause: 'Handset Syncing Transport Pass on Scan Tab',
    paceCpm: 0,
    gateFlag: 'waiting',
    gateReason: 'not_ready',
    lastScannedBarcode: 'Awaiting Slip Scan',
    estimatedRemainingMinutes: 22.5,
    sessionDurationMinutes: 3,
    supervisor: initialSupervisors[3],
    lastUpdated: Date.now() - 25000,
  },
  {
    bayId: 5,
    bayName: 'Bay 5',
    dockLocation: 'East Dock',
    truckReg: 'UP22CT4455',
    indentNo: 'BOTTELING447120-CLB1-WHOLESALE610234-CL2-GORA-Oct26_00000118',
    licenceNo: 'LIC/BOTTLING/CLB1/02/26_27',
    allocatedQty: 550,
    loadedQty: 312,
    beltState: 'running',
    status: 'loading',
    stopCause: null,
    paceCpm: 17.8,
    gateFlag: 'pass',
    gateReason: 'registered',
    lastScannedBarcode: '0890801489635500260101102614621140',
    estimatedRemainingMinutes: 8.0,
    sessionDurationMinutes: 19,
    supervisor: initialSupervisors[0],
    lastUpdated: Date.now(),
  },
  {
    bayId: 6,
    bayName: 'Bay 6',
    dockLocation: 'North-East Dock',
    truckReg: 'RJ14GF8899',
    indentNo: 'BOTTELING552301-CLB2-WHOLESALE624880-CL2-GORA-Oct26_00000124',
    licenceNo: 'LIC/BOTTLING/CLB2/11/2024/462322/26_27',
    allocatedQty: 400,
    loadedQty: 156,
    beltState: 'running',
    status: 'loading',
    stopCause: null,
    paceCpm: 20.6,
    gateFlag: 'pass',
    gateReason: 'registered',
    lastScannedBarcode: '0890801489635500260101102614628876',
    estimatedRemainingMinutes: 11.8,
    sessionDurationMinutes: 8,
    supervisor: initialSupervisors[1],
    lastUpdated: Date.now(),
  },
  {
    bayId: 7,
    bayName: 'Bay 7',
    dockLocation: 'South-East Dock',
    truckReg: '',
    indentNo: 'No active dispatch indent',
    licenceNo: '—',
    allocatedQty: 500,
    loadedQty: 0,
    beltState: 'warning',
    status: 'standby',
    stopCause: null,
    paceCpm: 0,
    gateFlag: 'waiting',
    gateReason: 'not_ready',
    lastScannedBarcode: 'Awaiting Assignment',
    estimatedRemainingMinutes: 0,
    sessionDurationMinutes: 0,
    supervisor: initialSupervisors[2],
    lastUpdated: Date.now(),
  },
  {
    bayId: 8,
    bayName: 'Bay 8',
    dockLocation: 'North-West Dock',
    truckReg: 'MP09KL2211',
    indentNo: 'BOTTELING663402-CLB1-WHOLESALE638915-CL2-GORA-Oct26_00000131',
    licenceNo: 'LIC/BOTTLING/CLB1/02/26_27',
    allocatedQty: 500,
    loadedQty: 268,
    beltState: 'stopped',
    status: 'stopped',
    stopCause: 'Case code decal unreadable — awaiting Excise cell decision',
    paceCpm: 0,
    gateFlag: 'waiting',
    gateReason: 'not_case_code',
    lastScannedBarcode: '0890801489635500260101102614635521',
    estimatedRemainingMinutes: 8.9,
    sessionDurationMinutes: 18,
    supervisor: initialSupervisors[3],
    lastUpdated: Date.now(),
  },
  {
    bayId: 9,
    bayName: 'Bay 9',
    dockLocation: 'South-West Dock',
    truckReg: 'UP32MN7788',
    indentNo: 'BOTTELING714509-CLB2-WHOLESALE649203-CL2-GORA-Oct26_00000137',
    licenceNo: 'LIC/BOTTLING/CLB2/11/2024/462322/26_27',
    allocatedQty: 600,
    loadedQty: 480,
    beltState: 'running',
    status: 'loading',
    stopCause: null,
    paceCpm: 22.1,
    gateFlag: 'pass',
    gateReason: 'registered',
    lastScannedBarcode: '0890801489635500260101102614640093',
    estimatedRemainingMinutes: 5.4,
    sessionDurationMinutes: 31,
    supervisor: initialSupervisors[0],
    lastUpdated: Date.now(),
  },
  {
    bayId: 10,
    bayName: 'Bay 10',
    dockLocation: 'Central-East Dock',
    truckReg: 'DL01XY4567',
    indentNo: 'BOTTELING805617-CLB1-WHOLESALE657440-CL2-GORA-Oct26_00000142',
    licenceNo: 'LIC/BOTTLING/CLB1/02/26_27',
    allocatedQty: 450,
    loadedQty: 0,
    beltState: 'paused',
    status: 'preparing',
    stopCause: 'Handset syncing transport pass on Scan tab',
    paceCpm: 0,
    gateFlag: 'waiting',
    gateReason: 'not_ready',
    lastScannedBarcode: 'Awaiting Slip Scan',
    estimatedRemainingMinutes: 19.2,
    sessionDurationMinutes: 2,
    supervisor: initialSupervisors[1],
    lastUpdated: Date.now(),
  },
];

// Realistic Multi-Horizon Data Generator
export function getKpisForTimeframe(timeframe: Timeframe): KPIStats {
  switch (timeframe) {
    case 'realtime':
      return {
        totalDispatched: 384,
        dispatchTarget: 500,
        trucksCleared: 0,
        trucksTarget: 1,
        avgTatMinutes: 28,
        tatBenchmarkMinutes: 35,
        clearanceRate: 99.74,
        refusalCount: 1,
        activeAlarmsCount: 2,
      };
    case 'daily':
      return {
        totalDispatched: 18450,
        dispatchTarget: 22000,
        trucksCleared: 24,
        trucksTarget: 28,
        avgTatMinutes: 34.2,
        tatBenchmarkMinutes: 40.0,
        clearanceRate: 99.42,
        refusalCount: 18,
        activeAlarmsCount: 5,
      };
    case 'monthly':
      return {
        totalDispatched: 542800,
        dispatchTarget: 600000,
        trucksCleared: 712,
        trucksTarget: 750,
        avgTatMinutes: 36.8,
        tatBenchmarkMinutes: 40.0,
        clearanceRate: 99.61,
        refusalCount: 342,
        activeAlarmsCount: 14,
      };
    case 'yearly':
      return {
        totalDispatched: 6840000,
        dispatchTarget: 7200000,
        trucksCleared: 8940,
        trucksTarget: 9200,
        avgTatMinutes: 37.1,
        tatBenchmarkMinutes: 40.0,
        clearanceRate: 99.58,
        refusalCount: 4210,
        activeAlarmsCount: 29,
      };
  }
}

export function getChartDataForTimeframe(timeframe: Timeframe): ChartDataPoint[] {
  switch (timeframe) {
    case 'realtime':
      // Past 60 minutes sampled every 5 minutes, expressed as cases/min
      return [
        { label: '12:10', volume: 18.4, target: 20 },
        { label: '12:15', volume: 17.6, target: 20 },
        { label: '12:20', volume: 18.8, target: 20 },
        { label: '12:25', volume: 19.2, target: 20 },
        { label: '12:30', volume: 14.4, target: 20 }, // temporary stop
        { label: '12:35', volume: 17.8, target: 20 },
        { label: '12:40', volume: 20.8, target: 20 },
        { label: '12:45', volume: 19.6, target: 20 },
        { label: '12:50', volume: 20.4, target: 20 },
        { label: '12:55', volume: 21.2, target: 20 },
        { label: '13:00', volume: 22.0, target: 20 },
        { label: '13:05', volume: 19.0, target: 20 },
        { label: '13:10', volume: 19.8, target: 20 },
      ];
    case 'daily':
      // 24-hour shift curve
      return [
        { label: '06:00', volume: 420, target: 600, shiftA: 420 },
        { label: '08:00', volume: 850, target: 900, shiftA: 850 },
        { label: '10:00', volume: 1240, target: 1100, shiftA: 1240 },
        { label: '12:00', volume: 1180, target: 1100, shiftA: 1180 },
        { label: '14:00', volume: 980, target: 1000, shiftB: 980 },
        { label: '16:00', volume: 1350, target: 1200, shiftB: 1350 },
        { label: '18:00', volume: 1410, target: 1200, shiftB: 1410 },
        { label: '20:00', volume: 1120, target: 1100, shiftB: 1120 },
        { label: '22:00', volume: 790, target: 800, shiftC: 790 },
        { label: '00:00', volume: 640, target: 700, shiftC: 640 },
        { label: '02:00', volume: 580, target: 650, shiftC: 580 },
        { label: '04:00', volume: 610, target: 650, shiftC: 610 },
      ];
    case 'monthly':
      // Past 30 days sample
      return Array.from({ length: 30 }, (_, i) => {
        const day = i + 1;
        const base = 16000 + Math.sin(i / 3) * 3500 + (day % 7 === 0 ? -4000 : 1500);
        return {
          label: `Oct ${day < 10 ? '0' + day : day}`,
          volume: Math.round(base),
          target: 20000,
          tatMinutes: Math.round(32 + Math.random() * 8),
          clearanceRate: +(99.2 + Math.random() * 0.7).toFixed(2),
        };
      });
    case 'yearly':
      // 12 months with festive peak in Oct/Nov/Dec
      const months = ['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'];
      const volumes = [580000, 640000, 510000, 490000, 530000, 550000, 540000, 560000, 570000, 590000, 620000, 660000];
      return months.map((m, idx) => ({
        label: m,
        volume: volumes[idx],
        target: 600000,
        tatMinutes: +(35 + (idx % 3)).toFixed(1),
        clearanceRate: +(99.4 + (idx % 4) * 0.1).toFixed(2),
      }));
  }
}

/**
 * One-minute samples for the wall's Plant Pulse. The realtime source is
 * captured every five minutes, so interpolate between anchors to give the
 * wall a true per-minute pulse over the rolling 60-minute window.
 */
export function getPlantPulseSamples(): ChartDataPoint[] {
  const anchors = getChartDataForTimeframe('realtime');
  if (anchors.length === 0) return [];

  const [startHour, startMinute] = anchors[0].label.split(':').map(Number);
  const totalMinutes = (anchors.length - 1) * 5;
  const samples: ChartDataPoint[] = [];

  for (let minute = 0; minute <= totalMinutes; minute += 1) {
    const position = minute / 5;
    const lowerIndex = Math.floor(position);
    const upperIndex = Math.min(anchors.length - 1, Math.ceil(position));
    const mix = position - lowerIndex;
    const lower = anchors[lowerIndex];
    const upper = anchors[upperIndex];
    const base = lower.volume + (upper.volume - lower.volume) * mix;
    // A small deterministic wiggle keeps the minute-level line from looking ruled.
    const wobble = mix === 0 ? 0 : Math.sin(minute * 1.7) * 0.18;
    const clockMinutes = startHour * 60 + startMinute + minute;
    const label = `${String(Math.floor(clockMinutes / 60) % 24).padStart(2, '0')}:${String(clockMinutes % 60).padStart(2, '0')}`;

    samples.push({
      label,
      volume: Number(Math.max(0, base + wobble).toFixed(1)),
      target: lower.target,
    });
  }

  return samples;
}

export const sampleIncidents: IncidentItem[] = [
  {
    id: 4272,
    type: 'throw',
    severity: 'high',
    occurred_at: '2026-10-14 12:48:10',
    barcode_value: '0890801489635500260101102614571990',
    status: 'open',
    details: 'Free-fall acceleration detected: airborne 0.42s, accel 1.34g, speed 2.1m/s',
    bay_id: 1,
    bay_name: 'Bay 1',
    truck_reg: 'UP58AT9207',
  },
  {
    id: 4271,
    type: 'drop',
    severity: 'medium',
    occurred_at: '2026-10-14 12:44:22',
    barcode_value: '0890801489635500260101102614571814',
    status: 'open',
    details: 'Impact spike: box left person grasp at height 0.65m onto truck floor',
    bay_id: 1,
    bay_name: 'Bay 1',
    truck_reg: 'UP58AT9207',
  },
  {
    id: 4270,
    type: 'unscanned_box',
    severity: 'medium',
    occurred_at: '2026-10-14 12:35:05',
    barcode_value: null,
    status: 'open',
    details: 'Box placed in stack zone without matching recent scan within 180s correlation window',
    bay_id: 2,
    bay_name: 'Bay 2',
    truck_reg: 'UP16AT5656',
  },
  {
    id: 4269,
    type: 'missing_box',
    severity: 'high',
    occurred_at: '2026-10-14 11:58:30',
    barcode_value: '0890801489635500260101102614512340',
    status: 'open',
    details: 'Barcode decoded at cage but never reached stack before session closure sweep',
    bay_id: 3,
    bay_name: 'Bay 3',
    truck_reg: 'HR38AB1234',
  },
  {
    id: 4268,
    type: 'camera_blocked',
    severity: 'high',
    occurred_at: '2026-10-14 11:20:15',
    barcode_value: null,
    status: 'reviewed',
    details: 'Handling lane camera view obscured for > 5.0 seconds. Restored automatically.',
    bay_id: 1,
    bay_name: 'Bay 1',
    truck_reg: 'UP58AT9207',
    notes: 'Verified against adjacent camera. No handling activity during occlusion.',
    reviewed_by: 'Anil Kumar',
    reviewed_by_id: 'SAI-003',
    reviewed_at: '2026-10-14T11:26:02.000Z',
  },
  {
    id: 4267,
    type: 'portal_silent',
    severity: 'high',
    occurred_at: '2026-10-14 10:14:02',
    barcode_value: null,
    status: 'reviewed',
    details: 'Excise portal did not respond within 8.0s hold limit. Belt stopped automatically.',
    bay_id: 4,
    bay_name: 'Bay 4',
    truck_reg: 'UP65BT7890',
    notes: 'Portal retry succeeded on second attempt. Escalated to Excise IT.',
    reviewed_by: 'Rajesh Sharma',
    reviewed_by_id: 'SAI-004',
    reviewed_at: '2026-10-14T10:22:44.000Z',
  },
  {
    id: 4266,
    type: 'throw',
    severity: 'medium',
    occurred_at: '2026-10-13 18:22:41',
    barcode_value: '0890801489635500260101102614500871',
    status: 'open',
    details: 'Carton trajectory changed abruptly mid-transfer; no visible damage on follow-up frame.',
    bay_id: 2,
    bay_name: 'Bay 2',
    truck_reg: 'UP16AT5656',
  },
  {
    id: 4265,
    type: 'unscanned_box',
    severity: 'low',
    occurred_at: '2026-10-13 09:07:12',
    barcode_value: null,
    status: 'dismissed',
    details: 'Uncorrelated box detected during shift-change handover overlap.',
    bay_id: 3,
    bay_name: 'Bay 3',
    truck_reg: 'HR38AB1234',
    notes: 'Confirmed with outgoing and incoming supervisors.',
    dismissal_reason: 'Known shift-change overlap; box was scanned on the cage reader two seconds later.',
    dismissed_by: 'Anil Kumar',
    dismissed_by_id: 'SAI-003',
    dismissed_at: '2026-10-13T09:18:07.000Z',
  },
  {
    id: 4264,
    type: 'missing_box',
    severity: 'critical',
    occurred_at: '2026-10-12 16:45:03',
    barcode_value: '0890801489635500260101102614493120',
    status: 'open',
    details: 'Expected carton count mismatch at seal verification. Barcode absent from final stack sweep.',
    bay_id: 4,
    bay_name: 'Bay 4',
    truck_reg: 'UP65BT7890',
  },
  {
    id: 4263,
    type: 'camera_blocked',
    severity: 'low',
    occurred_at: '2026-10-11 22:10:19',
    barcode_value: null,
    status: 'reviewed',
    details: 'Brief lens flare from dock floodlight triggered a 1.8s visibility dip.',
    bay_id: 1,
    bay_name: 'Bay 1',
    truck_reg: 'UP58AT9207',
    notes: 'False positive from floodlight maintenance. Camera feed healthy.',
    reviewed_by: 'Pawan Verma',
    reviewed_by_id: 'SAI-005',
    reviewed_at: '2026-10-11T22:14:51.000Z',
  },
];

export const sampleRemovals: RemovalItem[] = [
  {
    id: 1,
    session_id: 118,
    truck_reg: 'UP58AT9207',
    indent_no: 'BOTTELING288987-CLB2-WHOLESALE544831-CL2-GORA-Oct26_00000070',
    barcode_value: '0890801489635500260101102614571814',
    reason: 'Damaged outer carton detected during stacking; replaced with fresh inventory',
    authorizer: 'Anil Kumar',
    employee_id: 'SAI-003',
    timestamp: '2026-10-14 12:58:02',
    requested_by: 'Rajesh Sharma',
    requested_by_id: 'SAI-004',
    requested_at: '2026-10-14 12:57:41',
    approved_by: 'Anil Kumar',
    approved_by_id: 'SAI-003',
    approved_at: '2026-10-14 12:58:02',
    hash_verified: true,
    hash: 'sha256:4f9a72c1e8d30b5f...c21b',
  },
  {
    id: 2,
    session_id: 118,
    truck_reg: 'UP58AT9207',
    indent_no: 'BOTTELING288987-CLB2-WHOLESALE544831-CL2-GORA-Oct26_00000070',
    barcode_value: '0890801489635500260101102614540662',
    reason: 'Misread case code duplicated on dispatch pass; supervisor verified and removed',
    authorizer: 'Avinash Singh',
    employee_id: 'SAI-002',
    timestamp: '2026-10-14 13:00:09',
    requested_by: 'Avinash Singh',
    requested_by_id: 'SAI-002',
    requested_at: '2026-10-14 13:00:09',
    approved_by: null,
    approved_by_id: null,
    approved_at: null,
    hash_verified: true,
    hash: 'sha256:8b31d0a97c2e4f16...7be4',
  },
  {
    id: 3,
    session_id: 121,
    truck_reg: 'UP16AT5656',
    indent_no: 'BOTTELINGCLB102-CLB1-WHOLESALE417104-CL2-GORA-Oct26_00000536',
    barcode_value: '0890801489635500260101102614591120',
    reason: 'Carton seal torn during belt transfer; contents reconciled at cage',
    authorizer: 'Pawan Verma',
    employee_id: 'SAI-005',
    timestamp: '2026-10-14 13:14:38',
    requested_by: 'Pawan Verma',
    requested_by_id: 'SAI-005',
    requested_at: '2026-10-14 13:14:38',
    approved_by: 'Pawan Verma',
    approved_by_id: 'SAI-005',
    approved_at: '2026-10-14 13:15:02',
    hash_verified: false,
    hash: 'sha256:pending...',
  },
];

export const gateDiversionReasons = [
  { reason: 'Quantity Limit Reached', count: 142, percentage: 48, code: 'qty_reached', color: 'var(--chart-2)' },
  { reason: 'Portal Refusal (Invalid Pass)', count: 68, percentage: 23, code: 'refused', color: 'var(--chart-3)' },
  { reason: 'Duplicate on Another Truck', count: 52, percentage: 17, code: 'duplicate', color: 'var(--chart-4)' },
  { reason: 'Unreadable / Non-34-digit Code', count: 24, percentage: 8, code: 'not_case_code', color: 'var(--chart-1)' },
  { reason: 'Supervisor Override', count: 12, percentage: 4, code: 'supervisor', color: 'var(--chart-5)' },
];

export type DiversionResolution = 'returned' | 'held' | 'repack' | 'override';

export interface GateDiversionCase {
  id: string;
  reasonCode: string;
  occurredAt: string;
  barcode: string;
  truckReg: string;
  bayName: string;
  portalResponse: string;
  resolution: DiversionResolution;
  operator: string;
}

/**
 * Recent sample events behind each aggregate diversion reason. The dashboard
 * mock adapter has no historical diversion warehouse, so this surfaces the
 * latest records for drill-down instead of re-aggregating them on click.
 */
export const gateDiversionCases: Record<string, GateDiversionCase[]> = {
  qty_reached: [
    {
      id: 'DIV-1042',
      reasonCode: 'qty_reached',
      occurredAt: '2026-10-14 13:42:08',
      barcode: '0890801489635500260101102614571814',
      truckReg: 'UP58AT9207',
      bayName: 'Bay 1',
      portalResponse: 'Portal refused: scanningQty 501 > indent requestQty 500',
      resolution: 'returned',
      operator: 'Anil Kumar',
    },
    {
      id: 'DIV-1041',
      reasonCode: 'qty_reached',
      occurredAt: '2026-10-14 13:39:51',
      barcode: '0890801489635500260101102614571990',
      truckReg: 'UP16AT5656',
      bayName: 'Bay 2',
      portalResponse: 'Portal refused: scanningQty 343 > indent requestQty 342',
      resolution: 'held',
      operator: 'Pawan Verma',
    },
    {
      id: 'DIV-1038',
      reasonCode: 'qty_reached',
      occurredAt: '2026-10-14 13:31:17',
      barcode: '0890801489635500260101102614577053',
      truckReg: 'HR38AB1234',
      bayName: 'Bay 3',
      portalResponse: 'Portal refused: indent quantity 500 already exhausted',
      resolution: 'returned',
      operator: 'Rajesh Sharma',
    },
    {
      id: 'DIV-1036',
      reasonCode: 'qty_reached',
      occurredAt: '2026-10-14 13:26:02',
      barcode: '0890801489635500260101102614576228',
      truckReg: 'UP65BT7890',
      bayName: 'Bay 4',
      portalResponse: 'Portal refused: scanningQty 421 > requestQty 420',
      resolution: 'repack',
      operator: 'Avinash Singh',
    },
  ],
  refused: [
    {
      id: 'DIV-1035',
      reasonCode: 'refused',
      occurredAt: '2026-10-14 13:22:44',
      barcode: '0890801489635500260101102614576508',
      truckReg: 'UP65BT7890',
      bayName: 'Bay 4',
      portalResponse: 'Invalid transport pass — statusCode 3 (pass not active for today)',
      resolution: 'held',
      operator: 'Pawan Verma',
    },
    {
      id: 'DIV-1032',
      reasonCode: 'refused',
      occurredAt: '2026-10-14 13:15:09',
      barcode: '0890801489635500260101102614575481',
      truckReg: 'UP58AT9207',
      bayName: 'Bay 1',
      portalResponse: 'Licence quota mismatch: CL2 case against CL1 pass',
      resolution: 'held',
      operator: 'Avinash Singh',
    },
    {
      id: 'DIV-1029',
      reasonCode: 'refused',
      occurredAt: '2026-10-14 13:07:36',
      barcode: '0890801489635500260101102614574096',
      truckReg: 'UP16AT5656',
      bayName: 'Bay 2',
      portalResponse: 'Transport pass expired 2026-10-13 23:59',
      resolution: 'held',
      operator: 'Anil Kumar',
    },
  ],
  duplicate: [
    {
      id: 'DIV-1026',
      reasonCode: 'duplicate',
      occurredAt: '2026-10-14 12:58:22',
      barcode: '0890801489635500260101102614573340',
      truckReg: 'UP58AT9207',
      bayName: 'Bay 1',
      portalResponse: 'Barcode already registered in session 117 (truck UP16AT5656)',
      resolution: 'repack',
      operator: 'Anil Kumar',
    },
    {
      id: 'DIV-1023',
      reasonCode: 'duplicate',
      occurredAt: '2026-10-14 12:51:40',
      barcode: '0890801489635500260101102614573129',
      truckReg: 'UP16AT5656',
      bayName: 'Bay 2',
      portalResponse: 'Duplicate scan — same case recorded at Bay 4 cage',
      resolution: 'returned',
      operator: 'Rajesh Sharma',
    },
    {
      id: 'DIV-1019',
      reasonCode: 'duplicate',
      occurredAt: '2026-10-14 12:44:03',
      barcode: '0890801489635500260101102614572875',
      truckReg: 'HR38AB1234',
      bayName: 'Bay 3',
      portalResponse: 'Duplicate on another truck — orderPickupId 10111984',
      resolution: 'held',
      operator: 'Pawan Verma',
    },
  ],
  not_case_code: [
    {
      id: 'DIV-1016',
      reasonCode: 'not_case_code',
      occurredAt: '2026-10-14 12:36:18',
      barcode: '89080148963550026101102614',
      truckReg: 'UP65BT7890',
      bayName: 'Bay 4',
      portalResponse: 'Decoded 26 digits — expected 34-digit case code',
      resolution: 'returned',
      operator: 'Avinash Singh',
    },
    {
      id: 'DIV-1014',
      reasonCode: 'not_case_code',
      occurredAt: '2026-10-14 12:31:52',
      barcode: '0890801489635500260101102614571X',
      truckReg: 'HR38AB1234',
      bayName: 'Bay 3',
      portalResponse: 'Non-numeric check digit in 34-character code',
      resolution: 'repack',
      operator: 'Rajesh Sharma',
    },
    {
      id: 'DIV-1011',
      reasonCode: 'not_case_code',
      occurredAt: '2026-10-14 12:24:37',
      barcode: '08908014896355002601011026145718',
      truckReg: 'UP16AT5656',
      bayName: 'Bay 2',
      portalResponse: 'Decoded 32 digits — truncated print on case label',
      resolution: 'returned',
      operator: 'Anil Kumar',
    },
  ],
  supervisor: [
    {
      id: 'DIV-1009',
      reasonCode: 'supervisor',
      occurredAt: '2026-10-14 12:18:05',
      barcode: '0890801489635500260101102614572404',
      truckReg: 'UP58AT9207',
      bayName: 'Bay 1',
      portalResponse: 'Portal timeout 8.4s — supervisor manual override',
      resolution: 'override',
      operator: 'Anil Kumar',
    },
    {
      id: 'DIV-1007',
      reasonCode: 'supervisor',
      occurredAt: '2026-10-14 12:11:43',
      barcode: '0890801489635500260101102614571027',
      truckReg: 'UP16AT5656',
      bayName: 'Bay 2',
      portalResponse: 'Portal HTTP 503 during peak — override with handwritten slip',
      resolution: 'override',
      operator: 'Pawan Verma',
    },
    {
      id: 'DIV-1004',
      reasonCode: 'supervisor',
      occurredAt: '2026-10-14 12:03:29',
      barcode: '0890801489635500260101102614570691',
      truckReg: 'UP65BT7890',
      bayName: 'Bay 4',
      portalResponse: 'ETIN mismatch resolved with supervisor step-up token',
      resolution: 'override',
      operator: 'Avinash Singh',
    },
  ],
};

export const hardwareDevices = [
  {
    id: 'mvid01',
    name: 'Hikrobot Barcode Reader',
    model: 'MV-ID2013M-06S-WBN',
    role: 'cam_out (Cage Reader)',
    status: 'online',
    latencyMs: 14,
    health: 100,
    firmware: 'v3.2.1-onboard',
  },
  {
    id: 'cpplus01',
    name: 'CP Plus Truck CCTV Monitor',
    model: 'CP-UNC-DA51PL3C-L-Y',
    role: 'cam_in (Handling & AI)',
    status: 'online',
    latencyMs: 38,
    health: 98,
    firmware: 'v2.4.0',
  },
  {
    id: 'posHandset',
    name: 'Android POS Terminal',
    model: 'ADB Port 5037 (TEG9300MTOC16169)',
    role: 'Excise State Portal Bridge',
    status: 'online',
    latencyMs: 142,
    health: 95,
    firmware: 'Android 13 / SAI-Agent',
  },
];
