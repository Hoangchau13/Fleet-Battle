import apiClient from './axios.config';

/**
 * User API
 * Quản lý thông tin người dùng
 */

// Lấy danh sách tất cả users
export const getUsers = async () => {
  try {
    const response = await apiClient.get('/admin/users');
    return response.data;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

// Lấy chi tiết một user
export const getUserById = async (userId) => {
  try {
    const response = await apiClient.get(`/admin/users/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user details:', error);
    throw error;
  }
};

// Tạo user mới (nếu cần)
export const createUser = async (userData) => {
  try {
    const response = await apiClient.post('/admin/users', userData);
    return response.data;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

// Cập nhật user
export const updateUser = async (userId, userData) => {
  try {
    const response = await apiClient.put(`/admin/users/${userId}`, userData);
    return response.data;
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

// Cập nhật role của user
export const updateUserRole = async (userId, role) => {
  try {
    const response = await apiClient.put(`/admin/users/${userId}/role`, { role });
    return response.data;
  } catch (error) {
    console.error('Error updating user role:', error);
    throw error;
  }
};

// Cập nhật status của user (Khóa/Mở khóa)
export const updateUserStatus = async (userId, isActive) => {
  try {
    const response = await apiClient.put(`/admin/users/${userId}/status`, { isActive });
    return response.data;
  } catch (error) {
    console.error('Error updating user status:', error);
    throw error;
  }
};

// Xóa user
export const deleteUser = async (userId) => {
  try {
    const response = await apiClient.delete(`/admin/users/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};

// Lấy danh sách roles
export const getRoles = async () => {
  try {
    const response = await apiClient.get('/admin/roles');
    return response.data;
  } catch (error) {
    console.error('Error fetching roles:', error);
    throw error;
  }
};
