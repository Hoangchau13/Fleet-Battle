import apiClient from './axios.config';

/**
 * Auth API
 * Quản lý đăng ký, đăng nhập người dùng
 */

// Đăng ký người dùng mới
export const register = async (registerData) => {
  try {
    const response = await apiClient.post('/auth/register', {
      username: registerData.username,
      password: registerData.password,
      email: registerData.email,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Đăng nhập
export const login = async (loginData) => {
  try {
    const response = await apiClient.post('/auth/login', {
      username: loginData.username,
      password: loginData.password,
    });
    
    console.log('Full login response:', response);
    console.log('Response data:', response.data);
    
    // Lưu token vào localStorage nếu đăng nhập thành công
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      
      // Backend trả về user info trực tiếp trong response.data
      // Bao gồm: userId, username, role, token
      const userData = {
        userId: response.data.userId,
        username: response.data.username,
        role: response.data.role,
        email: response.data.email,
        // Thêm các field khác nếu có
        currentElo: response.data.currentElo,
        wins: response.data.wins,
        totalGames: response.data.totalGames,
      };
      
      console.log('User data to save:', userData);
      localStorage.setItem('user', JSON.stringify(userData));
    }
    
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Đăng xuất
export const logout = () => {
  localStorage.removeItem('token');
  window.location.href = '/login';
};

// Kiểm tra xem user đã đăng nhập chưa
export const isAuthenticated = () => {
  return !!localStorage.getItem('token');
};

// Lấy token hiện tại
export const getToken = () => {
  return localStorage.getItem('token');
};
