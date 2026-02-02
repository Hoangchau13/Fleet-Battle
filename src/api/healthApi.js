import apiClient from './axios.config';

/**
 * Health API
 * Kiểm tra tình trạng hoạt động của API
 */

// Kiểm tra health của API
export const checkHealth = async () => {
  try {
    const response = await apiClient.get('/Health');
    return response.data;
  } catch (error) {
    throw error;
  }
};
