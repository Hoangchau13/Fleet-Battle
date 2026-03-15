import apiClient from './axios.config';

/**
 * Player API
 * Quản lý thông tin người chơi
 */

// Tạo player mới
export const createPlayer = async (playerData) => {
  try {
    const response = await apiClient.post('/Player/create', {
      groupId: playerData.groupId,
      displayName: playerData.displayName,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Lấy danh sách player của tôi (GET /player/mine)
export const getMyPlayers = async () => {
  try {
    const response = await apiClient.get('/player/mine');
    return response.data;
  } catch (error) {
    console.error('Error fetching my players:', error);
    throw error;
  }
};

/**
 * NOTE FOR BACKEND: Cần implement các API sau cho UserDetail page
 */

// TODO: GET /player/{id} - Lấy profile người chơi với game statistics
// Response format cần có:
// {
//   playerId: number,
//   userId: number,
//   displayName: string,
//   currentElo: number,      // Elo rating hiện tại
//   currentLevel: number,    // Level hiện tại
//   wins: number,            // Số trận thắng
//   losses: number,          // Số trận thua
//   totalGames: number,      // Tổng số trận
//   winRate: number          // Tỷ lệ thắng (0-1)
// }
export const getPlayerProfile = async (playerId) => {
  try {
    const response = await apiClient.get(`/player/${playerId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching player profile:', error);
    throw error;
  }
};

// TODO: GET /player/{id}/history - Lấy lịch sử đấu (10 trận gần nhất)
// Response format cần có:
// [
//   {
//     matchId: number,
//     opponent: string,       // Tên đối thủ
//     date: string,           // ISO date hoặc format "YYYY-MM-DD at HH:mm"
//     result: 'Win' | 'Loss'  // Kết quả trận đấu
//   }
// ]
export const getPlayerMatchHistory = async (playerId, limit = 10) => {
  try {
    const response = await apiClient.get(`/player/${playerId}/history`, {
      params: { limit }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching player match history:', error);
    throw error;
  }
};
// Lấy profile của Player dựa trên UserId và ServerId (GroupId)
export const getPlayerProfileByUserAndServer = async (userId, serverId) => {
  try {
    const response = await apiClient.get(`/player/user/${userId}/server/${serverId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching player profile by user and server:', error);
    throw error;
  }
};
