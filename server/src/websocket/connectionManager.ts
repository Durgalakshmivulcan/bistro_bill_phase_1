import WebSocket from 'ws';
import pako from 'pako';
import {
  ConnectionMetadata,
  WebSocketEventType,
  WebSocketMessage,
} from '../types/websocket.types';

const COMPRESSION_THRESHOLD = 1024; // 1KB
const isDev = process.env.NODE_ENV !== 'production';
const RATE_LIMIT_MAX = 100; // max events per minute per branch
const RATE_LIMIT_BATCH_DELAY_MS = 1000; // batch excess events after 1 second

// Critical events that should never be dropped by rate limiting
const CRITICAL_EVENTS: Set<WebSocketEventType> = new Set([
  WebSocketEventType.ORDER_CREATED,
  WebSocketEventType.PAYMENT_RECEIVED,
]);

interface ManagedConnection {
  ws: WebSocket;
  metadata: ConnectionMetadata;
}

interface WebSocketMetrics {
  totalMessagesSentToday: number;
  totalMessagesReceivedToday: number;
  messagesSentLastMinute: number;
  messagesReceivedLastMinute: number;
  errorCount: number;
  dayStartedAt: string;
  sentTimestamps: number[];
  receivedTimestamps: number[];
}

/**
 * Manages WebSocket connections with tenant-aware broadcasting.
 * Connections are keyed by `{businessOwnerId}:{branchId}:{userId}`.
 */
class ConnectionManager {
  private connections: Map<string, ManagedConnection> = new Map();

  // Rate limiting: track broadcast timestamps per branch
  private branchBroadcastTimestamps: Map<string, number[]> = new Map();
  // Queued events waiting to be batch-sent after rate limit delay
  private queuedEvents: Map<string, Array<{ event: WebSocketEventType; payload: string; compressed: boolean }>> = new Map();
  private batchTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();
  // Track rate limit hits for metrics
  private rateLimitHits: Map<string, number> = new Map();

  private metrics: WebSocketMetrics = {
    totalMessagesSentToday: 0,
    totalMessagesReceivedToday: 0,
    messagesSentLastMinute: 0,
    messagesReceivedLastMinute: 0,
    errorCount: 0,
    dayStartedAt: new Date().toISOString().slice(0, 10),
    sentTimestamps: [],
    receivedTimestamps: [],
  };

  private resetMetricsIfNewDay(): void {
    const today = new Date().toISOString().slice(0, 10);
    if (this.metrics.dayStartedAt !== today) {
      this.metrics.totalMessagesSentToday = 0;
      this.metrics.totalMessagesReceivedToday = 0;
      this.metrics.errorCount = 0;
      this.metrics.sentTimestamps = [];
      this.metrics.receivedTimestamps = [];
      this.metrics.dayStartedAt = today;
    }
  }

  private pruneTimestamps(timestamps: number[]): number[] {
    const oneMinuteAgo = Date.now() - 60000;
    return timestamps.filter((t) => t > oneMinuteAgo);
  }

  trackMessageSent(): void {
    this.resetMetricsIfNewDay();
    this.metrics.totalMessagesSentToday++;
    this.metrics.sentTimestamps.push(Date.now());
    this.metrics.sentTimestamps = this.pruneTimestamps(this.metrics.sentTimestamps);
    this.metrics.messagesSentLastMinute = this.metrics.sentTimestamps.length;
  }

  trackMessageReceived(): void {
    this.resetMetricsIfNewDay();
    this.metrics.totalMessagesReceivedToday++;
    this.metrics.receivedTimestamps.push(Date.now());
    this.metrics.receivedTimestamps = this.pruneTimestamps(this.metrics.receivedTimestamps);
    this.metrics.messagesReceivedLastMinute = this.metrics.receivedTimestamps.length;
  }

  trackError(): void {
    this.resetMetricsIfNewDay();
    this.metrics.errorCount++;
  }

  /**
   * Build connection key from metadata
   */
  private buildKey(metadata: ConnectionMetadata): string {
    const boId = metadata.businessOwnerId || 'global';
    const brId = metadata.branchId || 'all';
    return `${boId}:${brId}:${metadata.userId}`;
  }

  /**
   * Add a new WebSocket connection
   */
  addConnection(ws: WebSocket, metadata: ConnectionMetadata): string {
    const key = this.buildKey(metadata);
    // Close existing connection for same user if any
    const existing = this.connections.get(key);
    if (existing && existing.ws.readyState === WebSocket.OPEN) {
      existing.ws.close(1000, 'New connection established');
    }
    this.connections.set(key, { ws, metadata });
    console.log(`[WS] Connection added: ${key} (total: ${this.connections.size})`);
    if (this.connections.size > 1000) {
      console.warn(`[WS] WARNING: Connection count exceeds 1000 (current: ${this.connections.size})`);
    }
    return key;
  }

  /**
   * Remove a WebSocket connection by key
   */
  removeConnection(connectionId: string): void {
    this.connections.delete(connectionId);
    console.log(`[WS] Connection removed: ${connectionId} (total: ${this.connections.size})`);
  }

  /**
   * Get all connections for a specific branch
   */
  getConnectionsByBranch(businessOwnerId: string, branchId: string): ManagedConnection[] {
    const results: ManagedConnection[] = [];
    for (const [, conn] of this.connections) {
      if (
        conn.metadata.businessOwnerId === businessOwnerId &&
        (conn.metadata.branchId === branchId || conn.metadata.branchId === undefined)
      ) {
        results.push(conn);
      }
    }
    return results;
  }

  /**
   * Compress a JSON payload if it exceeds the compression threshold (1KB).
   * Returns the data to send and whether compression was applied.
   */
  private compressPayload(jsonPayload: string): { data: string | Buffer; compressed: boolean } {
    const payloadBytes = Buffer.byteLength(jsonPayload, 'utf-8');

    if (payloadBytes <= COMPRESSION_THRESHOLD) {
      return { data: jsonPayload, compressed: false };
    }

    const compressed = pako.deflate(jsonPayload);
    const compressedBuffer = Buffer.from(compressed);

    if (isDev) {
      const ratio = ((1 - compressedBuffer.length / payloadBytes) * 100).toFixed(1);
      console.log(
        `[WS] Compression: ${payloadBytes}B → ${compressedBuffer.length}B (${ratio}% reduction)`
      );
    }

    // Prepend a 1-byte compression flag header: 0x01 = compressed
    const header = Buffer.from([0x01]);
    return { data: Buffer.concat([header, compressedBuffer]), compressed: true };
  }

  /**
   * Prune branch broadcast timestamps older than 1 minute
   */
  private pruneBranchTimestamps(branchKey: string): number[] {
    const oneMinuteAgo = Date.now() - 60000;
    const timestamps = this.branchBroadcastTimestamps.get(branchKey) || [];
    const pruned = timestamps.filter((t) => t > oneMinuteAgo);
    this.branchBroadcastTimestamps.set(branchKey, pruned);
    return pruned;
  }

  /**
   * Check if a branch has exceeded its rate limit
   */
  private isRateLimited(branchKey: string): boolean {
    const timestamps = this.pruneBranchTimestamps(branchKey);
    return timestamps.length >= RATE_LIMIT_MAX;
  }

  /**
   * Record a broadcast event for rate limiting
   */
  private recordBroadcast(branchKey: string): void {
    const timestamps = this.branchBroadcastTimestamps.get(branchKey) || [];
    timestamps.push(Date.now());
    this.branchBroadcastTimestamps.set(branchKey, timestamps);
  }

  /**
   * Send a prepared payload to all connections for a branch
   */
  private sendToBranch(
    businessOwnerId: string,
    branchId: string,
    event: WebSocketEventType,
    payload: string | Buffer,
    compressed: boolean
  ): number {
    const connections = this.getConnectionsByBranch(businessOwnerId, branchId);
    let sentCount = 0;

    for (const conn of connections) {
      if (conn.ws.readyState === WebSocket.OPEN) {
        try {
          conn.ws.send(payload);
          sentCount++;
          this.trackMessageSent();
        } catch (error) {
          console.error(`[WS] Failed to send to ${this.buildKey(conn.metadata)}:`, error);
          this.trackError();
        }
      }
    }

    console.log(
      `[WS] Broadcast ${event} to ${sentCount}/${connections.length} connections (branch: ${businessOwnerId}:${branchId})${compressed ? ' [compressed]' : ''}`
    );
    return sentCount;
  }

  /**
   * Flush queued events for a branch (batch send)
   */
  private flushQueue(branchKey: string, businessOwnerId: string, branchId: string): void {
    const queue = this.queuedEvents.get(branchKey);
    if (!queue || queue.length === 0) return;

    // Send all queued events
    for (const item of queue) {
      this.recordBroadcast(branchKey);
      this.sendToBranch(businessOwnerId, branchId, item.event, item.payload, item.compressed);
    }

    console.log(`[WS] Flushed ${queue.length} queued events for branch ${branchKey}`);
    this.queuedEvents.delete(branchKey);
    this.batchTimers.delete(branchKey);
  }

  /**
   * Broadcast an event to all connections for a specific branch.
   * Applies rate limiting: max 100 events per minute per branch.
   * Critical events (ORDER_CREATED, PAYMENT_RECEIVED) are never dropped.
   * Excess events are queued and batch-sent after 1 second.
   */
  broadcastToBranch<T>(
    businessOwnerId: string,
    branchId: string,
    event: WebSocketEventType,
    data: T
  ): number {
    const branchKey = `${businessOwnerId}:${branchId}`;
    const message: WebSocketMessage<T> = {
      event,
      data,
      timestamp: new Date().toISOString(),
    };
    const jsonPayload = JSON.stringify(message);
    const { data: payload, compressed } = this.compressPayload(jsonPayload);
    const isCritical = CRITICAL_EVENTS.has(event);

    // Check rate limit
    if (this.isRateLimited(branchKey) && !isCritical) {
      // Track rate limit hit
      this.rateLimitHits.set(branchKey, (this.rateLimitHits.get(branchKey) || 0) + 1);
      console.warn(`[WS] Rate limit hit for branch ${branchKey} - queuing ${event}`);

      // Queue the event
      const queue = this.queuedEvents.get(branchKey) || [];
      queue.push({
        event,
        payload: typeof payload === 'string' ? payload : payload.toString('base64'),
        compressed,
      });
      this.queuedEvents.set(branchKey, queue);

      // Schedule batch flush if not already scheduled
      if (!this.batchTimers.has(branchKey)) {
        const timer = setTimeout(() => {
          this.flushQueue(branchKey, businessOwnerId, branchId);
        }, RATE_LIMIT_BATCH_DELAY_MS);
        this.batchTimers.set(branchKey, timer);
      }

      return 0;
    }

    // Record this broadcast for rate tracking
    this.recordBroadcast(branchKey);

    return this.sendToBranch(businessOwnerId, branchId, event, payload, compressed);
  }

  /**
   * Get active connection count
   */
  getConnectionCount(): number {
    return this.connections.size;
  }

  /**
   * Get connection count per branch for monitoring
   */
  getConnectionStats(): Record<string, number> {
    const stats: Record<string, number> = {};
    for (const [, conn] of this.connections) {
      const branchKey = `${conn.metadata.businessOwnerId || 'global'}:${conn.metadata.branchId || 'all'}`;
      stats[branchKey] = (stats[branchKey] || 0) + 1;
    }
    return stats;
  }

  /**
   * Get full metrics for the admin stats endpoint
   */
  getMetrics() {
    this.resetMetricsIfNewDay();
    this.metrics.sentTimestamps = this.pruneTimestamps(this.metrics.sentTimestamps);
    this.metrics.receivedTimestamps = this.pruneTimestamps(this.metrics.receivedTimestamps);
    this.metrics.messagesSentLastMinute = this.metrics.sentTimestamps.length;
    this.metrics.messagesReceivedLastMinute = this.metrics.receivedTimestamps.length;

    // Build rate limit status per branch
    const rateLimitStatus: Record<string, { eventsLastMinute: number; limit: number; isLimited: boolean; totalHits: number; queuedEvents: number }> = {};
    for (const [branchKey] of this.branchBroadcastTimestamps) {
      const timestamps = this.pruneBranchTimestamps(branchKey);
      rateLimitStatus[branchKey] = {
        eventsLastMinute: timestamps.length,
        limit: RATE_LIMIT_MAX,
        isLimited: timestamps.length >= RATE_LIMIT_MAX,
        totalHits: this.rateLimitHits.get(branchKey) || 0,
        queuedEvents: (this.queuedEvents.get(branchKey) || []).length,
      };
    }

    return {
      activeConnections: this.connections.size,
      connectionsPerBranch: this.getConnectionStats(),
      totalMessagesSentToday: this.metrics.totalMessagesSentToday,
      totalMessagesReceivedToday: this.metrics.totalMessagesReceivedToday,
      messagesSentLastMinute: this.metrics.messagesSentLastMinute,
      messagesReceivedLastMinute: this.metrics.messagesReceivedLastMinute,
      errorCount: this.metrics.errorCount,
      rateLimitStatus,
    };
  }

  /**
   * Clean up stale connections (not in OPEN state)
   */
  cleanupStaleConnections(): number {
    let removed = 0;
    for (const [key, conn] of this.connections) {
      if (conn.ws.readyState !== WebSocket.OPEN) {
        this.connections.delete(key);
        removed++;
      }
    }
    if (removed > 0) {
      console.log(`[WS] Cleaned up ${removed} stale connections (remaining: ${this.connections.size})`);
    }
    return removed;
  }
}

// Singleton instance
export const connectionManager = new ConnectionManager();
