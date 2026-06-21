/**
 * Connection metrics helper for WebSocket lifecycle observability.
 *
 * Tracks reconnect attempts, disconnect reasons, and connection timestamps
 * for testing and diagnostic purposes without exposing sensitive data.
 */

export interface ConnectionMetricsState {
  reconnectAttempts: number;
  lastDisconnectReason: string | null;
  lastConnectTimestamp: number | null;
  lastDisconnectTimestamp: number | null;
  isConnected: boolean;
}

export type DisconnectSource = "expected" | "unexpected" | "error" | "unknown";

export interface DisconnectEvent {
  reason: string;
  source: DisconnectSource;
  timestamp: number;
  previousUptime: number;
}

export type MetricsListener = (state: ConnectionMetricsState) => void;
export type DisconnectListener = (event: DisconnectEvent) => void;

export class ConnectionMetrics {
  private _reconnectAttempts = 0;
  private _lastDisconnectReason: string | null = null;
  private _lastConnectTimestamp: number | null = null;
  private _lastDisconnectTimestamp: number | null = null;
  private _isConnected = false;
  private _connectStart: number | null = null;

  private metricsListeners: MetricsListener[] = [];
  private disconnectListeners: DisconnectListener[] = [];

  get state(): ConnectionMetricsState {
    return {
      reconnectAttempts: this._reconnectAttempts,
      lastDisconnectReason: this._lastDisconnectReason,
      lastConnectTimestamp: this._lastConnectTimestamp,
      lastDisconnectTimestamp: this._lastDisconnectTimestamp,
      isConnected: this._isConnected,
    };
  }

  get reconnectAttempts(): number {
    return this._reconnectAttempts;
  }

  recordConnect(): void {
    this._isConnected = true;
    this._lastConnectTimestamp = Date.now();
    this._connectStart = this._lastConnectTimestamp;
    this._reconnectAttempts = 0;
    this._lastDisconnectReason = null;
    this.notify();
  }

  recordDisconnect(reason: string, source: DisconnectSource = "unknown"): void {
    const previousUptime = this._connectStart
      ? Date.now() - this._connectStart
      : 0;

    this._isConnected = false;
    this._lastDisconnectReason = reason;
    this._lastDisconnectTimestamp = Date.now();
    this._connectStart = null;

    const event: DisconnectEvent = {
      reason,
      source,
      timestamp: this._lastDisconnectTimestamp,
      previousUptime,
    };

    this.notify();
    this.disconnectListeners.forEach((cb) => cb(event));
  }

  recordReconnectAttempt(): void {
    this._reconnectAttempts++;
    this.notify();
  }

  reset(): void {
    this._reconnectAttempts = 0;
    this._lastDisconnectReason = null;
    this._lastConnectTimestamp = null;
    this._lastDisconnectTimestamp = null;
    this._isConnected = false;
    this._connectStart = null;
    this.notify();
  }

  onMetricsChange(cb: MetricsListener): () => void {
    this.metricsListeners.push(cb);
    return () => {
      this.metricsListeners = this.metricsListeners.filter((l) => l !== cb);
    };
  }

  onDisconnect(cb: DisconnectListener): () => void {
    this.disconnectListeners.push(cb);
    return () => {
      this.disconnectListeners = this.disconnectListeners.filter((l) => l !== cb);
    };
  }

  private notify(): void {
    this.metricsListeners.forEach((cb) => cb(this.state));
  }
}

export default ConnectionMetrics;
