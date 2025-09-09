import { BASE_URL } from '../services/api'; // Assuming BASE_URL is exported from api.js

// Define NotificationItem and Events types based on instruccion.txt
/**
 * @typedef {object} NotificationItem
 * @property {string} id
 * @property {string} message
 * @property {string} type
 * @property {string | null} link_url
 * @property {boolean} is_read
 * @property {string} created_at // ISO-8601
 */

/**
 * @typedef {
 *   { event: 'snapshot', payload: NotificationItem[] } |
 *   { event: 'notification.created', payload: NotificationItem } |
 *   { event: 'notification.read', payload: { id: string, is_read: true } } |
 *   { event: 'unread_count.updated', payload: { count: number } } |
 *   { event: 'keepalive', payload: Record<string, never> }
 * } Events
 */

export class NotificationsSocket {
  /** @type {WebSocket | undefined} */
  ws;
  /** @type {number | undefined} */
  pingTimer;
  backoffMs = 1000;
  backoffMax = 30000;

  /**
   * @param {() => Promise<string> | string} getToken
   * @param {(e: Events) => void} onMessage
   */
  constructor(getToken, onMessage) {
    this.getToken = getToken;
    this.onMessage = onMessage;
  }

  /**
   * @param {string} baseUrl
   */
  async connect(baseUrl) {
    const token = await this.getToken();
    const wsProtocol = baseUrl.startsWith('https') ? 'wss' : 'ws';
    // Ensure baseUrl ends with /api/v1 if it's not already there, then append /notifications/ws
    const cleanedBaseUrl = baseUrl.endsWith('/api/v1') ? baseUrl : `${baseUrl}/api/v1`;
    const url = `${cleanedBaseUrl.replace(/^https?/, wsProtocol)}/notifications/ws?token=${encodeURIComponent(token)}`;
    console.debug('[NotificationsSocket] Attempting to connect to WebSocket. URL:', url.replace(/token=[^&]*/, 'token=***MASKED***')); // Mask token for logs
    console.debug('[NotificationsSocket] Token used for connection (first 10 chars):', token ? token.substring(0, 10) + '...' : 'No token');

    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      console.debug('[NotificationsSocket] Connection opened.');
      console.debug(`[NotificationsSocket] Ready state: ${this.ws?.readyState}`);
      this.pingTimer = window.setInterval(() => {
        if (this.ws?.readyState === WebSocket.OPEN) {
          this.ws.send('ping');
          console.debug('[NotificationsSocket] Sent ping.');
        }
      }, 30000);
      this.backoffMs = 1000;
    };

    this.ws.onmessage = (ev) => {
      if (ev.data !== 'pong') {
        console.debug('[NotificationsSocket] Raw message received:', ev.data);
      }
      try {
        /** @type {Events} */
        const msg = JSON.parse(ev.data);
        console.debug('[NotificationsSocket] Parsed message:', msg.event, msg.payload);
        this.onMessage(msg);
      } catch (error) {
        console.error("[NotificationsSocket] Error parsing WebSocket message:", error);
        /* ignore */
      }
    };

    this.ws.onclose = async (ev) => {
      console.warn('[NotificationsSocket] Connection closed.', { code: ev.code, reason: ev.reason, wasClean: ev.wasClean });
      if (this.pingTimer) clearInterval(this.pingTimer);
      // 4401 = token inválido/expirado; refrescar antes de reconectar
      // Para 1006 (cierre anormal) o cualquier otro cierre inesperado, también intentamos refrescar el token
      // ya que el servidor podría cerrar la conexión por token expirado sin enviar 4401.
      if (ev.code === 4401 || ev.code === 1006 || ev.code === 1000) { // Added 1000 for normal closure, just to be safe
        console.log("[NotificationsSocket] WebSocket closed. Attempting to refresh token before reconnecting...");
        await this.getToken(); // Refresh token
      }
      await this.reconnect(baseUrl);
    };

    this.ws.onerror = (error) => {
      console.error("[NotificationsSocket] WebSocket error occurred:", error);
      // Attempt to log more details from the error event
      if (error instanceof ErrorEvent) { // Check if it's an ErrorEvent for more properties
        console.error("[NotificationsSocket] WebSocket error event details:", {
          message: error.message,
          type: error.type,
          error: error.error, // May contain more specific error info
          target: error.target,
        });
      } else if (error instanceof Event) {
        console.error("[NotificationsSocket] WebSocket generic error event details:", {
          type: error.type,
          target: error.target,
        });
      }
      this.ws?.close();
    };
  }

  /**
   * @param {string} baseUrl
   */
  async reconnect(baseUrl) {
    await new Promise((r) => setTimeout(r, this.backoffMs));
    this.backoffMs = Math.min(this.backoffMs * 2, this.backoffMax);
  console.log(`[NotificationsSocket] Attempting reconnect with backoff=${this.backoffMs}ms`);
    this.connect(baseUrl);
  }

  close() {
  console.debug('[NotificationsSocket] Manual close invoked');
    if (this.pingTimer) clearInterval(this.pingTimer);
    this.ws?.close();
    this.ws = undefined;
  }
}
