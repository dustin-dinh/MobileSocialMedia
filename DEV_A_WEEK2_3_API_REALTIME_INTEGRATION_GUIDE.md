# DEV A — Hướng dẫn tích hợp Backend API Week 2–3 + Realtime

**Backend:** NestJS + Prisma + Supabase PostgreSQL/Storage  
**Mobile:** Expo + React Native  
**Phạm vi:** API Week 2–3 và Notification Realtime

> Mobile chỉ gọi NestJS Backend. Mobile không truy cập PostgreSQL, Prisma hoặc Supabase Service Role trực tiếp.

## 1. Backend và Base URL

Chạy backend:

```bash
pnpm install
pnpm start:dev
```

Backend mặc định chạy:

```text
http://localhost:3000
```

REST API có global prefix:

```text
/api
```

### Điện thoại thật

Không dùng `localhost` hoặc `127.0.0.1` trên điện thoại.

Ví dụ máy tính có LAN IP `192.168.1.10`:

```env
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.10:3000/api
```

PC và điện thoại phải cùng mạng LAN. Sau khi đổi `.env.local`, restart Expo.

Không đưa các secret này vào Mobile:

```text
DATABASE_URL
SUPABASE_SERVICE_ROLE_KEY
JWT_SECRET
```

---

## 2. Auth thật

Mobile hiện có:

```ts
BYPASS_AUTH_FOR_TESTING = true
```

Khi tích hợp backend thật:

```ts
BYPASS_AUTH_FOR_TESTING = false
```

Flow:

```text
Login
  ↓
POST /api/auth/login
  ↓
accessToken
  ↓
SecureStore
  ↓
GET /api/users/me
  ↓
Mobile session
```

Protected request:

```http
Authorization: Bearer <accessToken>
```

Logout:

```text
POST /api/auth/logout
↓
xóa accessToken khỏi SecureStore
↓
clear session
↓
disconnect realtime socket
```

---

# 3. Week 2 — Post

## Create Post

```http
POST /api/posts
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

Form fields:

```text
content    Text    optional
images     File    optional
```

Giới hạn:

```text
Tối đa 4 ảnh
Tối đa 5 MB / ảnh
JPEG / PNG / WebP
```

Hợp lệ:

```text
text only
image only
text + image
text + nhiều image
```

Không được gửi post rỗng.

### React Native FormData

Backend nhận field **`images`**.

```ts
const formData = new FormData();

if (content.trim()) {
  formData.append("content", content.trim());
}

for (const asset of assets) {
  formData.append("images", {
    uri: asset.uri,
    name: asset.fileName ?? "image.jpg",
    type: asset.mimeType ?? "image/jpeg",
  } as any);
}
```

Nếu nhiều ảnh, append nhiều lần cùng field `images`.

Không gửi ảnh như JSON:

```json
{
  "image": "file:///..."
}
```

## Feed

```http
GET /api/posts/feed?page=1&limit=10
Authorization: Bearer <token>
```

Feed gồm:

```text
- post của chính user
- post của user mà user hiện tại follow
```

Sắp xếp `createdAt DESC`.

Response có:

```text
data
meta.page
meta.limit
meta.total
meta.totalPages
```

Post item có các field chính:

```text
id
content
createdAt
updatedAt
author
media
likeCount
isLiked
```

Backend branch hiện tại có integration comments count; Mobile phải map theo response thực tế của branch đang dùng.

## Post detail

```http
GET /api/posts/:id
Authorization: Bearer <token>
```

Contract hiện tại:

```text
Create Post → { data: post }

Feed → { data: posts, meta: ... }

Post Detail → post object
```

Không assume tất cả endpoint đều bọc `{ data }`.

---

# 4. Week 2 — Profile

## Profile

```http
GET /api/users/:id
```

Public fields:

```text
id
username
displayName
avatarUrl
bio
postsCount
```

Không hiển thị password/passwordHash.

## User posts

```http
GET /api/users/:id/posts?page=1&limit=10
Authorization: Bearer <token>
```

---

# 5. Week 2 — Follow

```http
POST /api/users/:id/follow
Authorization: Bearer <token>
```

```http
DELETE /api/users/:id/follow
Authorization: Bearer <token>
```

```http
GET /api/users/:id/followers?page=1&limit=20
Authorization: Bearer <token>
```

```http
GET /api/users/:id/following?page=1&limit=20
Authorization: Bearer <token>
```

Backend xử lý:

```text
self-follow → reject
user không tồn tại → 404
follow duplicate → không tạo duplicate relationship
unfollow → xóa relationship
```

---

# 6. Week 2 — Search

```http
GET /api/users/search?q=alice&page=1&limit=20
Authorization: Bearer <token>
```

Search trên:

```text
username
displayName
```

Không phân biệt hoa thường.

---

# 7. Week 3 — Like

## Like

```http
POST /api/posts/:id/like
Authorization: Bearer <token>
```

## Unlike

```http
DELETE /api/posts/:id/like
Authorization: Bearer <token>
```

Backend không tạo duplicate Like.

Mobile có thể dùng optimistic UI:

```text
tap Like
  ↓
đổi UI ngay
  ↓
call API
  ↓
success → giữ
error → rollback
```

Backend chỉ tạo notification LIKE khi Like mới thực sự được tạo.

---

# 8. Week 3 — Comments

## List comments

```http
GET /api/posts/:id/comments?page=1&limit=20
Authorization: Bearer <token>
```

## Create comment

```http
POST /api/posts/:id/comments
Authorization: Bearer <token>
Content-Type: application/json
```

```json
{
  "content": "Hello"
}
```

## List replies

```http
GET /api/comments/:id/replies?page=1&limit=20
Authorization: Bearer <token>
```

## Reply

```http
POST /api/comments/:id/replies
Authorization: Bearer <token>
Content-Type: application/json
```

```json
{
  "content": "Reply"
}
```

## Delete comment

```http
DELETE /api/comments/:id
Authorization: Bearer <token>
```

Chỉ owner của comment được delete.

---

# 9. Week 3 — Notifications REST

Types:

```text
LIKE
COMMENT
FOLLOW
```

## List

```http
GET /api/notifications?page=1&limit=20
Authorization: Bearer <token>
```

Response có:

```text
data
meta
unreadCount
```

Notification có actor và context liên quan nếu có:

```text
actor
post
comment
```

## Mark one read

```http
PATCH /api/notifications/:id/read
Authorization: Bearer <token>
```

## Mark all read

```http
PATCH /api/notifications/read-all
Authorization: Bearer <token>
```

---

# 10. Notification behavior

Follow:

```text
A follow B
↓
B nhận FOLLOW
```

Like:

```text
A like post của B
↓
B nhận LIKE
```

Comment:

```text
A comment post của B
↓
B nhận COMMENT
```

Reply:

```text
C comment post B
A reply comment C
↓
C nhận COMMENT
```

Self action:

```text
B like post của B
↓
không tạo notification cho chính B
```

---

# 11. Realtime Notification — Socket.IO

Realtime chỉ dùng để đẩy notification mới.

```text
REST
 └── notification history

Socket.IO
 └── realtime notification
```

REST vẫn là source of truth.

## Socket endpoint

Nếu backend:

```text
http://192.168.1.10:3000
```

thì namespace:

```text
/notifications
```

Mobile:

```ts
import { io } from "socket.io-client";

const socket = io(
  "http://192.168.1.10:3000/notifications",
  {
    auth: {
      token: accessToken,
    },
  },
);
```

### Rất quan trọng

REST:

```text
http://192.168.1.10:3000/api/notifications
```

Socket:

```text
http://192.168.1.10:3000/notifications
```

**Socket không dùng `/api`.**

## Socket authentication

Backend đọc:

```ts
client.handshake.auth.token
```

Mobile gửi:

```ts
auth: {
  token: accessToken,
}
```

Không hardcode hoặc log JWT.

## Event

Backend emit:

```text
notification:new
```

Mobile:

```ts
socket.on("notification:new", (notification) => {
  // prepend notification
  // update unread count
});
```

Flow:

```text
A like post B
      ↓
NestJS tạo Like
      ↓
NestJS tạo Notification
      ↓
emit notification:new
      ↓
room user:B
      ↓
Mobile B nhận event
```

Backend emit sau khi Notification được tạo thành công trong DB.

---

# 12. Socket lifecycle

Không tạo socket trong từng NotificationItem.

Nên có một service/provider dùng chung:

```text
AuthSession
     ↓
NotificationSocketService
     ↓
Socket.IO
```

Lifecycle:

```text
Login thành công
    ↓
connect socket

Logout
    ↓
disconnect socket
```

## Reconnect / mất mạng

Socket không đảm bảo nhận event khi offline.

Sau reconnect, Mobile phải resync:

```http
GET /api/notifications?page=1&limit=20
```

Flow:

```text
Socket reconnect
      ↓
GET /api/notifications
      ↓
update notification state
      ↓
tiếp tục listen notification:new
```

---

# 13. Kiến trúc Mobile

```text
Screen
  ↓
Feature Service
  ↓
HTTP Client
  ↓
NestJS REST API
```

Notification:

```text
Notification UI
       ↑
Notification Store/State
       ↑
Notification REST + Socket Service
       ↑
NestJS
```

Không gọi raw `fetch()` từ mọi Screen nếu project đã có `httpClient/service`.

---

# 14. Thứ tự tích hợp

Làm lần lượt:

```text
1. Auth
2. Feed
3. Create Post
4. Post Detail
5. Profile
6. Follow
7. Search
8. Like
9. Comment
10. Reply
11. Notification REST
12. Notification Socket
```

Mỗi feature:

```text
Backend endpoint test PASS
        ↓
Mobile service
        ↓
Mobile UI
        ↓
E2E test
        ↓
tắt mock
```

---

# 15. Checklist Week 2

```text
[ ] BYPASS_AUTH_FOR_TESTING = false
[ ] Login thật
[ ] JWT SecureStore
[ ] GET /users/me
[ ] Feed
[ ] Create text post
[ ] Create image post
[ ] Create text + image
[ ] Multi-image
[ ] Post detail
[ ] Profile
[ ] User posts
[ ] Follow
[ ] Unfollow
[ ] Followers
[ ] Following
[ ] Search
```

# 16. Checklist Week 3

```text
[ ] Like
[ ] Unlike
[ ] likeCount
[ ] isLiked

[ ] Comment
[ ] Comment list
[ ] Reply
[ ] Reply list
[ ] Delete own comment

[ ] Notification list
[ ] unreadCount
[ ] Mark one read
[ ] Mark all read

[ ] FOLLOW notification
[ ] LIKE notification
[ ] COMMENT notification

[ ] Socket connect
[ ] JWT handshake
[ ] notification:new
[ ] Reconnect
[ ] Notification resync
[ ] Socket disconnect on logout
```

---

# 17. E2E test A/B/C

Tạo:

```text
User A
User B
User C
```

### Follow

```text
A → follow B
```

Expected:

```text
B → FOLLOW notification
```

### Like

```text
B → create post
A → like post B
```

Expected:

```text
B → LIKE notification
```

### Comment

```text
A → comment post B
```

Expected:

```text
B → COMMENT notification
```

### Reply

```text
C → comment post B
A → reply comment C
```

Expected:

```text
C → COMMENT notification
B → không nhận notification reply này
```

### Duplicate

```text
A follow B lần 2
A like post B lần 2
```

Expected:

```text
không duplicate relationship
không duplicate Like
không duplicate notification tương ứng
```

### Self action

```text
B like post của B
```

Expected:

```text
Like được xử lý
không tạo notification cho B
```

---

# 18. Debug

## API không kết nối

Kiểm tra:

```text
PC và điện thoại cùng Wi-Fi
LAN IP chính xác
Backend listen 0.0.0.0
port 3000 không bị firewall block
```

Không dùng `localhost`/`127.0.0.1` trên điện thoại thật.

## 401

Kiểm tra:

```text
BYPASS_AUTH_FOR_TESTING = false
SecureStore có accessToken
Authorization header đúng
token chưa hết hạn
```

## 404

Kiểm tra `/api`:

```text
/api/posts
/api/users/me
/api/notifications
```

## Socket không connect

Kiểm tra:

```text
REST:
http://LAN-IP:3000/api

Socket:
http://LAN-IP:3000/notifications
```

và:

```ts
auth: {
  token: accessToken,
}
```

## Socket connect nhưng không nhận event

Kiểm tra:

```text
event = notification:new
JWT đúng user
user đã connect
notification thực sự được tạo trong DB
```

Sau reconnect:

```text
GET /api/notifications
```

---

# 19. Git

Dev A dùng branch riêng:

```bash
git switch -c feature/mobile-week2-3-integration
```

Commit gợi ý:

```bash
git add .
git commit -m "feat: integrate week 2 social APIs"

git add .
git commit -m "feat: integrate likes comments notifications"

git add .
git commit -m "feat: add notification realtime"
```

Không commit:

```text
.env
.env.local
JWT secret
Supabase service-role key
DATABASE_URL
```

---

# 20. Definition of Done

```text
[ ] Auth thật
[ ] Feed thật
[ ] Create Post thật
[ ] Image upload thật
[ ] Profile thật
[ ] Follow thật
[ ] Search thật
[ ] Like thật
[ ] Comment/reply thật
[ ] Notification REST thật
[ ] Notification realtime
[ ] Logout disconnect socket
[ ] Reconnect resync notification
[ ] E2E A/B/C PASS
```

## Kiến trúc tổng thể

```text
                 ┌──────────────────────┐
                 │     Mobile Expo      │
                 │                      │
                 │ Screen               │
                 │   ↓                  │
                 │ Feature Service      │
                 │   ↓                  │
                 │ HTTP Client ──────────────┐
                 │                      │    │
                 │ Notification Socket ─┼────┤
                 └──────────────────────┘    │
                                             │
                    ┌────────────────────────▼──┐
                    │       NestJS Backend      │
                    │                           │
                    │ REST /api                 │
                    │ Socket /notifications     │
                    │                           │
                    │ Posts                     │
                    │ Likes                     │
                    │ Comments                  │
                    │ Follows                   │
                    │ Search                    │
                    │ Notifications             │
                    └──────────────┬────────────┘
                                   │
                    ┌──────────────▼────────────┐
                    │ Prisma + Supabase         │
                    │ PostgreSQL + Storage      │
                    └───────────────────────────┘
```

## Lưu ý về contract

Tài liệu này bám theo Backend Week 2–3 hiện tại của project. Nếu code Mobile cũ có mock hoặc endpoint khác với contract trên, Dev A nên sửa service/mapping phía Mobile theo API thực tế thay vì tự tạo endpoint Backend mới.

Các endpoint không được liệt kê ở đây không nên tự giả định là đã tồn tại.
