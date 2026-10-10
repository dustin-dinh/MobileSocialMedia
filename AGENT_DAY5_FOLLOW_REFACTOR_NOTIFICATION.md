# Ngữ cảnh AI — Backend API và Follow/Notification (Day 5)

> Tài liệu này mô tả trạng thái source hiện có trong `apps/api` và đối chiếu với mục tiêu Day 5 bên dưới. Các mục checklist gốc vẫn là hợp đồng hành vi/điều kiện nghiệm thu; chúng không có nghĩa là phải tạo lại những phần source đã có.

## Phạm vi và cách đọc

- Phạm vi khảo sát: `apps/api` (NestJS backend). Không mô tả `apps/mobile`.
- Mã nguồn là bằng chứng về phần đã implement; file Postman, kết quả chạy app, database dùng chung và thao tác thủ công không được suy ra chỉ từ source.
- Nếu tiếp tục công việc Day 5, đọc phần **Kiến trúc API hiện tại**, **Đối chiếu Day 5**, rồi mới đọc các điều kiện nghiệm thu còn lại.
- Không đọc/ghi hoặc đưa giá trị bí mật từ `apps/api/.env` vào tài liệu hay câu trả lời. Không dùng `prisma db push`, reset DB, hoặc sửa migration đã áp dụng.
- Những file generated Prisma và `node_modules` là output/phụ thuộc, không phải nơi sửa model hoặc nghiệp vụ.

## Kiến trúc API hiện tại

### Runtime và wiring chung

- `src/main.ts`: khởi tạo Nest application, đặt global prefix `api`, bật `ValidationPipe` với `transform`, `whitelist`, `forbidNonWhitelisted`; port lấy từ `PORT`, mặc định `3000`; lắng nghe trên `0.0.0.0`.
- `src/app.module.ts`: nạp global `ConfigModule` và các module Prisma, Users, Posts, Auth, Likes, Comments, Search, Notifications, Follows. Module tính năng được gắn ở đây để route được đăng ký.
- `src/prisma/prisma.module.ts` cung cấp `PrismaService` toàn cục. `src/prisma/prisma.service.ts` dùng Prisma Client với PostgreSQL adapter (`PrismaPg`), đọc `DATABASE_URL`, connect/disconnect theo lifecycle của Nest.
- `prisma.config.ts` dùng `DIRECT_URL` cho Prisma CLI. Runtime và Prisma CLI vì vậy có hai mục đích connection string riêng.
- DTO dùng `class-validator`/`class-transformer`; global validation pipe tự chuyển query số và từ chối field ngoài DTO.

### Cấu trúc source theo module

| Thành phần | Trách nhiệm và hành vi đang có |
|---|---|
| `src/modules/auth/` | Đăng ký, đăng nhập, logout. `AuthService` chuẩn hóa email, kiểm tra email/username trùng, hash/compare password bằng bcrypt và phát JWT. `JwtStrategy` lấy bearer token, kiểm tra chữ ký/hạn dùng và ánh xạ `sub` thành `request.user.userId`. Register/login public; logout cần JWT nhưng hiện chỉ trả `204`, không có server-side token revocation. |
| `src/modules/users/` | Hồ sơ user và bài viết của user. `GET /users/me` cần JWT; `GET /users/:id` trả profile public; `GET /users/:id/posts` cần JWT, phân trang bài chưa xóa, media, counts và `isLiked` theo viewer. Follow không còn nằm trong `UsersController`/`UsersService`. |
| `src/modules/follows/` | Chủ sở hữu duy nhất của API follow. Controller đặt dưới `/users`, có `JwtAuthGuard` trên toàn controller. Service tự follow bị từ chối; target phải tồn tại; tạo quan hệ bằng `createMany(skipDuplicates)`; chỉ phát notification nếu tạo quan hệ mới. Unfollow dùng `deleteMany` nên lặp lại vẫn trả trạng thái unfollowed. Followers/following phân trang và chỉ chọn public fields `id`, `username`, `displayName`, `avatarUrl`. |
| `src/modules/posts/` | Tạo post text/image, đọc post, feed. `PostsController` yêu cầu JWT; hỗ trợ tối đa 4 ảnh. Service validate loại JPEG/PNG/WebP và giới hạn 5 MiB mỗi file, upload lên Storage rồi lưu public URL và metadata media trong DB. Nếu ghi post thất bại, cố gắng xóa file đã upload. Feed gồm bài của mình và người mình follow, loại bài soft-deleted, sort mới nhất và trả `likeCount`, `commentsCount`, `isLiked`. |
| `src/modules/storage/` | Adapter Supabase Storage dùng `SUPABASE_URL`, service role key và tên bucket từ config. Upload không overwrite; trả public URL; remove lỗi được báo thành `InternalServerErrorException`. `StorageModule` export service cho Posts. |
| `src/modules/likes/` | Like/unlike post dưới `/posts/:id/like`, có JWT. Chỉ post còn hoạt động mới được like/unlike. Like dùng `createMany(skipDuplicates)`; notification chỉ phát khi row Like mới được tạo. Unlike xóa quan hệ bằng `deleteMany`. |
| `src/modules/comments/` | Tạo/list comment gốc, list replies, tạo reply, xóa comment dưới các route `/posts/:id/comments` và `/comments/:id/...`; controller yêu cầu JWT. Service kiểm tra post/comment cha, trim nội dung, phân trang, kiểm tra chủ sở hữu trước khi xóa. Cả comment gốc và reply đều gọi tạo COMMENT notification; reply lấy `postId` và recipient từ parent comment. |
| `src/modules/search/` | Tìm user theo username hoặc display name không phân biệt hoa thường; sort username, trả public fields và pagination. Route `/users/search` cần JWT. |
| `src/modules/notifications/` | Tạo LIKE/COMMENT/FOLLOW notification, list notification của recipient, đánh dấu một hoặc tất cả đã đọc. Controller bảo vệ toàn bộ route bằng JWT. Service list chỉ trả actor/post/comment fields cần thiết, tổng số và `unreadCount`; mark-one chỉ cho recipient đọc notification đó. Module export `NotificationsService` để Likes, Comments và Follows gọi vào; không phụ thuộc ngược các module interaction. |

### Route đang được khai báo

Global prefix khiến các route bên dưới được gọi với `/api` đứng trước.

| Route | Quyền truy cập | Ý nghĩa |
|---|---|---|
| `POST /auth/register`, `POST /auth/login` | Public | Tạo tài khoản, đăng nhập và nhận access token. |
| `POST /auth/logout` | JWT | Logout placeholder, trả `204`; không revoke JWT hiện tại. |
| `GET /users/me` | JWT | Profile của user hiện tại. |
| `GET /users/:id` | Public | Profile công khai. |
| `GET /users/:id/posts` | JWT | Bài viết của một user, tính `isLiked` theo viewer. |
| `POST /users/:id/follow`, `DELETE /users/:id/follow` | JWT | Follow/unfollow user có id trong URL. |
| `GET /users/:id/followers`, `GET /users/:id/following` | JWT | Danh sách follower/following của user. |
| `GET /users/search?q=...` | JWT | Tìm kiếm user. |
| `POST /posts` | JWT | Tạo bài viết, multipart field `images` (tối đa 4) và nội dung DTO. |
| `GET /posts/feed`, `GET /posts/:id` | JWT | Feed và chi tiết post. |
| `POST /posts/:id/like`, `DELETE /posts/:id/like` | JWT | Like/unlike. |
| `POST /posts/:id/comments`, `GET /posts/:id/comments` | JWT | Tạo/list comment gốc. |
| `POST /comments/:id/replies`, `GET /comments/:id/replies`, `DELETE /comments/:id` | JWT | Tạo/list reply và xóa comment do mình tạo. |
| `GET /notifications` | JWT | Danh sách notification của user hiện tại. |
| `PATCH /notifications/read-all`, `PATCH /notifications/:id/read` | JWT | Đánh dấu đã đọc tất cả hoặc một notification. |

### Dữ liệu và quan hệ

`prisma/schema.prisma` định nghĩa PostgreSQL models:

- `User`: tài khoản/profile; username và email unique; quan hệ tới post, follow hai chiều, like, comment, notification gửi/nhận.
- `Post`: tác giả, nội dung tùy chọn, timestamps và `deletedAt` cho soft delete; có media, likes, comments và notifications.
- `PostMedia`: URL, loại media và thứ tự hiển thị, thuộc một post.
- `Follow`: khóa chính ghép `(followerId, followingId)`, timestamps; khóa ghép là cơ sở để bỏ qua follow trùng.
- `Like`: khóa chính ghép `(userId, postId)`, chống Like trùng.
- `Comment`: nội dung, user, post và `parentId` tùy chọn; self-relation hỗ trợ reply. Route nhận một comment id làm parent và source hiện chưa thể hiện giới hạn độ sâu reply.
- `Notification`: `type`, `recipientId`, `actorId`, `readAt`, cùng `postId`/`commentId` tùy chọn; index hỗ trợ list/unread theo recipient.

Trong `prisma/migrations/` hiện có migration khởi tạo user, social core, thay đổi PostMedia, Like, Comment và Notification. Có migration file không chứng minh migration đã được áp dụng ở database đang chạy; cần kiểm tra trạng thái DB bằng quy trình được phép nếu công việc cần xác nhận.

### DTO và response conventions

- `FeedQueryDto`: `page` mặc định `1`, `limit` mặc định `10`, giới hạn `1..50`; đang được Posts và Follows dùng.
- `CommentsQueryDto` và `NotificationsQueryDto`: `page` mặc định `1`, `limit` mặc định `20`, giới hạn `1..50`.
- `UserSearchQueryDto`: `q` bắt buộc; `page` mặc định `1`, `limit` mặc định `20`, tối đa `50`.
- Hầu hết collection trả `{ data, meta: { page, limit, total, totalPages } }`; notification list bổ sung `unreadCount`.
- Auth/interaction endpoints dùng các response `data` theo từng thao tác. Không chọn `passwordHash` trong public profile/list response.

## Đối chiếu với mục tiêu Day 5

| Yêu cầu | Trạng thái theo source hiện có | Bằng chứng / ghi chú |
|---|---|---|
| Tách Follow khỏi Users và tạo FollowsModule | **Đã làm** | `follows.controller.ts`, `follows.service.ts`, `follows.module.ts` tồn tại; controller/service Users chỉ còn profile/user posts. |
| Giữ endpoints Follow và bảo vệ bằng JWT | **Đã làm** | Follows controller giữ `POST/DELETE /users/:id/follow`, `GET /users/:id/followers`, `GET /users/:id/following`; guard ở cấp controller. |
| Không self-follow; target phải tồn tại | **Đã làm** | FollowsService trả 400 khi id trùng và 404 khi target không có. |
| Follow idempotent, không tạo notification lặp | **Đã làm trong source** | Composite key + `createMany(skipDuplicates)`; chỉ gọi notifier khi `created.count > 0`. |
| Unfollow idempotent; danh sách chỉ trả public fields | **Đã làm** | `deleteMany`; follower/following query chọn đúng public fields và trả pagination metadata. |
| FollowsModule được đăng ký; không duplicate route ở Users | **Đã làm** | `FollowsModule` có trong AppModule; UsersController không khai báo route Follow. |
| NotificationsModule export service; interaction modules import đúng chiều | **Đã làm** | Module export `NotificationsService`; Likes/Comments/Follows import NotificationsModule; NotificationsModule không import ngược. |
| Like tạo LIKE notification, self-action không thông báo, Like lặp không duplicate | **Đã làm trong source** | Like query lấy `authorId`; `createMany(skipDuplicates)` và chỉ notify khi tạo mới; NotificationsService chặn actor = recipient. |
| Comment/reply tạo COMMENT notification; self-action được chặn | **Đã làm trong source** | Comment gốc gửi post author; reply lấy `parent.postId` và `parent.userId`; NotificationsService chặn self-action. |
| List/mark-one/mark-all notification | **Đã làm trong source** | Ba route có JWT; mark-one kiểm tra notification thuộc recipient; mark-all chỉ cập nhật unread của user đó. |
| E2E/Postman xác nhận các luồng A/B và các tình huống lặp | **Chưa xác minh** | Không có kết quả chạy Postman/E2E trong source. Chưa được xem là pass. |
| `pnpm typecheck` và `pnpm build` | **Chưa xác minh trong lần khảo sát này** | Chưa chạy lệnh validation; chạy theo hướng dẫn trước khi kết luận DONE. |

### Điểm cần làm rõ trước khi sửa tiếp

1. Day 5 guide minh họa query list Follow là `page=1&limit=20`, trong khi FollowsController dùng `FeedQueryDto`, DTO này mặc định `limit=10` (cho phép client truyền tới `50`). Nếu `20` là default contract bắt buộc chứ không phải ví dụ request, cần thống nhất rồi đổi DTO/cách dùng một cách có chủ đích; không tự ý thay đổi API contract.
2. `apps/api/README.md` còn nói chưa có migration được tạo/applied, trong khi workspace hiện có các migration SQL, bao gồm Like, Comment và Notification. Source chỉ xác nhận file migration tồn tại, không xác nhận trạng thái áp dụng thực tế trên Supabase; README có thể đã cũ.
3. Tại thời điểm khảo sát, worktree đã có thay đổi chưa commit ở `apps/api/src/modules/posts/posts.service.ts` (import `Multer`). Không gộp, hoàn tác hoặc suy diễn thay đổi này thành phần của Day 5; giữ nguyên khi làm việc tiếp.

## Trạng thái kiểm chứng và việc còn lại

- **Hoàn thành theo source:** module separation, API wiring, guards, logic Follow idempotent, integrations Like/Comment/Follow -> Notification, self-action protection, notification read/list.
- **Còn thiếu bằng chứng nghiệm thu:** chạy typecheck/build; kiểm thử thực tế các route bằng Postman hoặc E2E; kiểm tra duplicate notification qua thao tác lặp; xác nhận môi trường DB đã áp dụng các migration liên quan nếu cần kiểm thử tích hợp.
- Danh sách file test theo tên `*.spec.*`/`*.test.*` không tìm thấy trong `apps/api` khi bỏ qua `node_modules`, generated Prisma và `dist`. Điều đó chỉ cho biết chưa thấy test file theo quy ước tên này, không chứng minh không có kiểm thử thủ công ở nơi khác.
- Chỉ đánh dấu Day 5 hoàn tất sau khi có kết quả validation và E2E; không tự mở rộng sang realtime/Day 6.

---

## Mục tiêu Day 5 và điều kiện nghiệm thu

### Mục tiêu

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
