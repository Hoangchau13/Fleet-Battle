import apiClient from './axios.config';

/**
 * Ship Type API
 * Quản lý Ship Types (Loại Tàu)
 */

// Lấy danh sách tất cả ship types
export const getShipTypes = async () => {
  try {
    const response = await apiClient.get('/game/shiptypes');
    return response.data;
  } catch (error) {
    console.error('Error fetching ship types:', error);
    throw error;
  }
};

// Lấy chi tiết một ship type
export const getShipTypeById = async (shipTypeId) => {
  try {
    const response = await apiClient.get(`/game/shiptypes/${shipTypeId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching ship type details:', error);
    throw error;
  }
};

// Tạo ship type mới
export const createShipType = async (shipTypeData) => {
  try {
    const response = await apiClient.post('/game/shiptypes', {
      shipName: shipTypeData.shipName,
      size: parseInt(shipTypeData.size),
      modelCode: shipTypeData.modelCode
    });
    return response.data;
  } catch (error) {
    console.error('Error creating ship type:', error);
    throw error;
  }
};

// Cập nhật ship type
export const updateShipType = async (shipTypeId, shipTypeData) => {
  try {
    const response = await apiClient.put(`/game/shiptypes/${shipTypeId}`, {
      shipName: shipTypeData.shipName,
      size: parseInt(shipTypeData.size),
      modelCode: shipTypeData.modelCode
    });
    return response.data;
  } catch (error) {
    console.error('Error updating ship type:', error);
    throw error;
  }
};

// Xóa ship type
export const deleteShipType = async (shipTypeId) => {
  try {
    const response = await apiClient.delete(`/game/shiptypes/${shipTypeId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting ship type:', error);
    throw error;
  }
};
