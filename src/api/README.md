# API Configuration

Dự án đã được cấu hình để kết nối với Battleship API.

## 📁 Cấu trúc API Folder

```
src/api/
├── axios.config.js    # Cấu hình axios instance và interceptors
├── authApi.js         # API endpoints cho xác thực (register, login)
├── gameApi.js         # API endpoints cho game data (levels, config)
├── playerApi.js       # API endpoints cho player
├── healthApi.js       # API endpoints để kiểm tra health
└── index.js           # Export tất cả API functions
```

## 🔧 Cấu hình

File `.env` chứa các biến môi trường:
- `VITE_API_BASE_URL`: Base URL của API
- `VITE_SWAGGER_URL`: Link Swagger documentation

## 📖 Cách sử dụng

### 1. Import API functions

```javascript
import { login, register, logout } from '@/api';
// hoặc
import { getLevels, getGameConfig } from '@/api/gameApi';
```

### 2. Sử dụng Auth API

```javascript
// Đăng ký
const handleRegister = async () => {
  try {
    const result = await register({
      username: 'user123',
      password: 'pass123',
      email: 'user@example.com'
    });
    console.log('Đăng ký thành công:', result);
  } catch (error) {
    console.error('Đăng ký thất bại:', error);
  }
};

// Đăng nhập
const handleLogin = async () => {
  try {
    const result = await login({
      username: 'user123',
      password: 'pass123'
    });
    console.log('Đăng nhập thành công:', result);
    // Token tự động được lưu vào localStorage
  } catch (error) {
    console.error('Đăng nhập thất bại:', error);
  }
};

// Đăng xuất
const handleLogout = () => {
  logout(); // Xóa token và redirect đến trang login
};

// Kiểm tra đã đăng nhập chưa
const checkAuth = () => {
  if (isAuthenticated()) {
    console.log('User đã đăng nhập');
  }
};
```

### 3. Sử dụng Game API

```javascript
import { getLevels, getGameConfig } from '@/api';

// Lấy danh sách levels
const fetchLevels = async () => {
  try {
    const levels = await getLevels();
    console.log('Levels:', levels);
  } catch (error) {
    console.error('Error:', error);
  }
};

// Lấy config của level
const fetchGameConfig = async (levelId) => {
  try {
    const config = await getGameConfig(levelId);
    console.log('Config:', config);
  } catch (error) {
    console.error('Error:', error);
  }
};
```

### 4. Sử dụng Player API

```javascript
import { createPlayer } from '@/api';

const handleCreatePlayer = async () => {
  try {
    const player = await createPlayer({
      groupId: 1,
      displayName: 'Captain Jack'
    });
    console.log('Player created:', player);
  } catch (error) {
    console.error('Error:', error);
  }
};
```

### 5. Kiểm tra Health API

```javascript
import { checkHealth } from '@/api';

const checkApiHealth = async () => {
  try {
    const health = await checkHealth();
    console.log('API is healthy:', health);
  } catch (error) {
    console.error('API is down:', error);
  }
};
```

## 🔐 Authentication

API sử dụng JWT Bearer token authentication:

1. Sau khi đăng nhập thành công, token tự động được lưu vào `localStorage`
2. Mọi request tiếp theo tự động thêm token vào header
3. Khi token hết hạn (401), user sẽ tự động bị logout

## 🛠️ Axios Interceptors

### Request Interceptor
- Tự động thêm Bearer token vào header của mọi request

### Response Interceptor
- Xử lý lỗi 401: Xóa token và redirect đến login
- Xử lý lỗi 403: Forbidden
- Xử lý lỗi 404: Not Found
- Xử lý lỗi 500: Server Error
- Xử lý network errors

## 📚 Swagger Documentation

Xem full API documentation tại: [Swagger UI](https://shipcombat-vr.onrender.com/swagger/index.html)

## 🚀 API Endpoints

### Auth
- `POST /api/Auth/register` - Đăng ký user mới
- `POST /api/Auth/login` - Đăng nhập

### GameData
- `GET /api/game/levels` - Lấy danh sách levels
- `GET /api/game/config/{levelId}` - Lấy config của level

### Player
- `POST /api/Player/create` - Tạo player mới

### Health
- `GET /api/Health` - Kiểm tra API health

## 📝 Schemas

### RegisterRequest
```json
{
  "username": "string",
  "password": "string",
  "email": "string"
}
```

### LoginRequest
```json
{
  "username": "string",
  "password": "string"
}
```

### CreatePlayerRequest
```json
{
  "groupId": 0,
  "displayName": "string"
}
```
