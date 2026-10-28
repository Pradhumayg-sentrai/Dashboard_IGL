import type { DataAdapter, DataEvent, SnapshotData, ConnectionStatus, BayDelta } from './adapter';
import type { LiveBayState, IncidentItem } from './plantData';
import { initialMultiBays, sampleIncidents } from './plantData';

export class MockDataAdapter implements DataAdapter {
  private seq = 1;
  private bays: LiveBayState[] = [...initialMultiBays];
  private incidents: IncidentItem[] = [...sampleIncidents];
  private listeners = new Set<(event: DataEvent) => void>();
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private isSimulating = true;
  private status: ConnectionStatus = 'live';

  constructor() {
    this.startSimulation();
  }

  public async getSnapshot(): Promise<SnapshotData> {
    return {
      bays: [...this.bays],
      incidents: [...this.incidents],
      seq: this.seq++,
      timestamp: Date.now(),
    };
  }

  public subscribe(onEvent: (event: DataEvent) => void): () => void {
    this.listeners.add(onEvent);

    // Immediately send current status and initial snapshot to new subscriber
    onEvent({
      type: 'status',
      status: this.status,
      seq: this.seq++,
      timestamp: Date.now(),
    });

    onEvent({
      type: 'snapshot',
      data: {
        bays: [...this.bays],
        incidents: [...this.incidents],
        seq: this.seq++,
        timestamp: Date.now(),
      },
      seq: this.seq++,
      timestamp: Date.now(),
    });

    return () => {
      this.listeners.delete(onEvent);
    };
  }

  public getStatus(): ConnectionStatus {
    return this.status;
  }

  public setSimulating(sim: boolean): void {
    this.isSimulating = sim;
    if (sim && !this.intervalId) {
      this.startSimulation();
    } else if (!sim && this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  public toggleBelt(bayId: number): void {
    const bay = this.bays.find(b => b.bayId === bayId);
    if (!bay) return;

    const isRunning = bay.beltState === 'running';
    const now = Date.now();

    const updatedBay: LiveBayState = {
      ...bay,
      beltState: isRunning ? 'paused' : 'running',
      status: isRunning ? 'stopped' : 'loading',
      stopCause: isRunning ? 'Manual Supervisor Pause' : null,
      paceCpm: isRunning ? 0 : bay.bayId === 1 ? 19.2 : 21.4,
      lastUpdated: now,
    };

    this.bays = this.bays.map(b => b.bayId === bayId ? updatedBay : b);

    const delta: BayDelta = {
      bayId: updatedBay.bayId,
      beltState: updatedBay.beltState,
      status: updatedBay.status,
      stopCause: updatedBay.stopCause,
      paceCpm: updatedBay.paceCpm,
      lastUpdated: now,
    };

    this.broadcast({
      type: 'delta',
      data: { bays: [delta] },
      seq: this.seq++,
      timestamp: now,
    });
  }

  private startSimulation(): void {
    if (this.intervalId) return;

    this.intervalId = setInterval(() => {
      if (!this.isSimulating) return;

      const now = Date.now();
      const deltas: BayDelta[] = [];

      this.bays = this.bays.map(bay => {
        // Only loading and running bays generate continuous carton scans
        if (bay.status !== 'loading' || bay.beltState !== 'running') {
          return bay;
        }

        if (bay.loadedQty >= bay.allocatedQty) {
          const finishedBay: LiveBayState = {
            ...bay,
            status: 'loading',
            beltState: 'paused',
            stopCause: 'Target Quantity Reached - Awaiting Seal',
            lastUpdated: now,
          };
          deltas.push({
            bayId: finishedBay.bayId,
            status: finishedBay.status,
            beltState: finishedBay.beltState,
            stopCause: finishedBay.stopCause,
            lastUpdated: now,
          });
          return finishedBay;
        }

        const nextCount = bay.loadedQty + 1;
        const randomHex = Math.floor(Math.random() * 900000 + 100000);
        const nextBarcode = `0890801489635500260101102614${randomHex}`;
        const remainingMinutes = +(Math.max(0, (bay.allocatedQty - nextCount) / (bay.paceCpm || 20))).toFixed(1);

        const updatedBay: LiveBayState = {
          ...bay,
          loadedQty: nextCount,
          lastScannedBarcode: nextBarcode,
          estimatedRemainingMinutes: remainingMinutes,
          lastUpdated: now,
        };

        deltas.push({
          bayId: updatedBay.bayId,
          loadedQty: updatedBay.loadedQty,
          lastScannedBarcode: updatedBay.lastScannedBarcode,
          estimatedRemainingMinutes: updatedBay.estimatedRemainingMinutes,
          lastUpdated: now,
        });

        return updatedBay;
      });

      if (deltas.length > 0) {
        this.broadcast({
          type: 'delta',
          data: { bays: deltas },
          seq: this.seq++,
          timestamp: now,
        });
      }
    }, 2500);
  }

  private broadcast(event: DataEvent): void {
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (err) {
        console.error('Error delivering event to listener in MockDataAdapter:', err);
      }
    });
  }
}

export const mockAdapter = new MockDataAdapter();

