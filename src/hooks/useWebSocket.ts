import { useEffect, useRef, useCallback, useState } from 'react';
import { inflate } from 'pako';
import { WebSocketEventType, WebSocketMessage } from '../types/websocket.types';
import { getAccessToken } from '../utils/tokenManager';
import Swal from 'sweetalert2';

// Non-intrusive bottom-right toast for WebSocket notifications
const WsToast = Swal.mixin({
  toast: true,
  position: 'bottom-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
});

const showWsSuccess = (message: string) => WsToast.fire({ icon: 'success', title: message });
const showWsWarning = (message: string) => WsToast.fire({ icon: 'warning', title: message });
const showWsError = (message: string) => WsToast.fire({ icon: 'error', title: message });

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

type EventCallback<T = unknown> = (data: T) => void;

// Custom event type for polling fallback
export const WS_FALLBACK_TO_POLLING = 'FALLBACK_TO_POLLING' as unknown as WebSocketEventType;

interface UseWebSocketReturn {
  status: ConnectionStatus;
  retryCount: number;
  lastConnectedAt: Date | null;
  subscribe: <T = unknown>(eventType: WebSocketEventType, callback: EventCallback<T>) => () => void;
}

const isDev = process.env.NODE_ENV === 'development';

const wsLog = (label: string, ...args: unknown[]) => {
  if (isDev) {
    console.log(`[WS] ${label}`, ...args);
  }
};

const wsWarn = (label: string, ...args: unknown[]) => {
  if (isDev) {
    console.warn(`[WS] ${label}`, ...args);
  }
};

const WS_URL = process.env.REACT_APP_WS_URL
  || (window.location.protocol === 'https:'
    ? `wss://${window.location.hostname}:5001/ws`
    : 'ws://localhost:5001/ws');

const MAX_RETRIES = 5;
const BASE_DELAY_MS = 1000;

export function useWebSocket(): UseWebSocketReturn {
  const wsRef = useRef<WebSocket | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [retryCount, setRetryCount] = useState(0);
  const [lastConnectedAt, setLastConnectedAt] = useState<Date | null>(null);
  const retriesRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const subscribersRef = useRef<Map<WebSocketEventType, Set<EventCallback<any>>>>(new Map());
  const mountedRef = useRef(true);
  const hasConnectedOnceRef = useRef(false);

  const clearReconnectTimer = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    if (!mountedRef.current) return;

    const token = getAccessToken();
    if (!token) {
      setStatus('error');
      return;
    }

    // Close existing connection if any
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.close();
      wsRef.current = null;
    }

    setStatus('connecting');

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      if (!mountedRef.current) return;
      wsLog('Connected', { url: WS_URL, timestamp: new Date().toISOString() });
      // Authenticate by sending JWT token
      const authMessage: WebSocketMessage = {
        event: WebSocketEventType.WS_AUTH,
        data: { token },
        timestamp: new Date().toISOString(),
      };
      ws.send(JSON.stringify(authMessage));
      wsLog('Auth sent', { timestamp: new Date().toISOString() });
    };

    ws.onmessage = async (event: MessageEvent) => {
      if (!mountedRef.current) return;

      try {
        let jsonString: string;

        // Check if the message is binary (compressed)
        if (event.data instanceof Blob) {
          const arrayBuffer = await event.data.arrayBuffer();
          const bytes = new Uint8Array(arrayBuffer);
          // First byte 0x01 indicates compressed payload
          if (bytes[0] === 0x01) {
            const compressedData = bytes.slice(1);
            const decompressed = inflate(compressedData, { to: 'string' });
            if (isDev) {
              const ratio = ((1 - compressedData.length / decompressed.length) * 100).toFixed(1);
              wsLog('Decompressed:', `${compressedData.length}B → ${decompressed.length}B (${ratio}% saved)`);
            }
            jsonString = decompressed;
          } else {
            // Binary but not compressed - decode as UTF-8
            jsonString = new TextDecoder().decode(bytes);
          }
        } else if (event.data instanceof ArrayBuffer) {
          const bytes = new Uint8Array(event.data);
          if (bytes[0] === 0x01) {
            const compressedData = bytes.slice(1);
            const decompressed = inflate(compressedData, { to: 'string' });
            if (isDev) {
              const ratio = ((1 - compressedData.length / decompressed.length) * 100).toFixed(1);
              wsLog('Decompressed:', `${compressedData.length}B → ${decompressed.length}B (${ratio}% saved)`);
            }
            jsonString = decompressed;
          } else {
            jsonString = new TextDecoder().decode(bytes);
          }
        } else {
          // Plain text message (uncompressed)
          jsonString = event.data as string;
        }

        const message: WebSocketMessage = JSON.parse(jsonString);

        if (message.event === WebSocketEventType.WS_AUTH_SUCCESS) {
          wsLog('Auth success', { timestamp: new Date().toISOString() });
          // Show toast only on reconnection (not initial connection)
          if (hasConnectedOnceRef.current) {
            showWsSuccess('Connection restored. Live updates active.');
          }
          hasConnectedOnceRef.current = true;
          setStatus('connected');
          setLastConnectedAt(new Date());
          retriesRef.current = 0;
          setRetryCount(0);
          return;
        }

        if (message.event === WebSocketEventType.WS_AUTH_FAILED) {
          wsWarn('Auth failed', { timestamp: new Date().toISOString(), data: message.data });
          setStatus('error');
          ws.close();
          return;
        }

        // Log event in development
        wsLog(`${message.event}:`, message.data);

        // Dispatch to subscribers
        const callbacks = subscribersRef.current.get(message.event);
        if (callbacks) {
          callbacks.forEach((cb) => cb(message.data));
        }
      } catch {
        // Ignore malformed messages
      }
    };

    ws.onclose = () => {
      if (!mountedRef.current) return;
      wsRef.current = null;
      wsLog('Disconnected', { timestamp: new Date().toISOString() });

      // Show disconnection toast only if we were previously connected
      if (hasConnectedOnceRef.current) {
        showWsWarning('Connection lost. Attempting to reconnect...');
      }

      setStatus('disconnected');
      scheduleReconnect();
    };

    ws.onerror = () => {
      if (!mountedRef.current) return;
      // onclose will fire after onerror, so reconnect is handled there
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scheduleReconnect = useCallback(() => {
    if (!mountedRef.current) return;
    if (retriesRef.current >= MAX_RETRIES) {
      setStatus('error');
      if (hasConnectedOnceRef.current) {
        showWsError('Connection failed. Using manual refresh.');
      }
      // Emit fallback-to-polling event so consumers can re-enable polling
      wsLog('Max retries exceeded - emitting fallback-to-polling');
      const fallbackCallbacks = subscribersRef.current.get(WS_FALLBACK_TO_POLLING);
      if (fallbackCallbacks) {
        fallbackCallbacks.forEach((cb) => cb({}));
      }
      return;
    }

    clearReconnectTimer();

    const delay = BASE_DELAY_MS * Math.pow(2, retriesRef.current);
    retriesRef.current += 1;
    setRetryCount(retriesRef.current);

    // Show warning toast after 3 failed reconnection attempts
    if (retriesRef.current === 3 && hasConnectedOnceRef.current) {
      showWsWarning('Still trying to reconnect... (' + retriesRef.current + '/' + MAX_RETRIES + ')');
    }

    reconnectTimerRef.current = setTimeout(() => {
      if (mountedRef.current) {
        connect();
      }
    }, delay);
  }, [clearReconnectTimer, connect]);

  // Connect on mount, cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    connect();

    return () => {
      mountedRef.current = false;
      clearReconnectTimer();
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect, clearReconnectTimer]);

  const subscribe = useCallback(<T = unknown>(
    eventType: WebSocketEventType,
    callback: EventCallback<T>,
  ): (() => void) => {
    if (!subscribersRef.current.has(eventType)) {
      subscribersRef.current.set(eventType, new Set());
    }
    const callbacks = subscribersRef.current.get(eventType)!;
    callbacks.add(callback as EventCallback<any>);

    // Return unsubscribe function
    return () => {
      callbacks.delete(callback as EventCallback<any>);
      if (callbacks.size === 0) {
        subscribersRef.current.delete(eventType);
      }
    };
  }, []);

  return { status, retryCount, lastConnectedAt, subscribe };
}
