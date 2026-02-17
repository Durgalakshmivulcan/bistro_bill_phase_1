import { Server as HttpServer } from 'http';
import WebSocket, { Server as WebSocketServer } from 'ws';
import { verifyToken } from '../utils/jwt';
import { connectionManager } from './connectionManager';
import {
  ConnectionMetadata,
  WebSocketEventType,
  WebSocketMessage,
  WsAuthPayload,
  WsAuthSuccessPayload,
  WsAuthFailedPayload,
} from '../types/websocket.types';

const HEARTBEAT_INTERVAL = 30000; // 30 seconds

interface AuthenticatedWebSocket extends WebSocket {
  isAlive: boolean;
  connectionId?: string;
  metadata?: ConnectionMetadata;
}

/**
 * Send a typed WebSocket message
 */
function sendMessage<T>(ws: WebSocket, event: WebSocketEventType, data: T): void {
  if (ws.readyState !== WebSocket.OPEN) return;
  const message: WebSocketMessage<T> = {
    event,
    data,
    timestamp: new Date().toISOString(),
  };
  ws.send(JSON.stringify(message));
}

/**
 * Handle authentication message from client
 */
function handleAuth(ws: AuthenticatedWebSocket, payload: WsAuthPayload): void {
  const { token } = payload;
  const result = verifyToken(token);

  if (!result.valid) {
    const failData: WsAuthFailedPayload = { reason: result.message };
    sendMessage(ws, WebSocketEventType.WS_AUTH_FAILED, failData);
    ws.close(4001, 'Authentication failed');
    console.log(`[WS] Auth failed: ${result.error}`);
    return;
  }

  const { payload: decoded } = result;
  const metadata: ConnectionMetadata = {
    userId: decoded.userId,
    userType: decoded.userType,
    businessOwnerId: decoded.businessOwnerId,
    branchId: decoded.branchId,
    email: decoded.email,
    connectedAt: new Date().toISOString(),
  };

  ws.metadata = metadata;
  ws.connectionId = connectionManager.addConnection(ws, metadata);

  const successData: WsAuthSuccessPayload = {
    userId: decoded.userId,
    userType: decoded.userType,
    businessOwnerId: decoded.businessOwnerId,
    branchId: decoded.branchId,
  };
  sendMessage(ws, WebSocketEventType.WS_AUTH_SUCCESS, successData);
  console.log(`[WS] Auth success: ${decoded.email} (${decoded.userType})`);
}

/**
 * Initialize WebSocket server and attach to HTTP server
 */
export function initializeWebSocket(httpServer: HttpServer): WebSocketServer {
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  console.log('[WS] WebSocket server initialized on /ws');

  // Heartbeat interval to detect dead connections
  const heartbeatTimer = setInterval(() => {
    wss.clients.forEach((client) => {
      const ws = client as AuthenticatedWebSocket;
      if (!ws.isAlive) {
        if (ws.connectionId) {
          connectionManager.removeConnection(ws.connectionId);
        }
        ws.terminate();
        return;
      }
      ws.isAlive = false;
      ws.ping();
    });
  }, HEARTBEAT_INTERVAL);

  // Periodic cleanup of stale connections
  const cleanupTimer = setInterval(() => {
    connectionManager.cleanupStaleConnections();
  }, HEARTBEAT_INTERVAL * 2);

  wss.on('close', () => {
    clearInterval(heartbeatTimer);
    clearInterval(cleanupTimer);
    console.log('[WS] WebSocket server closed');
  });

  wss.on('connection', (ws: AuthenticatedWebSocket) => {
    ws.isAlive = true;
    console.log('[WS] New connection (awaiting authentication)');

    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('message', (raw: WebSocket.RawData) => {
      try {
        connectionManager.trackMessageReceived();
        const message = JSON.parse(raw.toString()) as WebSocketMessage;

        if (message.event === WebSocketEventType.WS_AUTH) {
          handleAuth(ws, message.data as WsAuthPayload);
          return;
        }

        // Reject messages from unauthenticated connections
        if (!ws.connectionId) {
          const failData: WsAuthFailedPayload = { reason: 'Not authenticated' };
          sendMessage(ws, WebSocketEventType.WS_AUTH_FAILED, failData);
          return;
        }
      } catch {
        console.error('[WS] Failed to parse message');
      }
    });

    ws.on('close', (code: number, reason: Buffer) => {
      if (ws.connectionId) {
        connectionManager.removeConnection(ws.connectionId);
        console.log(
          `[WS] Disconnected: ${ws.metadata?.email || 'unknown'} (code: ${code}, reason: ${reason.toString() || 'none'})`
        );
      }
    });

    ws.on('error', (error: Error) => {
      console.error(`[WS] Error for ${ws.metadata?.email || 'unknown'}:`, error.message);
      connectionManager.trackError();
      if (ws.connectionId) {
        connectionManager.removeConnection(ws.connectionId);
      }
    });
  });

  return wss;
}
