import type { LiveBayState, IncidentItem } from './plantData';
import { mockAdapter } from './mockAdapter';
import { wsAdapter } from './wsAdapter';

export type ConnectionStatus = 'live' | 'reconnecting' | 'offline';

export interface BayDelta {
  bayId: number;
  loadedQty?: number;
  lastScannedBarcode?: string;
  estimatedRemainingMinutes?: number;
  status?: LiveBayState['status'];
  beltState?: LiveBayState['beltState'];
  stopCause?: string | null;
  paceCpm?: number;
  lastUpdated: number;
}

export interface SnapshotData {
  bays: LiveBayState[];
  incidents: IncidentItem[];
  seq: number;
  timestamp: number;
}

export type DataEvent =
  | {
      type: 'snapshot';
      data: SnapshotData;
      seq: number;
      timestamp: number;
    }
  | {
      type: 'delta';
      data: {
        bays?: BayDelta[];
        incidents?: IncidentItem[];
      };
      seq: number;
      timestamp: number;
    }
  | {
      type: 'status';
      status: ConnectionStatus;
      seq: number;
      timestamp: number;
    };

export interface DataAdapter {
  getSnapshot(): Promise<SnapshotData>;
  subscribe(onEvent: (event: DataEvent) => void): () => void;
  getStatus(): ConnectionStatus;
  toggleBelt?(bayId: number): void;
  setSimulating?(sim: boolean): void;
}

export function getActiveAdapter(): DataAdapter {
  const dataSource = import.meta.env.VITE_DATA_SOURCE;
  if (dataSource === 'ws') {
    return wsAdapter;
  }
  return mockAdapter;
}
