import apiClient from './axios.config';

/**
 * World API
 * Manage world, server groups
 */

// Get list of server groups
export const getWorldGroups = async () => {
  try {
    const response = await apiClient.get('/world/groups');
    return response.data;
  } catch (error) {
    if (error.response) {
      console.error('API Error Response:', error.response.data);
    } else {
      console.error('Error fetching world groups:', error.message);
    }
    throw error;
  }
};
