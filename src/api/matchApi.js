import apiClient from './axios.config';

/**
 * Matchmaking API
 */

// Tìm trận: POST /api/match/find
export const findMatch = async (playerId) => {
  const response = await apiClient.post('/match/find', { playerId });
  return response.data;
};

// Hủy tìm trận: DELETE /api/match/cancel?playerId=...
export const cancelMatch = async (playerId) => {
  const response = await apiClient.delete(`/match/cancel?playerId=${playerId}`);
  return response.data;
};

// Xác nhận trận: POST /api/match/{matchId}/confirm?playerId=...
export const confirmMatch = async (matchId, playerId) => {
  const response = await apiClient.post(`/match/${matchId}/confirm?playerId=${playerId}`);
  return response.data;
};

// Xếp tàu: POST /api/match/{matchId}/setup?playerId=...
// payload: [{shipTypeId, x, y, rotation}]
export const setupMatch = async (matchId, playerId, shipPlacements) => {
  const response = await apiClient.post(
    `/match/${matchId}/setup?playerId=${playerId}`,
    shipPlacements
  );
  return response.data;
};

// Lấy trạng thái trận: GET /api/match/{matchId}/state?playerId=...
export const getMatchState = async (matchId, playerId) => {
  const response = await apiClient.get(`/match/${matchId}/state?playerId=${playerId}`);
  return response.data;
};

// Bắn: POST /api/match/{matchId}/fire?playerId=...
export const fireShot = async (matchId, playerId, x, y) => {
  const response = await apiClient.post(
    `/match/${matchId}/fire?playerId=${playerId}`,
    { x, y }
  );
  return response.data;
};

// Đầu hàng: POST /api/match/{matchId}/surrender?playerId=...
export const surrenderMatch = async (matchId, playerId) => {
  const response = await apiClient.post(`/match/${matchId}/surrender?playerId=${playerId}`);
  return response.data;
};

// Báo cáo AFK: POST /api/match/{matchId}/claim-timeout?playerId=...
export const claimTimeout = async (matchId, playerId) => {
  const response = await apiClient.post(`/match/${matchId}/claim-timeout?playerId=${playerId}`);
  return response.data;
};

// Lấy kết quả trận đấu: GET /api/match/{matchId}/result
export const getMatchResult = async (matchId) => {
  const response = await apiClient.get(`/match/${matchId}/result`);
  return response.data;
};
