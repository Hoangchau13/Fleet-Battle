# ShipCombat VR: Frontend Integration Guide

Tài liệu này hướng dẫn chi tiết cách tích hợp giữa Frontend (Web/VR) với Backend.

## 1. Công nghệ sử dụng
- **REST API**: Dùng cho Auth, Ghép trận, Setup, Bắn tàu.
- **SignalR**: Dùng cho thông báo thời gian thực (`/hubs/match` và `/hubs/vr`).
- **Xác thực**: Gửi Header `Authorization: Bearer <JWT_TOKEN>`.

---

## 2. Chi tiết API REST

### A. Authentication
- **Đăng ký**: `POST /api/auth/signup`
  - Body: `{ "username": "...", "password": "...", "email": "..." }`
- **Đăng nhập**: `POST /api/auth/login`
  - Body: `{ "username": "...", "password": "..." }`
  - Response: `{ "userId": 1, "username": "...", "role": "...", "token": "..." }`

### B. Matchmaking
- **Tìm trận**: `POST /api/match/find`
  - Body: `{ "playerId": 1 }`
  - Response: `{ "status": "Searching"|"Found"|"InGame", "matchId": 123, "levelId": 1, "message": "..." }`
- **Hủy tìm trận**: `DELETE /api/match/cancel?playerId=...`
- **Xác nhận trận**: `POST /api/match/{matchId}/confirm?playerId=...`
  - Trạng thái chờ: Cả 2 người chơi phải gọi API này sau khi `status` là `Found`.

### C. Gameplay
- **Xếp tàu**: `POST /api/match/{matchId}/setup?playerId=...`
  - Body: `[ { "shipTypeId": 1, "x": 0, "y": 0, "rotation": 0 }, ... ]`
- **Bắn tàu**: `POST /api/match/{matchId}/fire?playerId=...`
  - Body: `{ "x": 5, "y": 5 }`
  - Response: `{ "x": 5, "y": 5, "result": "Miss"|"Hit"|"Sunk", "sunkShipTypeId": 1?, "isGameOver": false }`
- **Lấy trạng thái (Sync)**: `GET /api/match/{matchId}/state?playerId=...`
  - Response ([GameStateResponse](file:///d:/Year2026/Spring2026/SWD/ShipCombat_VR_BE/BE/Battleship.API/DTOs/MatchDTOs.cs#54-64)):
    ```json
    {
      "matchId": 123,
      "status": "Playing",
      "turnPlayerId": 1,
      "turnCount": 5,
      "yourPlayerId": 1,
      "myBoard": { "playerId": 1, "displayName": "...", "remainingShips": 3, "grid": [...] },
      "opponentBoard": { "playerId": 2, "displayName": "...", "remainingShips": 4, "grid": [...] },
      "winnerId": null
    }
    ```

### D. Player & Profile
- **Lấy Profile**: `GET /api/player/{id}`
  - Response ([PlayerProfileResponse](file:///d:/Year2026/Spring2026/SWD/ShipCombat_VR_BE/BE/Battleship.API/DTOs/PlayerDTOs.cs#27-38)): `{ "playerId": 1, "displayName": "...", "elo": 120, "totalMatches": 10, "recentMatches": [...] }`
- **Lấy Live Matches**: `GET /api/match/live`
  - Response: Danh sách các trận đang ở trạng thái `Playing`.

---

## 3. SignalR Hubs

### Hub `/hubs/match` (Yêu cầu Token)
Sự kiện lắng nghe (on):
- `ReceiveMatchStatus(string status, int? matchId, string message)`
- `ReceiveMatchFound(int matchId)` (Chuyển sang màn hình xếp tàu)
- `ReceiveGameStarted(int starterPlayerId)` (Bắt đầu lượt bắn đầu tiên)
- `ReceiveShotResult(FireShotResponse result)`
- `ReceiveGameOver(int winnerId, string winnerName, string message)`
- `ReceivePlayerDisconnected(int playerId)`
- `ReceivePlayerReconnected(int playerId)`

#### Dành cho luồng Xem trận trực tiếp (Spectator)
Người xem chỉ quan tâm 1 event duy nhất là bản đồ đã bộc lộ:
- `ReceiveSpectatorGameState(SpectatorGameStateResponse gameState)`: Nhận được khi có cú bắn mới hoặc khi game vừa bắt đầu. Trả về đúng Data Type như API `GET /api/match/{matchId}/spectate`.

***Cách tham gia xem trực tiếp (Spectator Mode):***
1. Khởi tạo SignalR connection tới `/hubs/match?access_token=<JWT>`.
2. Gọi method [JoinSpectatorMode(int matchId)](file:///d:/Year2026/Spring2026/SWD/ShipCombat_VR_BE/BE/Battleship.API/Hubs/MatchHub.cs#82-102).
3. Server sẽ lập tức push ngay `ReceiveSpectatorGameState` chứa dữ liệu bàn cờ hiện tại.
4. Mỗi khi có người bắn, Server sẽ lại push `ReceiveSpectatorGameState` mới với hoạt ảnh nổ.
5. Để thoát phòng xem, gọi [LeaveSpectatorMode(int matchId)](file:///d:/Year2026/Spring2026/SWD/ShipCombat_VR_BE/BE/Battleship.API/Hubs/MatchHub.cs#103-111) hoặc đóng connection.

### Hub `/hubs/vr` (Anonymous)
- Server -> Client: `ReceivePairingCode(string code, string expiresAt)`
- Server -> Client: `ReceiveToken(string token)` (Nhận sau khi Web đã link thành công)

---

## 4. VR Linking Flow
1. **VR** kết nối Hub `/hubs/vr`. Server push `ReceivePairingCode`.
2. **Web** (đã Login) gọi `POST /api/vr/link`.
   - Body: `{ "code": "123456", "playerId": 1 }`
3. **Server** push `ReceiveToken` cho **VR**.
4. **VR** dùng Token mới để kết nối vào `/hubs/match`.
