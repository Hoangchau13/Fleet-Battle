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
export async function ensureConnectedAndRegistered(playerId) {
  const conn = getMatchHubConnection();

  if (conn.state === signalR.HubConnectionState.Disconnected) {
    console.log('[MatchHub] SignalR is disconnected. Starting...');
    await conn.start();
    _registeredId = null; // Cần đăng ký lại nếu mất kết nối
  }

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
