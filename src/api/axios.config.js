import axios from 'axios';

// Tạo instance axios với cấu hình mặc định
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Thêm token vào header
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Xử lý lỗi chung
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      // Server trả về lỗi
      switch (error.response.status) {
        case 401:
          // Unauthorized - Chỉ redirect nếu đã có token (đã đăng nhập trước đó)
          // Nếu là login fail thì không redirect (để hiển thị error message)
          const token = localStorage.getItem('token');
          const isLoginPage = window.location.pathname === '/login';
          
          if (token && !isLoginPage) {
            // User đã đăng nhập nhưng token hết hạn/invalid
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
          }
          // Nếu đang ở trang login hoặc chưa có token, không redirect
          break;
        case 403:
          console.error('Forbidden - Bạn không có quyền truy cập');
          break;
        case 404:
          console.error('Not Found - Tài nguyên không tồn tại');
          break;
        case 500:
          console.error('Server Error - Lỗi máy chủ');
          break;
        default:
          console.error('Error:', error.response.data);
      }
    } else if (error.request) {
      // Request được gửi nhưng không nhận được response
      console.error('Network Error - Không thể kết nối đến server');
    } else {
      console.error('Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default apiClient;
