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
