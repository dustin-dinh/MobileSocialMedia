# Agent Guide — Tách FollowModule + Notification Integration (Day 5)

## Mục tiêu

1. Tách toàn bộ Follow logic khỏi `UsersModule/UsersService` thành `FollowsModule`.
2. Giữ nguyên schema `Follow`; không tạo migration chỉ vì refactor.
3. Tích hợp Notification vào Like, Comment và Follow.
4. Không tạo notification cho self-action.
5. Không tạo duplicate notification khi Follow lặp lại hoặc Like đã tồn tại.
6. Không tự ý thay đổi API contract ngoài phạm vi cần thiết.

## 1. Nguyên tắc bắt buộc

- Không `prisma db push`.
- Không reset DB.
- Không sửa migration đã apply.
- Không xóa/revert uncommitted changes.
- Sau mỗi milestone chạy:
  - `pnpm typecheck`
  - `pnpm build`
- Nếu schema thật sự cần thay đổi, dừng và báo rõ trước khi tạo migration.

## 2. Follow hiện tại

Các endpoint phải được giữ nguyên:

```text
POST   /api/users/:id/follow
DELETE /api/users/:id/follow
GET    /api/users/:id/followers?page=1&limit=20
GET    /api/users/:id/following?page=1&limit=20
```

Logic cần giữ:

- Không tự follow chính mình.
- Target user phải tồn tại.
- Follow idempotent.
- Unfollow không lỗi nếu chưa follow.
- Followers/following chỉ trả public user fields.
- Pagination giữ nguyên.
- Không expose password/passwordHash.

## 3. Tạo FollowsModule

Tạo:

```text
src/modules/follows/
├── follows.module.ts
├── follows.controller.ts
└── follows.service.ts
```

Khuyến nghị dùng tên folder `follows`.

## 4. Move logic khỏi UsersModule

Tìm các method Follow hiện có trong `UsersService`:

```text
follow
unfollow
followers
following
```

Move nguyên logic sang `FollowsService`.

Sau khi move:

- Xóa Follow methods khỏi `UsersService`.
- Xóa Follow routes khỏi `UsersController`.
- Không giữ bản copy cũ.

`UsersModule` chỉ còn user/profile-related logic.

## 5. FollowsController

Khuyến nghị:

```ts
@Controller('users')
export class FollowsController {
```

Routes:

```text
POST   /users/:id/follow
DELETE /users/:id/follow
GET    /users/:id/followers
GET    /users/:id/following
```

Các route Follow phải có:

```ts
@UseGuards(JwtAuthGuard)
```

Ví dụ:

```ts
@Post(':id/follow')
async follow(
  @Request() request: { user: { userId: string } },
  @Param('id') targetUserId: string,
) {
  return this.followsService.follow(
    request.user.userId,
    targetUserId,
  );
}
```

Phải phân biệt:

```text
currentUserId = request.user.userId
targetUserId  = :id
```

Không để route đọc `request.user.userId` mà thiếu guard.

## 6. FollowsService

Service chịu trách nhiệm:

```text
follow()
unfollow()
getFollowers()
getFollowing()
```

Nếu logic chỉ cần query User/Follow, ưu tiên dùng `PrismaService` trực tiếp để tránh circular dependency với `UsersModule`.

Không tạo circular dependency không cần thiết.

## 7. AppModule và duplicate routes

Thêm:

```ts
import { FollowsModule } from './modules/follows/follows.module';
```

vào `AppModule`.

Kiểm tra toàn project:

- Không còn Follow controller ở UsersController.
- Không có route Follow duplicate.
- `FollowsModule` là owner duy nhất của Follow API.

## 8. Notification integration — Like

Sau khi refactor Follow xong, tích hợp Notification vào `LikesService`.

Flow:

```text
POST /posts/:id/like
        ↓
validate post
        ↓
create/upsert Like
        ↓
if actor != post.author
        ↓
create Notification(type = LIKE)
```

Post query phải lấy `authorId`.

Sau khi Like thành công:

```ts
await this.notificationsService.createLikeNotification(
  userId,
  postId,
  post.authorId,
);
```

`NotificationsService` vẫn phải tự bảo vệ:

```ts
if (actorId === recipientId) {
  return;
}
```

Không làm thay đổi idempotent behavior của Like.

## 9. Notification integration — Comment

### Root comment

Flow:

```text
POST /posts/:id/comments
        ↓
validate post
        ↓
create Comment
        ↓
recipient = post.authorId
        ↓
create COMMENT notification
```

Sau khi tạo comment:

```ts
await this.notificationsService.createCommentNotification(
  userId,
  postId,
  comment.id,
  post.authorId,
);
```

Không tạo notification nếu actor chính là post author.

### Reply

Với:

```text
POST /comments/:id/replies
```

Service phải lấy từ parent comment:

```text
parent.userId
parent.postId
```

Không hardcode `postId`.

Recipient của reply là owner của parent comment nếu khác actor.

Nếu requirement hiện tại không hỗ trợ notification riêng cho reply, không mở rộng notification graph ngoài scope; báo rõ trong summary.

## 10. Notification integration — Follow

Trong `FollowsService.follow()`:

```text
POST /users/:id/follow
        ↓
validate target
        ↓
check existing Follow
        ↓
create Follow nếu chưa tồn tại
        ↓
chỉ khi Follow mới được tạo
        ↓
create FOLLOW notification
```

Gọi:

```ts
await this.notificationsService.createFollowNotification(
  followerId,
  targetUserId,
);
```

Self-follow vốn đã bị reject, nhưng NotificationService vẫn phải giữ self-action protection.

### Quan trọng: không duplicate notification

Expected:

```text
First follow:
Follow created
Notification created

Second follow:
Follow already exists
No new notification
```

Không gọi notification creation nếu relationship đã tồn tại.

## 11. NotificationsModule

NotificationService phải hỗ trợ:

```text
createLikeNotification()
createCommentNotification()
createFollowNotification()
findMyNotifications()
markAsRead()
markAllAsRead()
```

Types:

```text
LIKE
COMMENT
FOLLOW
```

`NotificationsModule` phải export service:

```ts
@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
```

`LikesModule`, `CommentsModule`, `FollowsModule` import `NotificationsModule`.

Không import ngược interaction modules vào NotificationsModule.

## 12. API notification

Giữ:

```text
GET    /api/notifications?page=1&limit=20
PATCH  /api/notifications/:id/read
PATCH  /api/notifications/read-all
```

Tất cả protected bằng `JwtAuthGuard`.

Nếu có route:

```text
PATCH /notifications/read-all
```

đặt trước:

```text
PATCH /notifications/:id/read
```

để tránh `:id = read-all`.

## 13. E2E test bắt buộc

Dùng User A và User B.

### Follow

A follow B:

```text
POST /users/B/follow
```

B nhận:

```text
FOLLOW from A
```

A follow B lần 2:

```text
POST /users/B/follow
```

Không tạo notification mới.

### Like

A like post của B:

```text
POST /posts/:id/like
```

B nhận:

```text
LIKE from A
```

A like lại khi Like đã tồn tại:

- Không tạo duplicate Like.
- Không tạo duplicate notification.

### Comment

A comment post của B:

```text
POST /posts/:id/comments
```

B nhận:

```text
COMMENT from A
```

### Self-action

B like chính post của B:

```text
POST /posts/B-post/like
```

Expected:

```text
Like exists
No notification for B
```

## 14. Validation checklist

Chạy:

```bash
pnpm typecheck
pnpm build
```

Sau đó Postman:

```text
[ ] Follow
[ ] Unfollow
[ ] Followers
[ ] Following

[ ] Like
[ ] Unlike

[ ] Comment
[ ] Reply

[ ] Notification list
[ ] Mark one read
[ ] Mark all read

[ ] Follow creates notification
[ ] Like creates notification
[ ] Comment creates notification

[ ] Self-action does not create notification
[ ] Repeated follow does not create duplicate notification
[ ] Repeated like does not create duplicate Like notification
```

## 15. Expected architecture

```text
src/modules/

auth/
users/
posts/
likes/
comments/
follows/
notifications/
storage/
search/
```

Responsibilities:

```text
UsersModule
 └── User/Profile

PostsModule
 └── Post/Feed

LikesModule
 └── Like/Unlike

CommentsModule
 └── Comment/Reply

FollowsModule
 └── Follow/Unfollow/Followers/Following

SearchModule
 └── User Search

NotificationsModule
 └── Notification lifecycle
```

Interaction flow:

```text
             ┌───────────────┐
             │ Notifications │
             └───────▲───────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
      Likes       Comments      Follows
        │            │            │
        └────────────┴────────────┘
```

## 16. Completion criteria

Chỉ báo DONE khi:

1. Follow logic đã được move hoàn toàn khỏi UsersService/UsersController.
2. FollowsModule hoạt động.
3. Follow routes không duplicate.
4. Follow routes có JwtAuthGuard.
5. Notification integration hoàn tất cho Like/Comment/Follow.
6. Self-action không tạo notification.
7. Repeated Follow không tạo notification duplicate.
8. `pnpm typecheck` pass.
9. `pnpm build` pass.
10. Postman E2E pass.

Cuối task trả summary:

```text
Changed files:
- ...

Follow refactor:
- ...

Notification integration:
- ...

Tests:
- pnpm typecheck: PASS/FAIL
- pnpm build: PASS/FAIL
- Postman: PASS/FAIL

Known issues:
- ...
```

Không tự ý tiếp tục sang Day 6/realtime.
