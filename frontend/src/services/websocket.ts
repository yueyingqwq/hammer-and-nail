/**
 * WebSocket reconnection service with exponential backoff.
 *
 * Provides a drop-in replacement for the native WebSocket API
 * with automatic reconnection using exponential backoff with jitter.
 */

export interface WebSocketOptions {
  baseDelay?: number;
  maxDelay?: number;
  maxRetries?: number;
  multiplier?: number;
  jitter?: number;
}

export interface RetryEvent {
  attempt: number;
  delay: number;
}

export type EventCallback = () => void;
export type RetryCallback = (event: RetryEvent) => void;
export type MessageCallback = (event: MessageEvent) => void;
export type ErrorCallback = (error: Event) => void;

const DEFAULTS = {
  baseDelay: 1000,
  maxDelay: 30000,
  maxRetries: Infinity,
  multiplier: 2,
  jitter: 0.3,
};

export class ReconnectingWebSocket {
  private ws: WebSocket | null = null;
  private url: string;
  private opts: Required<WebSocketOptions>;
  private attempts = 0;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private destroyed = false;

  private onRetryCbs: RetryCallback[] = [];
  private onOpenCbs: EventCallback[] = [];
  private onCloseCbs: EventCallback[] = [];
  private onMsgCbs: MessageCallback[] = [];
  private onErrCbs: ErrorCallback[] = [];

  constructor(url: string, opts?: WebSocketOptions) {
    this.url = url;
    this.opts = { ...DEFAULTS, ...opts };
    this.connect();
  }

  connect(): void {
    if (this.destroyed) return;
    try { this.ws = new WebSocket(this.url); } catch { this.schedule(); return; }

    this.ws.onopen = () => { this.attempts = 0; this.onOpenCbs.forEach(c => c()); };
    this.ws.onclose = () => { this.onCloseCbs.forEach(c => c()); if (!this.destroyed) this.schedule(); };
    this.ws.onerror = (e) => this.onErrCbs.forEach(c => c(e));
    this.ws.onmessage = (e) => this.onMsgCbs.forEach(c => c(e));
  }

  private delay(): number {
    const { baseDelay, maxDelay, multiplier, jitter } = this.opts;
    const exp = baseDelay * Math.pow(multiplier, this.attempts);
    const clamped = Math.min(exp, maxDelay);
    return Math.round(clamped + clamped * jitter * Math.random());
  }

  private schedule(): void {
    if (this.destroyed || this.attempts >= this.opts.maxRetries) return;
    const d = this.delay();
    this.attempts++;
    this.onRetryCbs.forEach(c => c({ attempt: this.attempts, delay: d }));
    this.timer = setTimeout(() => this.connect(), d);
  }

  send(data: string | ArrayBuffer | Blob): void {
    if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(data);
  }

  close(): void {
    this.destroyed = true;
    if (this.timer) { clearTimeout(this.timer); this.timer = null; }
    this.ws?.close();
    this.ws = null;
  }

  get readyState(): number { return this.ws?.readyState ?? WebSocket.CLOSED; }

  onReconnect(cb: RetryCallback): () => void {
    this.onRetryCbs.push(cb);
    return () => { this.onRetryCbs = this.onRetryCbs.filter(c => c !== cb); };
  }

  onOpen(cb: EventCallback): () => void {
    this.onOpenCbs.push(cb);
    return () => { this.onOpenCbs = this.onOpenCbs.filter(c => c !== cb); };
  }

  onClose(cb: EventCallback): () => void {
    this.onCloseCbs.push(cb);
    return () => { this.onCloseCbs = this.onCloseCbs.filter(c => c !== cb); };
  }

  onMessage(cb: MessageCallback): () => void {
    this.onMsgCbs.push(cb);
    return () => { this.onMsgCbs = this.onMsgCbs.filter(c => c !== cb); };
  }

  onError(cb: ErrorCallback): () => void {
    this.onErrCbs.push(cb);
    return () => { this.onErrCbs = this.onErrCbs.filter(c => c !== cb); };
  }
}

export default ReconnectingWebSocket;
