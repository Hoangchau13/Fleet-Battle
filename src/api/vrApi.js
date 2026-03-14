import apiClient from './axios.config';

/**
 * VR API
 * Quản lý kết nối thiết bị VR
 */

// Kết nối thiết bị VR bằng mã PIN
export const linkVrDevice = async (pinCode, playerId) => {
  try {
    const response = await apiClient.post('/vr/link-device', {
      code: pinCode,
      playerId: playerId
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};
