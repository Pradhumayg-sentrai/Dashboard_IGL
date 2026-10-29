import { create } from 'zustand';
import type { 
  Timeframe, 
  LiveBayState, 
  IncidentItem, 
  AuditEntry,
  KPIStats, 
  ChartDataPoint 
} from '../data/plantData';
import { 
  initialMultiBays, 
  sampleIncidents, 
  getKpisForTimeframe, 
  getChartDataForTimeframe 
} from '../data/plantData';
import type { ConnectionStatus, BayDelta } from '../data/adapter';
import { getActiveAdapter } from '../data/adapter';

interface DashboardState {
  // Connection & Data Freshness
  connectionStatus: ConnectionStatus;
  lastUpdateTimestamp: number;
  setConnectionStatus: (status: ConnectionStatus) => void;
  setLastUpdateTimestamp: (ts: number) => void;

  // Global State
  timeframe: Timeframe;
  setTimeframe: (tf: Timeframe) => void;

  isSimulating: boolean;
  setIsSimulating: (sim: boolean) => void;
  toggleSimulation: () => void;

  bays: LiveBayState[];
  toggleBayBelt: (bayId: number) => void;
  applyBayDeltas: (deltas: BayDelta[], timestamp: number) => void;
  setFullBays: (bays: LiveBayState[], timestamp: number) => void;

  // Incidents and Audits
  incidents: IncidentItem[];
  inspectedIncident: IncidentItem | null;
  auditLog: AuditEntry[];
  setInspectedIncident: (item: IncidentItem | null) => void;
  updateIncident: (id: number, patch: Partial<IncidentItem>) => void;
  updateIncidents: (ids: number[], patch: Partial<IncidentItem>) => void;
  appendAuditEntry: (entry: AuditEntry) => void;

  // Computed helper getters
  getKpis: () => KPIStats;
  getChartData: () => ChartDataPoint[];
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  connectionStatus: 'live',
  lastUpdateTimestamp: Date.now(),
  setConnectionStatus: (connectionStatus) => set({ connectionStatus }),
  setLastUpdateTimestamp: (lastUpdateTimestamp) => set({ lastUpdateTimestamp }),

  timeframe: 'realtime',
  setTimeframe: (timeframe) => set({ timeframe }),

  isSimulating: true,
  setIsSimulating: (isSimulating) => {
    getActiveAdapter().setSimulating?.(isSimulating);
    set({ isSimulating });
  },
  toggleSimulation: () => {
    const next = !get().isSimulating;
    getActiveAdapter().setSimulating?.(next);
    set({ isSimulating: next });
  },

  bays: initialMultiBays,

  toggleBayBelt: (bayId: number) => {
    const adapter = getActiveAdapter();
    adapter.toggleBelt?.(bayId);

    // Optimistic update
    set(state => ({
      bays: state.bays.map(b => {
        if (b.bayId !== bayId) return b;
        const isRunning = b.beltState === 'running';
        return {
          ...b,
          beltState: isRunning ? 'paused' : 'running',
          status: isRunning ? 'stopped' : 'loading',
          stopCause: isRunning ? 'Manual Supervisor Pause' : null,
          paceCpm: isRunning ? 0 : b.bayId === 1 ? 19.2 : 21.4,
          lastUpdated: Date.now(),
        };
      }),
      lastUpdateTimestamp: Date.now(),
    }));
  },

  applyBayDeltas: (deltas: BayDelta[], timestamp: number) => {
    set(state => {
      const deltaMap = new Map<number, BayDelta>(deltas.map(d => [d.bayId, d]));
      const updatedBays = state.bays.map(b => {
        const delta = deltaMap.get(b.bayId);
        if (!delta) return b;
        return {
          ...b,
          ...(delta.loadedQty !== undefined && { loadedQty: delta.loadedQty }),
          ...(delta.lastScannedBarcode !== undefined && { lastScannedBarcode: delta.lastScannedBarcode }),
          ...(delta.estimatedRemainingMinutes !== undefined && { estimatedRemainingMinutes: delta.estimatedRemainingMinutes }),
          ...(delta.status !== undefined && { status: delta.status }),
          ...(delta.beltState !== undefined && { beltState: delta.beltState }),
          ...(delta.stopCause !== undefined && { stopCause: delta.stopCause }),
          ...(delta.paceCpm !== undefined && { paceCpm: delta.paceCpm }),
          lastUpdated: delta.lastUpdated || timestamp,
        };
      });

      return {
        bays: updatedBays,
        lastUpdateTimestamp: timestamp,
      };
    });
  },

  setFullBays: (bays: LiveBayState[], timestamp: number) => {
    set({
      bays,
      lastUpdateTimestamp: timestamp,
    });
  },

  incidents: sampleIncidents,
  inspectedIncident: null,
  auditLog: [],
  setInspectedIncident: (inspectedIncident) => set({ inspectedIncident }),

  updateIncident: (id, patch) => {
    set(state => ({
      incidents: state.incidents.map(inc => inc.id === id ? { ...inc, ...patch } : inc),
      inspectedIncident: state.inspectedIncident?.id === id
        ? { ...state.inspectedIncident, ...patch }
        : state.inspectedIncident,
    }));
  },

  updateIncidents: (ids, patch) => {
    const idSet = new Set(ids);
    set(state => ({
      incidents: state.incidents.map(inc => idSet.has(inc.id) ? { ...inc, ...patch } : inc),
      inspectedIncident: state.inspectedIncident && idSet.has(state.inspectedIncident.id)
        ? { ...state.inspectedIncident, ...patch }
        : state.inspectedIncident,
    }));
  },

  appendAuditEntry: (entry) => {
    set(state => ({ auditLog: [entry, ...state.auditLog].slice(0, 500) }));
  },

  getKpis: () => {
    const { timeframe, bays } = get();
    const kpis = getKpisForTimeframe(timeframe);

    if (timeframe !== 'realtime') return kpis;

    // Keep the live scorecard aligned with the actual fleet instead of a
    // single hard-coded bay.
    return {
      ...kpis,
      totalDispatched: bays.reduce((sum, bay) => sum + bay.loadedQty, 0),
      dispatchTarget: bays.reduce((sum, bay) => sum + bay.allocatedQty, 0),
      trucksTarget: bays.length,
      activeAlarmsCount: bays.filter(bay => bay.status === 'stopped').length,
    };
  },
  getChartData: () => getChartDataForTimeframe(get().timeframe),
}));

// Narrow Selector Hooks
export const useConnectionStatus = () => useDashboardStore(s => s.connectionStatus);
export const useLastUpdateTimestamp = () => useDashboardStore(s => s.lastUpdateTimestamp);
export const useTimeframe = () => useDashboardStore(s => s.timeframe);
export const useSetTimeframe = () => useDashboardStore(s => s.setTimeframe);
export const useBays = () => useDashboardStore(s => s.bays);
export const useToggleBayBelt = () => useDashboardStore(s => s.toggleBayBelt);
export const useIsSimulating = () => useDashboardStore(s => s.isSimulating);
export const useToggleSimulation = () => useDashboardStore(s => s.toggleSimulation);
export const useIncidents = () => useDashboardStore(s => s.incidents);
export const useInspectedIncident = () => useDashboardStore(s => s.inspectedIncident);
export const useSetInspectedIncident = () => useDashboardStore(s => s.setInspectedIncident);
