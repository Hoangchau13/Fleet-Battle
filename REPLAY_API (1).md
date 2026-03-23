# API Hướng Dẫn Tính Năng Replay Trận Đấu

> Dành cho FE developer tích hợp tính năng xem lại diễn biến trận đấu.

---

## Endpoint

```
GET /api/match/{matchId}/replay
Authorization: Bearer {JWT_TOKEN}
```

| Điều kiện | HTTP Status |
|---|---|
| Thành công | `200 OK` |
| Không có / sai JWT | `401 Unauthorized` |
| Trận chưa kết thúc / không tồn tại / không phải player trong trận | `404 Not Found` |

> ⚠️ **Bảo mật:** Chỉ 2 người chơi đã tham gia trận đó mới được xem replay. Đăng nhập bằng tài khoản khác sẽ nhận `404`.

---

## Luồng gọi API

```
1. GET /api/player/{playerId}       → Lấy lịch sử trận (recentMatches) → chọn matchId
2. GET /api/match/{matchId}/replay  → Nhận toàn bộ data để render
```

---

## Cấu Trúc Response

```json
{
  "matchId": 42,
  "endReason": "AllShipsSunk",
  "startTime": "2026-03-20T08:00:00Z",
  "endTime":   "2026-03-20T08:15:30Z",
  "totalTurns": 18,
  "winnerId": 1,

  "levelId":   2,
  "boardSize": 10,

  "player1Id":   1,
  "player1Name": "Tèo",
  "player2Id":   2,
  "player2Name": "Tí",

  "player1InitialGrid": [
    { "x": 2, "y": 3, "status": "Ship" },
    { "x": 3, "y": 3, "status": "Ship" },
    { "x": 4, "y": 3, "status": "Ship" }
  ],
  "player2InitialGrid": [
    { "x": 5, "y": 1, "status": "Ship" },
    { "x": 5, "y": 2, "status": "Ship" }
  ],

  "turns": [
    { "turnNumber": 1, "shooterId": 1, "x": 5, "y": 1, "result": "Hit",  "timestamp": "2026-03-20T08:01:00Z" },
    { "turnNumber": 2, "shooterId": 1, "x": 5, "y": 2, "result": "Sunk", "timestamp": "2026-03-20T08:01:45Z" },
    { "turnNumber": 3, "shooterId": 2, "x": 0, "y": 0, "result": "Miss", "timestamp": "2026-03-20T08:02:10Z" }
  ]
}
```

---

## Mô Tả Từng Thuộc Tính

### Thông tin chung

| Thuộc tính | Kiểu | Ý nghĩa |
|---|---|---|
| `matchId` | `int` | ID trận đấu |
| `endReason` | `string` | Lý do kết thúc: `"AllShipsSunk"` (bắn chìm hết tàu) hoặc `"Surrender"` (đầu hàng/timeout) |
| `startTime` | `datetime?` | Thời điểm trận bắt đầu (UTC) |
| `endTime` | `datetime?` | Thời điểm trận kết thúc (UTC) |
| `totalTurns` | `int` | Tổng số lượt bắn (= `turns.length`) |
| `winnerId` | `int` | `playerId` của người thắng |
| `levelId` | `int` | ID của Level đã chơi |
| `boardSize` | `int` | **Kích thước bàn cờ** — tạo grid `boardSize × boardSize` ô. VD: `10` → 10 cột × 10 hàng |
| `player1Id` / `player2Id` | `int` | ID của 2 người chơi |
| `player1Name` / `player2Name` | `string` | Tên hiển thị của 2 người chơi |

---

### `player1InitialGrid` / `player2InitialGrid`

**Trạng thái bàn cờ ban đầu — tất cả ô có tàu của mỗi người chơi (Fog of War tắt hoàn toàn).**

Mỗi phần tử là một ô tàu:

| Thuộc tính | Kiểu | Ý nghĩa |
|---|---|---|
| `x` | `int` | Cột (0 = trái) |
| `y` | `int` | Hàng (0 = trên) |
| `status` | `string` | Luôn là `"Ship"` — FE tự đổi sang `"Hit"` / `"Sunk"` / `"Miss"` khi apply turns |

> **FE dùng để làm gì?** Render trạng thái khởi điểm của cả 2 bàn cờ trước khi bất kỳ phát bắn nào xảy ra.

---

### `turns[]` — Chuỗi lượt bắn

**Mỗi phần tử là một phát bắn, đã được sắp xếp tăng dần theo thứ tự thời gian.**

| Thuộc tính | Kiểu | Ý nghĩa |
|---|---|---|
| `turnNumber` | `int` | Số thứ tự lượt, bắt đầu từ 1 |
| `shooterId` | `int` | `playerId` của **người bắn** lượt này |
| `x` | `int` | Cột bị bắn |
| `y` | `int` | Hàng bị bắn |
| `result` | `string` | Kết quả: `"Miss"` / `"Hit"` / `"Sunk"` |
| `timestamp` | `datetime?` | Thời điểm bắn thực tế — dùng để tính khoảng cách thời gian giữa các lượt (nếu FE muốn replay theo tốc độ thực) |

---

## Cách FE Render Replay

### Bước 1 — Render trạng thái ban đầu

```javascript
// Tô màu tất cả ô "Ship" cho 2 board
renderGrid(replay.player1InitialGrid, board1El);
renderGrid(replay.player2InitialGrid, board2El);
```

### Bước 2 — Apply từng lượt lên đúng board

```javascript
function applyTurn(turn) {
    // shooterId bắn → cập nhật board của đối thủ
    const targetBoard = (turn.shooterId === replay.player1Id) ? board2 : board1;

    // Cập nhật ô (x, y) với kết quả
    updateCell(targetBoard, turn.x, turn.y, turn.result);

    // Highlight người đang bắn
    setActivePlayer(turn.shooterId);
}
```

### Bước 3 — Seek tới bất kỳ lượt nào (timeline)

```javascript
function seekTo(stepN) {
    // Reset về trạng thái ban đầu
    renderGrid(replay.player1InitialGrid, board1El);
    renderGrid(replay.player2InitialGrid, board2El);

    // Apply lại từ đầu tới bước cần thiết
    for (let i = 0; i < stepN; i++) {
        applyTurn(replay.turns[i]);
    }
}

// Thanh timeline: giá trị từ 0 → replay.totalTurns
timelineSlider.max = replay.totalTurns;
timelineSlider.oninput = (e) => seekTo(parseInt(e.target.value));
```

### Màu sắc gợi ý cho từng `status`giống với màu sắc của game khi bắn tàu

---

## Hiểu Logic Lượt Bắn

Game Battleship có quy tắc: **bắn trúng thì được bắn tiếp**.

FE không cần tự tính logic này — chỉ cần nhìn vào **`shooterId` của lượt tiếp theo**:

```
Turn 1: shooterId=1 → Hit   ← P1 được bắn tiếp
Turn 2: shooterId=1 → Hit   ← P1 được bắn tiếp
Turn 3: shooterId=1 → Miss  ← Đổi lượt
Turn 4: shooterId=2 → Sunk  ← P2 được bắn tiếp
Turn 5: shooterId=2 → Miss  ← Đổi lượt
Turn 6: shooterId=1 → ...
```

> **Muốn hiện "Lượt của ai" trên UI?** → Dùng `turns[currentStep].shooterId`.  
> **Muốn biết ai bắn tiếp theo?** → Dùng `turns[currentStep + 1].shooterId`.
