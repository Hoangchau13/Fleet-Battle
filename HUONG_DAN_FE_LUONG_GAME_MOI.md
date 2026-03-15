# Hướng Dẫn FE — Luồng Game Mới (VR + Web)

Tài liệu này mô tả toàn bộ luồng hoạt động của game theo thiết kế mới, trong đó người chơi có thể chơi bằng Web thông thường hoặc kính VR.

---

## 1. Sơ đồ Luồng Tổng Quan

```
Login
  ↓
[Tùy chọn] Kết nối kính VR
  ↓
Web: Tìm trận → Xếp tàu → Xác nhận sẵn sàng
  ↓
Game bắt đầu
  ├── Bạn có VR? → Hiện "Chuyển qua kính VR để chơi"
  └── Không VR?  → Hiện giao diện bắn tàu trực tiếp trên Web
  ↓
Bắn tàu (bắn trúng được bắn tiếp, bắn trượt đổi lượt)
  ↓
Màn hình kết quả (thắng/thua/ELO thay đổi)
```

---

## 2. Bước 1 — Đăng Nhập

**API:** `POST /api/auth/login`

**Body:**
```json
{ "username": "abc", "password": "123" }
```

**Lưu lại JWT Token** từ response để dùng cho tất cả các bước tiếp theo.

---

## 3. Bước 2 — Kết Nối SignalR MatchHub (Bắt Buộc)

Ngay sau khi Login thành công, Web FE **phải** kết nối vào `MatchHub` và gọi `RegisterPlayer`.

```javascript
const connection = new signalR.HubConnectionBuilder()
    .withUrl(`${BASE_URL}/hubs/match?access_token=${jwtToken}`)
    .withAutomaticReconnect()
    .build();

await connection.start();

// Web Browser luôn truyền false
await connection.invoke("RegisterPlayer", playerId, false);
```

### Chữ ký hàm `RegisterPlayer`

| Tham số | Kiểu | Bắt buộc | Mô tả |
|---|---|---|---|
| `playerId` | `int` | ✅ | ID của player (lấy từ JWT hoặc API sau khi login) |
| `isVrDevice` | `bool` | ✅ | **Luôn truyền `false` ở đây.** `true` chỉ dành cho kính VR. |

> ⚠️ **QUAN TRỌNG:** Cả 2 tham số đều bắt buộc. **Không được** bỏ qua `isVrDevice`, nếu thiếu server sẽ báo lỗi.
>
> ```javascript
> // ❌ SAI — thiếu isVrDevice
> await connection.invoke("RegisterPlayer", playerId);
>
> // ✅ ĐÚNG — Web FE luôn truyền false
> await connection.invoke("RegisterPlayer", playerId, false);
> ```

### `isVrDevice` được dùng ở đâu?

| Thời điểm | Server dùng `isVrDevice` để làm gì |
|---|---|
| Khi game bắt đầu (`ReceiveGameStarted`) | Server tính xem đối thủ có đang dùng VR không |
| Trong `ReceiveGameState` | Trường `isOpponentUsingVr` = `true` nếu đối thủ đăng ký với `isVrDevice = true` |
| Khi reconnect | Server biết phải restore state theo đúng loại client |

**Tóm lại:** `isVrDevice` là cờ định danh loại thiết bị. FE Web luôn là `false`. Kính VR luôn là `true`.

---

## 4. Bước 3 — [Tùy Chọn] Kết Nối Kính VR

Chỉ cần thực hiện nếu người chơi muốn dùng kính VR. **Có thể bỏ qua bước này** nếu chỉ muốn chơi trên Web.

Xem hướng dẫn chi tiết tại file `HUONG_DAN_VR_LINK.md`.

**Sau khi VR link thành công:** Web FE nhận event `ReceiveVrLinkConfirmed` từ `MatchHub` → Lưu biến `myHasVr = true` ở phía client.

---

## 5. Bước 4 — Tìm Trận

**API:** `POST /api/match/find`

**Body:**
```json
{ "playerId": 3 }
```

**Sau đó lắng nghe sự kiện SignalR:**
```javascript
connection.on("ReceiveMatchStatus", (status, matchId, message) => {
    if (status === "Found") {
        // Đã tìm được đối thủ → hiện popup Accept/Decline
        currentMatchId = matchId;
    }
});
```

---

## 6. Bước 5 — Xác Nhận Tham Gia Trận

**API:** `POST /api/match/{matchId}/confirm?playerId={playerId}`

Gọi API này khi người chơi bấm "Accept". Đợi cả 2 xác nhận, Server tự chuyển sang phase Setup.

```javascript
connection.on("ReceiveMatchFound", (matchId) => {
    // Cả 2 đã xác nhận → chuyển sang màn hình xếp tàu
    showShipSetupScreen(matchId);
});
```

---

## 7. Bước 6 — Xếp Tàu (Setup Phase)

**API:** `POST /api/match/{matchId}/setup?playerId={playerId}`

**Body:** Gửi lên danh sách tàu với tọa độ và góc xoay.
```json
[
  { "shipTypeId": 1, "x": 0, "y": 0, "rotation": 0   },
  { "shipTypeId": 2, "x": 3, "y": 2, "rotation": 90  },
  { "shipTypeId": 3, "x": 5, "y": 5, "rotation": 180 }
]
```

- `rotation`: `0` (ngang phải), `90` (dọc xuống), `180` (ngang trái), `270` (dọc lên)
- **Cả 2 người xếp xong** → Server tự động chuyển sang `Playing` và gửi `ReceiveGameStarted`.

---

## 8. Bước 7 — Game Bắt Đầu: Hiển Thị Đúng Giao Diện

**Đây là bước quan trọng nhất của luồng mới.** Khi nhận `ReceiveGameStarted` và `ReceiveGameState`, FE phải phân nhánh giao diện:

```javascript
connection.on("ReceiveGameState", (gameState) => {
    // gameState.isOpponentUsingVr: đối thủ có đang dùng VR không (do server cung cấp)
    // myHasVr: biến client-side, = true nếu BẠN đã link VR thành công ở bước 3

    if (myHasVr) {
        // BẠN đang dùng VR → Web chỉ cần hiện thông báo
        showScreen("switch-to-vr");
        // "Game đã bắt đầu! Đeo kính VR của bạn vào để bắt đầu bắn tàu."
    } else {
        // BẠN không có VR → Hiện giao diện bắn tàu Web bình thường
        showScreen("web-gameplay");
        renderBoard(gameState.myBoard, gameState.opponentBoard);
        setupShootingControls(gameState.currentTurnPlayerId, gameState.yourPlayerId);
    }

    // Thông báo cho người chơi biết đối thủ đang dùng VR hay Web
    // (để biết kỳ vọng thời gian phản hồi)
    if (gameState.isOpponentUsingVr) {
        showBadge("Đối thủ đang dùng kính VR 🥽");
    }
});
```

---

## 9. Bước 8 — Bắn Tàu

**API:** `POST /api/match/{matchId}/fire?playerId={playerId}`

**Body:**
```json
{ "x": 3, "y": 4 }
```

**Logic lượt chơi (Bắn trúng được bắn tiếp):**
```javascript
connection.on("ReceiveGameState", (gameState) => {
    if (gameState.currentTurnPlayerId === myPlayerId) {
        enableShooting();           // Mở khóa bàn cờ để bắn
        startTimer(30);             // Đếm ngược 30 giây
    } else {
        disableShooting();          // Khóa bàn cờ
        showWaiting("Đối thủ đang bắn...");
        startTimer(30);
    }
    renderBoard(gameState.myBoard, gameState.opponentBoard);
});

connection.on("ReceiveShotResult", (result) => {
    animateShotEffect(result.x, result.y, result.result);
    // result.result: "Hit" → lửa, "Miss" → bọt nước, "Sunk" → vụ nổ lớn
});
```

---

## 10. Bước 9 — Kết Thúc Trận

```javascript
connection.on("ReceiveGameOver", (winnerId, winnerName, message) => {
    showGameOverScreen(winnerId === myPlayerId, winnerName, message);
});
```

**Sau đó gọi API để lấy chi tiết ELO:**

`GET /api/match/{matchId}/result`

```json
{
  "matchId": 5,
  "endReason": "AllShipsSunk",
  "winner": { "playerId": 3, "displayName": "NavyKing", "eloBefore": 1150, "eloAfter": 1170, "eloChange": 20 },
  "loser":  { "playerId": 7, "displayName": "SeaWolf",  "eloBefore": 1050, "eloAfter": 1030, "eloChange": -20 },
  "totalTurns": 34,
  "endTime": "2026-03-15T18:00:00Z"
}
```

---

## 11. Tóm Tắt Đầy Đủ SignalR

### Hàm FE **GỌI** lên Server (`connection.invoke`)

| Tên hàm | Tham số (theo đúng thứ tự) | Giai đoạn | Mục đích |
|---|---|---|---|
| `RegisterPlayer` | `(int playerId, bool isVrDevice)` | Sau kết nối | Đăng ký player. **Web luôn truyền `false`** cho `isVrDevice` |
| `JoinSpectatorMode` | `(int matchId)` | Spectate | Vào xem một trận đang diễn ra |
| `LeaveSpectatorMode` | `(int matchId)` | Spectate | Rời khỏi chế độ xem trận |

### Sự Kiện FE **NHẬN** từ Server (`connection.on`)

| Tên sự kiện | Tham số | Giai đoạn | Ý nghĩa |
|---|---|---|---|
| `ReceiveMatchStatus` | `(string status, int? matchId, string message)` | Matchmaking | Trạng thái tìm trận |
| `ReceiveMatchFound` | `(int matchId)` | Matchmaking | Cả 2 xác nhận → vào Setup |
| `ReceiveGameStarted` | `(int starterPlayerId)` | Game Start | Game chính thức bắt đầu |
| `ReceiveGameState` | `(GameStateResponse gameState)` | Gameplay | Cập nhật toàn bộ bảng cờ + lượt đi |
| `ReceiveShotResult` | `(FireShotResponse result)` | Gameplay | Kết quả 1 phát bắn |
| `ReceiveGameOver` | `(int winnerId, string winnerName, string message)` | Game Over | Trận kết thúc |
| `ReceiveVrLinkConfirmed` | *(không có tham số)* | VR Link | Kính VR đã kết nối thành công → set `myHasVr = true` |
| `ReceivePlayerDisconnected` | `(int playerId)` | Gameplay | Đối thủ mất kết nối |
| `ReceivePlayerReconnected` | `(int playerId)` | Gameplay | Đối thủ kết nối lại |
| `ReceiveSpectatorGameState` | `(SpectatorGameStateResponse gameState)` | Spectate | Cập nhật state đầy đủ cho Spectator |
