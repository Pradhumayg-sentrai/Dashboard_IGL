import type { DataAdapter, DataEvent, SnapshotData, ConnectionStatus } from './adapter';

export class WsDataAdapter implements DataAdapter {
  private wsUrl: string;
  private socket: WebSocket | null = null;
  private status: ConnectionStatus = 'offline';
  private listeners = new Set<(event: DataEvent) => void>();
  private lastSeq = 0;
  private hasReceivedSnapshot = false;
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private isClosedManually = false;
  private latestSnapshot: SnapshotData | null = null;

  constructor(url = 'ws://localhost:8000/ws') {
    this.wsUrl = url;
  }

  public async getSnapshot(): Promise<SnapshotData> {
    if (this.latestSnapshot) {
      return this.latestSnapshot;
    }
    // Return empty placeholder if waiting for WS snapshot
    return {
      bays: [],
      incidents: [],
      seq: this.lastSeq,
      timestamp: Date.now(),
    };
  }

  public subscribe(onEvent: (event: DataEvent) => void): () => void {
    this.listeners.add(onEvent);

    // Initial status broadcast
    onEvent({
      type: 'status',
      status: this.status,
      seq: this.lastSeq,
      timestamp: Date.now(),
    });

    if (this.listeners.size === 1) {
      this.isClosedManually = false;
      this.connect();
    } else if (this.latestSnapshot) {
      onEvent({
        type: 'snapshot',
        data: this.latestSnapshot,
        seq: this.latestSnapshot.seq,
        timestamp: this.latestSnapshot.timestamp,
      });
    }

    return () => {
      this.listeners.delete(onEvent);
      if (this.listeners.size === 0) {
        this.disconnect();
      }
    };
  }

  public getStatus(): ConnectionStatus {
    return this.status;
  }

  public toggleBelt(bayId: number): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ type: 'toggle_belt', bayId }));
    }
  }

  private connect(): void {
    if (this.isClosedManually) return;
    if (this.socket && (this.socket.readyState === WebSocket.CONNECTING || this.socket.readyState === WebSocket.OPEN)) {
      return;
    }

    this.setStatus(this.reconnectAttempts > 0 ? 'reconnecting' : 'offline');

    try {
      this.socket = new WebSocket(this.wsUrl);

      this.socket.onopen = () => {
        this.reconnectAttempts = 0;
        this.hasReceivedSnapshot = false;
        this.setStatus('live');

        // Request initial snapshot from server
        this.socket?.send(JSON.stringify({ type: 'get_snapshot' }));
      };

      this.socket.onmessage = (event: MessageEvent) => {
        try {
          const msg = JSON.parse(event.data) as DataEvent;

          if (msg.type === 'snapshot') {
            this.lastSeq = msg.seq;
            this.hasReceivedSnapshot = true;
            this.latestSnapshot = msg.data;
            this.broadcast(msg);
            return;
          }

          if (msg.type === 'delta') {
            // Sequence continuity validation
            if (!this.hasReceivedSnapshot || msg.seq !== this.lastSeq + 1) {
              console.warn(`[WsDataAdapter] Out-of-order sequence detected: expected ${this.lastSeq + 1}, got ${msg.seq}. Reconnecting for fresh snapshot.`);
              this.reconnect();
              return;
            }

            this.lastSeq = msg.seq;
            this.broadcast(msg);
            return;
          }

          if (msg.type === 'status') {
            this.setStatus(msg.status);
          }
        } catch (err) {
          console.error('[WsDataAdapter] Failed to parse WebSocket message:', err);
        }
      };

      this.socket.onclose = () => {
        if (!this.isClosedManually) {
          this.scheduleReconnect();
        } else {
          this.setStatus('offline');
        }
      };

      this.socket.onerror = (err) => {
        console.warn('[WsDataAdapter] WebSocket error:', err);
        this.socket?.close();
      };
    } catch (err) {
      console.error('[WsDataAdapter] Connection initialization error:', err);
      this.scheduleReconnect();
    }
  }

  private reconnect(): void {
    if (this.socket) {
      this.socket.onclose = null;
      this.socket.close();
      this.socket = null;
    }
    this.scheduleReconnect();
  }

  private scheduleReconnect(): void {
    if (this.isClosedManually) return;
    this.setStatus('reconnecting');

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    // Exponential backoff: 1000ms -> 1500ms -> 2250ms ... up to 15000ms
    const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts), 15000);
    this.reconnectAttempts++;

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  private disconnect(): void {
    this.isClosedManually = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.setStatus('offline');
  }

  private setStatus(status: ConnectionStatus): void {
    if (this.status !== status) {
      this.status = status;
      this.broadcast({
        type: 'status',
        status,
        seq: this.lastSeq,
        timestamp: Date.now(),
      });
    }
  }

  private broadcast(event: DataEvent): void {
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (err) {
        console.error('[WsDataAdapter] Error in listener dispatch:', err);
      }
    });
  }
}

export const wsAdapter = new WsDataAdapter();

