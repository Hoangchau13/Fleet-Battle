# Tài liệu Kỹ thuật Tích hợp BE & FE - ShipCombat VR

Tài liệu này cung cấp hướng dẫn toàn diện nhất và chính xác nhất cho đội ngũ Frontend để tích hợp hệ thống Trận đấu (Matchmaking & Gameplay) bằng REST API và SignalR. Đừng đoán mò, hãy đọc theo sát tài liệu này.

---

## 1. Cơ chế SignalR: Hoạt động thế nào?
Game sử dụng **SignalR** (WebSockets) song song với **REST API** truyền thống.
- **REST API (`/api/match/...`)**: Dùng để bạn GỬI hành động lên server (Tìm trận, Hủy, Xác nhận, Xếp tàu, Bắn tàu).
- **SignalR (`/hubs/match`)**: Dùng để Server THÔNG BÁO ngược lại cho bạn khi có biến động từ đối thủ hoặc Server (Tìm thấy đối thủ, Bị bắn, Đứt mạng).

**Cách BE phân chia Client:**
- Khi bạn kết nối vào `/hubs/match?access_token=<JWT>`, BE nhận diện bạn qua `PlayerId` lấy từ Token.
- BE lưu trữ "Bản đồ 1-1" kết nối (1 Player - 1 Connection).
- Khi bạn ghép thành công với một đối thủ, BE gộp cả 2 bạn vào một **"Group"** có tên `Match_{GameId}`. Bất kỳ thông báo nội bộ nào của trận đấu đều được gửi vào Group này.
- Khi người xem (Spectator) muốn xem giải đấu, họ gọi JoinSpectatorMode để được ném vào group `Spectator_{GameId}`.

---

## 2. Các Luồng Logic Chi Tiết Từng Bước

### Luồng 1: Tìm trận (Matchmaking) & Chờ xác nhận (Confirmation)

**1. Khởi tạo SignalR:**
- FE phải khởi tạo và bắt đầu lắng nghe SignalR tại `/hubs/match` TRƯỚC khi gọi API.
- Gọi hàm SignalR: [RegisterPlayer(playerId)](file:///d:/Year2026/Spring2026/SWD/ShipCombat_VR_BE/BE/Battleship.API/Hubs/MatchHub.cs#48-64) gửi lên BE để đăng ký.

**2. Gửi lệnh Tìm trận:**
- Yêu cầu: `POST /api/match/find`
- Body: `{"playerId": 123}`
- BE sẽ trả về Status Code 200, trong đó thuộc tính `status` sẽ là `"Searching"` (nếu chưa có ai) hoặc `"Found"` (nếu đã có người). 
- *Chú ý: Nếu `status` là `"Searching"`, FE hiện màn hình "Đang tìm đối thủ" đếm giờ.*

**3. Nhận thông báo "Đã tìm thấy":**
- Khi có một người khác gọi API `find` và phù hợp với bạn, trận sẽ được tạo ngầm với trạng thái `WaitingConfirmation`.
- Ngay lập tức, SignalR của cả 2 FE sẽ nhận được event `ReceiveMatchStatus("Found", matchId, "Đã tìm được...")`.
- FE hiển thị Popup đếm ngược chờ 2 bên Xác nhận. 

**4. Xác nhận tham gia:**
- Người chơi bấm OK -> Chạy `POST /api/match/{matchId}/confirm?playerId=...`
- API này chỉ trả về `{"message": "Đã xác nhận sẵn sàng."}`. FE nhận được 200 OK thì chỉ chuyển text thành "Đang đợi đối thủ xác nhận...", **KHÔNG CHUYỂN MÀN HÌNH XẾP TÀU NGAY**.
- (Lưu ý: Nếu người kia bấm xác nhận, SignalR của bạn sẽ nhận được `ReceiveMatchStatus("PlayerReady", ...)` -> Bạn có thể làm UI sáng lên 1 dấu tick cho đẹp).

**5. Hủy tìm kiếm / Hủy xác nhận:**
- Bất cứ lúc nào (trước khi vào Xếp tàu), gọi `DELETE /api/match/cancel?playerId=...`.
- Nếu đang ở `WaitingConfirmation` mà hủy, người còn lại sẽ nhận được SignalR `ReceiveMatchStatus("Cancelled", ...)` -> Đưa cả 2 về lại sảnh.

---

### Luồng 2: Xếp Tàu (Setup)

**1. Vào màn xếp tàu:**
- Khi **CẢ HAI** cùng confirm thành công, Server tự động chuyển status trận bằng `"Setup"`.
- Cùng lúc đó, SignalR phát event `ReceiveMatchFound(matchId)` tới cả 2.
- Nhận được cái này, FE mới tự động **chuyển trang sang Màn Xếp Tàu**.

**2. Gửi cấu hình tàu:**
- Người chơi kéo thả xong -> Gọi `POST /api/match/{matchId}/setup?playerId=...`
- Body mẫu:
```json
[
  { "shipTypeId": 1, "x": 0, "y": 0, "rotation": 90 },
  { "shipTypeId": 2, "x": 2, "y": 2, "rotation": 0 }
]
```
- BE sẽ chạy validate (1). Số lượng phải chuẩn chỉ cấu hình Level, (2). Không để lọt loại tàu lạ. Nếu sai, BE trả 400 Bad Request kèm message lỗi.
- Trả về 200 OK -> FE ghi chữ "Đợi đối thủ xếp tàu...". Lại NHỚ là chưa được chuyển qua bước kế.

**3. Đối thủ AFK (Ngâm giờ xếp tàu):**
- Thời gian cho phép xếp tàu là 120 giây (2 phút).
- Ngay khi BẠN xếp tàu xong, bạn có quyền chờ. Nếu vượt qua 120 giây mà bên kia găm hàng không chịu xếp hoặc đứt mạng, FE của bạn có thể gọi `POST /api/match/{matchId}/claim-timeout?playerId=...`
- Bạn sẽ lập tức được tính thắng (auto-win) và đối thủ bị trừ Elo. (Giống hệt cách Claim Timeout đang chơi).

---

### Luồng 3: Chơi Game (Combat)

**1. Khởi động trận:**
- Khi người cuối cùng bấm gọi API Setup thành công, BE đẩy status thành `"Playing"`.
- SignalR lập tức đẩy về sự kiện `ReceiveGameState(...)` độc lập cho từng người (Bản đồ của bạn thì hiện tàu, bản đồ thằng kia thì giấu).
- Tiếp theo, SignalR đẩy `ReceiveGameStarted(starterPlayerId)`.
- FE hiển thị nút READY và cho phép người có Id trùng `starterPlayerId` đánh trước.

**2. Bắn tàu (Đến lượt mình):**
- Bấm vào tọa độ (x,y) của bản đồ địch.
- FE gọi `POST /api/match/{matchId}/fire?playerId=...`
- Body: `{"x": 3, "y": 4}` (0-indexed).
- *Chú ý Logic BE:* Nếu bắn ô bắn rồi, BE trả `400 Bad Request`, bắn sai lượt cũng `400`. FE show Toast alert.
- Nếu thành công, API trả ngay Kết quả vụ bắn. (Và SignalR cũng phát lại cho cả bọn để đồng bộ).

**3. Bị bắn (Đến lượt địch):**
- Người kia vã tọa độ (x,y). FE của chúng ta đang yên bình sẽ nhận được SignalR `ReceiveShotResult`.
- Trong `ReceiveShotResult` cho biết tọa độ (x,y) và kết quả (Miss/Hit/Sunk).
- Cùng lúc đó SignalR đẩy cái `ReceiveGameState(...)` mới đã cập nhật lại bản đồ -> Cứ thế mà Render. Trạng thái GameState ghi rõ `TurnPlayerId` (id của người đánh hiệp sau), FE so sánh lại để biết "A! Đến lượt mình dồi".

---

### Luồng 4: Kết thúc và Nhượng Bộ

**1. Thua bình thường (Hết cờ):**
- Trả về từ SignalR `ReceiveShotResult` có thuộc tính `isGameOver = true`.
- Sau đó SignalR đẩy thêm `ReceiveGameOver(winnerId, winnerName, message)`. FE nổ màn hình WIN/LOSE và chuyển sang màn kết thúc. Bảng Elo tự động cập nhật ngầm.

**2. Giơ tay xin hàng:**
- User không muốn đánh nữa -> Bấm nút Đầu Hàng.
- FE gọi `POST /api/match/{matchId}/surrender?playerId=...`
- BE sẽ lo chấm dứt trận và qua SignalR đẩy `ReceiveSurrender(winnerId)` và `ReceiveGameOver`. Đối thủ tự động thắng.

**3. AFK - Bỏ mạng trận địa:**
- Nếu đối thủ ngắt kết nối (Rớt app), Server nhận diện qua SignalR onDisconnect.
- Server gọi lập tức `ReceivePlayerDisconnected(playerId)` tới mình. FE nên hiện lên cái Loading/Đếm số 30s.
- Người kia vào game lại, app tự bật [RegisterPlayer](file:///d:/Year2026/Spring2026/SWD/ShipCombat_VR_BE/BE/Battleship.API/Hubs/MatchHub.cs#48-64) -> Server thấy nó đang in-game sẽ gửi tín hiệu `ReceivePlayerReconnected(playerId)`. FE tắt Đếm số.
- Nếu đợi lâu (Hơn `TimeLimit + 10s`), bạn không thích chờ nữa, bạn gọi `POST /api/match/{id}/claim-timeout?playerId=...`
- BE trả OK -> Mình được xử thắng.

---

### Luồng 5: Spectator (Chế độ xem chung)

1. Connect SignalR như bình thường rồi gọi vào hàm SignalR của BE: [JoinSpectatorMode(matchId)](file:///d:/Year2026/Spring2026/SWD/ShipCombat_VR_BE/BE/Battleship.API/Hubs/MatchHub.cs#82-102).
2. Vừa Join phát, tín hiệu `ReceiveSpectatorGameState` dập thẳng vô mặt cung cấp full Snapshot của map hiện tại (Tàu bị chìm thì lộ, tàu chưa chìm thì giấu kín).
3. Sau đó, bất cứ khi nào 2 thằng kia đấm nhau ([FireShotAsync](file:///d:/Year2026/Spring2026/SWD/ShipCombat_VR_BE/BE/Battleship.API/Services/MatchService.cs#352-492)), một cái `ReceiveSpectatorGameState` mới sẽ được đẩy cho Spectator update realtime như xem livestream.

## 3. Review Security & Bug Checks Backend đã được áp dụng
- **Cheat Lượt:** Bạn không thể xài API Fire khi chưa đến lượt t. Lỗi sẽ bung 400 Bad Request. BE đã quản lý `CurrentTurnPlayerId` rất kỹ.
- **Cheat Tàu:** Tàu không được nhồi quá số lượng so với cấu hình Level. Xoay góc lạ / Tọa độ sai sẽ không mapping dính. BE đã kiểm tra gắt gao.
- **Cheat Elo / Race conditions:** Tìm trận đang được set lock state (`WaitingConfirmation`) để tránh 1 người bấm 2 lần match đc 2 trận cùng lúc. Cập nhật Elo chỉ thực thi 1 lần lúc `isGameOver`.

---
**Tài liệu này được soạn ngày 15/03/2026 đúc kết tất cả core engine Backend đã update.**
