import apiClient from './axios.config';

/**
 * Dashboard API
 * API endpoints for dashboard statistics and overview
 */

/**
 * Get admin dashboard overview
 * @returns {Promise} Dashboard statistics
 */
export const getAdminOverview = async () => {
  try {
    const response = await apiClient.get('/Dashboard/admin-overview');
    return response.data;
  } catch (error) {
    console.error('Error fetching admin overview:', error);
    throw error;
  }
};
