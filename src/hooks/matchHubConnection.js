/**
 * matchHubConnection.js
 *
 * Singleton SignalR connection cho /hubs/match.
 * Dùng chung DUY NHẤT 1 instance xuyên suốt toàn bộ luồng, 
 * KHÔNG tạo lại object mới nếu bị disconnect để tránh mất event handlers 
 * đã đăng ký từ trước.
 */
import * as signalR from '@microsoft/signalr';

const BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') ?? '';
export const HUB_URL = `${BASE_URL}/hubs/match`;

let _connection = null;
let _registeredId = null; // lưu lại playerId đã register

/**
 * Lấy (hoặc khởi tạo 1 lần duy nhất) connection SignalR tới /hubs/match.
 */
export function getMatchHubConnection() {
  if (!_connection) {
    const token = localStorage.getItem('token');
    _connection = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL, {
        accessTokenFactory: () => localStorage.getItem('token') || token,
        skipNegotiation: false,
        transport:
          signalR.HttpTransportType.WebSockets |
          signalR.HttpTransportType.LongPolling,
      })
      .withAutomaticReconnect([1000, 2000, 5000, 10000])
      .configureLogging(signalR.LogLevel.Warning)
      .build();
    console.log('[MatchHub] Created NEW SignalR instance');
  }

  return _connection;
}

/**
 * Kết nối (nếu đang ngắt) và invoke RegisterPlayer(playerId).
 * Luôn gọi hàm này ở TỪNG trang cần dùng SignalR (trước khi nhận/gửi data quan trọng).
 */
/**
 * Chờ đợi cho đến khi connection ở trạng thái 'Connected'.
 * Tránh lỗi "Cannot send data if the connection is not in the 'Connected' State".
 */
async function waitForConnected(conn, timeoutMs = 10000) {
  const start = Date.now();
  while (conn.state !== signalR.HubConnectionState.Connected) {
    if (Date.now() - start > timeoutMs) {
      throw new Error('[MatchHub] Timeout waiting for SignalR to connect.');
    }
    if (conn.state === signalR.HubConnectionState.Disconnected ||
        conn.state === signalR.HubConnectionState.Disconnecting) {
      throw new Error(`[MatchHub] Connection is ${conn.state}, cannot wait.`);
    }
    await new Promise(res => setTimeout(res, 100));
  }
}

export async function ensureConnectedAndRegistered(playerId) {
  const conn = getMatchHubConnection();

  if (conn.state === signalR.HubConnectionState.Disconnected) {
    console.log('[MatchHub] SignalR is disconnected. Starting...');
    await conn.start();
    _registeredId = null; // Cần đăng ký lại nếu mất kết nối
  }

  // Đợi kết nối hoàn tất (xử lý trường hợp đang 'Connecting')
  await waitForConnected(conn);

  if (_registeredId !== playerId) {
    await conn.invoke('RegisterPlayer', playerId, false);
    _registeredId = playerId;
    console.log('[MatchHub] RegisterPlayer invoked for:', playerId);
  }

  return conn;
}

/**
 * Ngắt kết nối (chỉ gọi khi game over hoặc logout).
 */
export async function disconnectMatchHub() {
  if (_connection && _connection.state !== signalR.HubConnectionState.Disconnected) {
    await _connection.stop();
    console.log('[MatchHub] Connection stopped');
  }
  _registeredId = null;
  // Giữ nguyên instance _connection, chỉ stop() thôi.
}
