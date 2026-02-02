import apiClient from './axios.config';

/**
 * Game Data API
 * Quản lý dữ liệu game: levels, config
 */

// Lấy danh sách các level
export const getLevels = async () => {
  try {
    const response = await apiClient.get('/game/levels');
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Lấy cấu hình của một level cụ thể
export const getGameConfig = async (levelId) => {
  try {
    const response = await apiClient.get(`/game/config/${levelId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};
