import apiClient from './axios.config';

/**
 * Level API
 * Quản lý Levels trong game (Admin)
 */

// Lấy danh sách tất cả levels
export const getAdminLevels = async () => {
  try {
    const response = await apiClient.get('/game/levels');
    return response.data;
  } catch (error) {
    console.error('Error fetching levels:', error);
    throw error;
  }
};

// Lấy chi tiết một level (config)
export const getLevelById = async (levelId) => {
  try {
    const response = await apiClient.get(`/game/config/${levelId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching level details:', error);
    throw error;
  }
};

// Tạo level mới
export const createLevel = async (levelData) => {
  try {
    const response = await apiClient.post('/game/levels', {
      levelName: levelData.levelName,
      boardSize: parseInt(levelData.boardSize),
      timeLimit: parseInt(levelData.timeLimit)
    });
    return response.data;
  } catch (error) {
    console.error('Error creating level:', error);
    throw error;
  }
};

// Cập nhật level (chỉ boardSize và timeLimit)
export const updateLevel = async (levelId, levelData) => {
  try {
    const response = await apiClient.put(`/game/levels/${levelId}`, {
      boardSize: parseInt(levelData.boardSize),
      timeLimit: parseInt(levelData.timeLimit)
    });
    return response.data;
  } catch (error) {
    console.error('Error updating level:', error);
    throw error;
  }
};

// Xóa level
export const deleteLevel = async (levelId) => {
  try {
    const response = await apiClient.delete(`/game/levels/${levelId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting level:', error);
    throw error;
  }
};

// Cấu hình Ships cho Level
export const configureLevelShips = async (levelId, shipsConfig) => {
  try {
    const response = await apiClient.post(`/game/levels/${levelId}/ships`, shipsConfig);
    return response.data;
  } catch (error) {
    console.error('Error configuring level ships:', error);
    throw error;
  }
};
