# Reels & Recommendation — Đặc tả tính năng và Kế hoạch triển khai (FINAL)

> Ngày lập: 06/10/2026 · Nhánh: `feat/forgot-password-ui` (đã merge `main`, HEAD `b0012de`)
> Nguồn tổng hợp: `Reel_Module_Proposal.pdf`, `4_week_post_video_recommendation_roadmap.docx`, và đọc trực tiếp code `apps/api`, `apps/mobile`.
> Trạng thái: **Đề xuất cuối** — các API/bảng ở đây cần Dev B duyệt trước khi code (RULE.md điều 8, 9).

---

## 0. Kết luận ngắn

Làm được ở mức MVP, trong **~5 tuần / 2 dev**. Giữ nguyên tảng hiện có (NestJS + Prisma + Supabase + Expo), **không thêm nhà cung cấp mới, không transcode, không ML**. Cốt lõi:

1. **Post là content object duy nhất.** Reel = Post có media `VIDEO`. Không có bảng Reel, không ReelLike/ReelComment. Like/comment/notification/follow dùng lại 100%.
2. **Một recommendation engine, hai bề mặt.** `For You` (feed chữ + video) và `Reels` (fullscreen video) là hai lời gọi của cùng `RecommendationService`, khác bộ lọc `hasVideo`. `Following` giữ nguyên.
3. **Topic = đơn vị sở thích.** Hashtag + keyword dictionary → `PostTopic`; hành vi → `UserInterest`.
4. **Video đi thẳng điện thoại → Supabase Storage** bằng signed upload URL, không qua NestJS. Có trường `storageKey` để sau này đổi sang R2 mà không đổi schema.

---

## 1. Đối chiếu hai tài liệu & quyết định cuối

| Chủ đề | Proposal PDF | Roadmap DOCX | **Quyết định cuối** | Lý do |
|---|---|---|---|---|
| Reel lưu ở đâu | `Post.kind` + cột trong PostMedia | Post + PostMedia + VideoAsset | **Post + PostMedia mở rộng**, cờ `Post.reelEligible`. Không có `VideoAsset`, không `kind` | Một khái niệm duy nhất; một Post nhiều video vẫn là 1 Post |
| "Chủ đề" | Hashtag, `UserInterest(hashtag)` | Topic taxonomy + PostTopic + keyword/TF-IDF/embedding | **Topic + PostTopic** (hashtag *và* keyword dictionary đều ra Topic). Bỏ TF-IDF/embedding/LLM khỏi MVP | Roadmap đúng: không phụ thuộc hashtag. Bậc cao để "hướng phát triển" |
| Storage | Supabase signed upload | R2 (khuyến nghị) | **Supabase signed upload ở v1**; trừu tượng hóa qua `storageKey`; R2 là bước nâng cấp nếu vượt hạn mức | Đồ án, ít video demo; thêm R2 = thêm dịch vụ + key + CORS. Đã có `StorageService` |
| Upload | Direct-to-storage | Direct + TUS resumable | **Direct signed URL**, retry thủ công; TUS để stretch | TUS cần client lib mới, rủi ro Expo Go |
| Xử lý video | Không transcode | Metadata, thumbnail, transcode, status | **Client-side**: ép chất lượng/độ dài ở picker, thumbnail sinh ở client. Không worker | Không có hạ tầng worker; không FFmpeg server |
| Recommendation | Chấm điểm 4 thành phần | Candidate → Filter → Rank → Diversity + log | **Gộp**: pipeline 4 bước của Roadmap + công thức/trọng số của PDF, thêm `RecommendationLog` | Roadmap yêu cầu log để báo cáo |
| Feeds | Reels feed | Following + For You song song | **Cả ba**: Following (có sẵn) · For You · Reels | Chứng minh khác biệt social vs personalized |
| Vào Reels | Công tắc trên Home | Surface fullscreen | **Công tắc trên Home, Reels render inline** (không thêm tab, không thêm stack) | `ClayTabBar`/`MainTabNavigator` là tab thuần, `e2e.ps1` bấm tọa độ cố định |
| Cron | Tác vụ định kỳ | Dashboard | **Không cron ở v1**: cập nhật `PostStats` tăng dần khi nhận event | Tránh thêm `@nestjs/schedule` |
| ML ranking | Để sau | LR/LightGBM benchmark | **Ngoài phạm vi** | Cần dữ liệu thật |

---

## 2. Hiện trạng code (đã kiểm tra) ảnh hưởng thiết kế

**Backend (`apps/api`)** — đã có `auth, users, posts, follows, likes, comments, notifications(+Socket.IO), search, storage`.
- `Post(id, authorId, content, deletedAt…)`, `PostMedia(id, postId, url, type String, order)` — `type` là `String` nên thêm `"video"` **không cần đổi kiểu**.
- `PostsService.create` chỉ nhận ảnh: tối đa 4, 5 MB, jpeg/png/webp, `FilesInterceptor('images', 4)`, file đi qua RAM của NestJS rồi `StorageService.upload`. → **Không dùng cho video**.
- `PostsService.getFeed` = bài của mình + người mình follow, `skip/take`, `createdAt desc` → đây chính là **Following feed**, giữ nguyên.
- Route `posts/:id` đứng sau `posts/feed` → route mới (`posts/for-you`) **phải khai báo trước `:id`**.
- `StorageService` dùng `@supabase/supabase-js` service role → có sẵn `createSignedUploadUrl`.
- Thiếu: `Save`, mọi bảng topic/hành vi, `expo-video`.
- Dependencies hiện có đủ; **không có `@nestjs/schedule`** (và ta không cần).

**Mobile (`apps/mobile`)** — *khác với PDF*: mobile **đã nối API thật** (DEC-017: `USE_MOCK_API` ← `EXPO_PUBLIC_USE_MOCK`, mặc định = API thật). Còn lại là local-only: bookmark (`setPostSavedLocally`), like comment. Nhánh đang có thay đổi chưa commit.
- `Post.media[].type: 'IMAGE' | 'VIDEO'` đã khai báo; `postMapper.mapMediaType` đã map `video`.
- `PostCard` chỉ có `SingleImage`/`MediaGrid` → **chưa render VIDEO**.
- `useImagePicker`: `mediaTypes: ['images']`, tối đa 4; `postService` đọc **toàn bộ file vào RAM** (`File.bytes()`) → không hợp video.
- `httpClient`: timeout JSON 8s, upload 30s, tự gắn Bearer, tự xử lý 401.
- `MainTabNavigator` = 5 tab; `RootNavigator` không có stack → **không thêm màn hình stack**.
- `HomeScreen`: `FlatList`, `feedEvents` (`postCreated`, `commentAdded`), `CommentModal` nhận `Post` → tái dùng cho reel.
- `app.json` chỉ có plugin `expo-font`; Expo Go SDK 57 đã bundle `expo-video`.
- Test: Jest ép mock mode; QA script phụ thuộc mock + tọa độ tab. **Mọi thay đổi phải giữ mock mode chạy được.**

---

## 3. Đặc tả tính năng

### 3.1 Phạm vi v1 (MUST)
| # | Tính năng | Chấp nhận khi |
|---|---|---|
| F1 | Đăng video dọc ≤ 60s kèm caption/hashtag từ `Create` | Máy A đăng, máy B thấy; video không đi qua NestJS |
| F2 | Post có nhiều media (ảnh + video) hiển thị đúng trong feed | Carousel ngang trong `PostCard`; video có poster + nút play |
| F3 | Reels fullscreen: vuốt dọc, auto-play, loop, 1 video phát tại 1 thời điểm | Bắt đầu phát ≤ ~1s trên Wi-Fi; không 2 video cùng có tiếng |
| F4 | Like / comment / save / follow ngay trên reel | Dùng đúng API & `CommentModal` hiện có |
| F5 | Ghi hành vi (view, watch ms, complete, skip, like, save, comment…) theo lô | Có dòng `ContentInteraction` với `postId + mediaId` |
| F6 | Topic cho Post (hashtag + keyword) kèm `confidence`, `source` | Giải thích được vì sao Post có topic đó |
| F7 | `UserInterest` cập nhật từ hành vi, có decay, có cold-start | 2 tài khoản khác hành vi → lô kế tiếp khác rõ rệt |
| F8 | **For You** feed (cá nhân hóa) song song **Following** | Hai user cùng DB, For You khác nhau |
| F9 | Reels feed dùng cùng engine (`hasVideo`) | Cùng pipeline, có `reason` mỗi item |
| F10 | "Không quan tâm" + "Vì sao tôi thấy video này" | Ẩn post, trừ điểm topic; hiển thị `reason` |
| F11 | `RecommendationLog` candidate → score → final | Truy vết được 1 request khi demo |

### 3.2 Stretch (chỉ làm khi xong v1)
Slider "Người quen ↔ Khám phá"; multi-video UX (swipe ngang trong reel); tab Reels trên Profile; resumable upload (TUS); TF-IDF cho topic; dashboard debug; chuyển video sang R2.

### 3.3 Ngoài phạm vi
Editor/nhạc/filter, transcode/HLS, remix/duet/live, moderation tự động, ML ranking, embedding/pgvector, LLM classify, tab thứ 6.

### 3.4 Giới hạn video (chốt cứng sau Phase 0)
- Độ dài ≤ **60 giây**; ưu tiên dọc (cạnh cao ≥ cạnh rộng); `reelEligible = dọc && ≤ 60s`. Video ngang vẫn đăng được, chỉ không vào Reels.
- Dung lượng ≤ **min(30 MB, giới hạn bucket thực tế)** — xác nhận ở Phase 0 (snapshot docs nói Free = 50 MB/file, 1 GB tổng; cần kiểm tra lại).
- MIME: `video/mp4`, `video/quicktime`. Tối đa **3 video** + ảnh, tổng media ≤ 6 (UI v1 chỉ cho **1 video**).

---

## 4. Thiết kế dữ liệu (chỉ migration **mới**, additive — không `db push`)

```prisma
model Post {            // + 1 cột
  reelEligible Boolean @default(false)
  // + relations: topics PostTopic[], stats PostStats?, interactions ContentInteraction[], saves Save[]
  @@index([reelEligible, createdAt])
}

model PostMedia {       // + cột, đều nullable/có default -> dữ liệu cũ không vỡ
  storageKey   String?   // trừu tượng provider (Supabase -> R2)
  thumbnailUrl String?
  width        Int?
  height       Int?
  durationMs   Int?
  sizeBytes    Int?
  status       String   @default("READY")   // READY | FAILED (PROCESSING dành cho tương lai)
}

model Save { userId String; postId String; createdAt DateTime @default(now())
  @@id([userId, postId]) @@index([postId]) }

model Topic { id String @id @default(cuid()); slug String @unique; name String
  isCurated Boolean @default(false) }                       // curated = taxonomy 30-100, còn lại = hashtag

model PostTopic { postId String; topicId String; confidence Float; source String  // 'hashtag' | 'keyword'
  @@id([postId, topicId]) @@index([topicId]) }

model UserInterest { userId String; topicId String; score Float; updatedAt DateTime @updatedAt
  @@id([userId, topicId]) @@index([userId, score]) }

model ContentInteraction { id String @id @default(cuid()); userId String; postId String
  mediaId String?; eventType String      // VIEW|COMPLETE|REPLAY|SKIP|LIKE|SAVE|COMMENT|FOLLOW|NOT_INTERESTED
  watchMs Int?; durationMs Int?; surface String  // 'reels'|'foryou'|'following'
  createdAt DateTime @default(now())
  @@index([userId, createdAt]) @@index([postId, createdAt]) }

model PostStats { postId String @id; views Int @default(0); completes Int @default(0)
  skips Int @default(0); watchMsTotal BigInt @default(0); updatedAt DateTime @updatedAt }

model RecommendationLog { id String @id @default(cuid()); requestId String; userId String
  postId String; source String; score Float; components Json; position Int
  createdAt DateTime @default(now()) @@index([requestId]) @@index([userId, createdAt]) }
```
Ghi chú: like/comment count **không** lặp lại trong `PostStats` — tính từ `_count` như `getFeed` đang làm. `NOT_INTERESTED` và "đã xem" suy ra từ `ContentInteraction` (không thêm bảng ẩn). Dữ liệu `Post.reelEligible` tính ở server khi tạo post.

---

## 5. Đặc tả API (đề xuất — chờ Dev B xác nhận)

Giữ nguyên mọi endpoint hiện có. Chỉ **thêm**; response vẫn dạng `{ data, meta }`.

| Endpoint | Mục đích |
|---|---|
| `POST /media/upload-url` `{ kind: 'video'\|'thumbnail'\|'image', mimeType, sizeBytes }` | Validate MIME/size → `createSignedUploadUrl` → `{ storageKey, uploadUrl/token, publicUrl }` |
| `POST /posts/media` `{ content?, media:[{type, storageKey, thumbnailKey?, width, height, durationMs, sizeBytes}] }` | Tạo Post nhiều media (JSON). Server kiểm tra object tồn tại, ép giới hạn, gán `reelEligible`, trích hashtag/topic. **Không đụng `POST /posts` multipart cũ** |
| `GET /posts/for-you?limit=&exclude=` | For You (đặt **trước** `posts/:id`) |
| `GET /reels/feed?limit=&exclude=` | Reels (cùng engine, `hasVideo`) |
| `POST /interactions` `{ events:[…] }` | Nhận lô hành vi (≤ 50 dòng/lần) |
| `POST /posts/:id/not-interested` | Ẩn + trừ điểm topic |
| `POST\|DELETE /posts/:id/save` | Lưu bài (mobile đã gọi sẵn kiểu local) |
| `GET /posts/:id/explain` | Topic + confidence + source + reason (stretch nếu `reason` đã đủ) |

**Phân trang xếp hạng:** *không dùng page/cursor*. Client gửi `exclude=<≤50 id gần nhất>`; server loại thêm các post đã `VIEW/COMPLETE/NOT_INTERESTED` của user trong 7 ngày. Tránh lặp/sót khi thứ hạng thay đổi.

**Item trả về:** như `Post` hiện có (+ `media[]` mở rộng, `viewsCount`, `isSaved`) + `reason: { code, text }` (`FOLLOWING` | `TOPIC` | `TRENDING` | `FRESH` | `EXPLORE`).

Response `media[]` mới: `{ id, order, type, url, thumbnailUrl, width, height, durationMs }`. `postMapper` cần map thêm các trường (ưu tiên optional để mock cũ không vỡ).

---

## 6. Recommendation engine

```
events -> UserInterest -> [1 Candidates] -> [2 Filter] -> [3 Rank] -> [4 Diversity] -> response + RecommendationLog
```

**1. Candidate (≈ 200, gộp & dedupe, ghi `source`):** `following` (post mới của người follow) · `topic` (post có topic thuộc top-N của user) · `trending` (PostStats 48h, completion cao) · `fresh` (post mới ít view; đảm bảo ~50 lượt đầu) · `creator` (tác giả mình từng like/comment). `hasVideo` lọc ở bước này cho Reels.

**2. Filter:** `deletedAt != null`, của chính mình, `NOT_INTERESTED`, đã xem 7 ngày / nằm trong `exclude`, media chưa READY, (Reels) `!reelEligible`.

**3. Rank:** `score = 0.30·topic + 0.25·quality + 0.25·social + 0.20·freshness` (khởi điểm của PDF, **đặt trong file config**, không hard-code):
- `topic`: Σ(`UserInterest.score`·`confidence`) chuẩn hóa 0–1. Người mới → 0.
- `quality`: (completes + k·prior)/(views + k) làm mượt Bayes, kết hợp like/comment rate.
- `social`: đang follow tác giả; từng like/comment tác giả.
- `freshness`: `0.5^(giờ/48)`.

**4. Diversity:** không 2 item liền cùng tác giả; ≤ 3 liền cùng topic chính; 1–2/10 là `explore`.

**Interest update** (điểm khởi điểm, có decay): COMPLETE(≥90%) +3 · REPLAY +4 · LIKE +4 · COMMENT +5 · SAVE +5 · FOLLOW +8 · SKIP(<2s) −2 · NOT_INTERESTED −10. Decay theo `updatedAt` (nhân hệ số khi đọc, không cần cron).

**Topic classifier v1:** chuẩn hóa text bỏ dấu, ① hashtag → Topic (`source='hashtag'`, confidence 1.0) ② keyword dictionary cho taxonomy 30–100 topic (`source='keyword'`, confidence theo số từ khớp). Dictionary là file TS (dễ giải thích khi báo cáo).

---

## 7. Thiết kế mobile

Cấu trúc (theo mẫu feature hiện có):
```
src/features/reel/
  screens/ReelsFeed.tsx            // pane inline, FlatList pagingEnabled, onViewableItemsChanged, windowSize≈3
  components/ReelPlayer.tsx        // expo-video; chỉ item active phát; tự release item đã lướt
  components/ReelOverlay.tsx       // author, caption, like/comment/save/follow, "vì sao thấy"
  hooks/useReelViewTracker.ts      // đo watchMs, gom lô, flush mỗi N video / AppState background
  hooks/useVideoPicker.ts          // chọn + validate độ dài/dung lượng
  services/reelService.ts          // cờ USE_MOCK_API như service khác
  services/uploadService.ts        // upload-url -> PUT trực tiếp -> create
  types.ts, mockData.ts
```
- **Vào Reels:** `HomeScreen` header thêm segmented `Following · For You · Reels`. Item cao = chiều cao pane đo bằng `onLayout` (không dùng `Dimensions` ⇒ tab bar vẫn còn, QA script không vỡ).
- **Mở video từ feed:** tap video trong `PostCard` ⇒ `HomeScreen` đổi sang pane Reels tại `postId` đó (state nội bộ, không navigation mới) ⇒ *không duplicate content*.
- **`PostCard`:** thêm `VideoPoster` (thumbnail + play badge + duration) và carousel ngang khi `media.length > 1` hoặc có video. Feed **không auto-play** (chỉ poster) để tránh nặng.
- **Create:** thêm nút "Video" cạnh "Photo"; chọn video → validate → upload có progress → `POST /posts/media`. Giữ nhánh ảnh cũ (multipart) khi chỉ có ảnh.
- **Upload:** **không** dùng `File.bytes()` (nạp cả file vào RAM). Spike Phase 0 chốt cách stream: `fetch(uploadUrl, { method:'PUT', body: file })` với `File` của `expo-file-system`, hoặc API upload của expo-file-system SDK 57.
- **Dependencies mới (cần duyệt, RULE 5):** `expo-video` (bắt buộc). Thumbnail dùng API của `expo-video` hoặc frame đầu — chốt ở Phase 0; **không** thêm lib khác nếu tránh được.
- **Mock mode:** `reelService`/`uploadService` có nhánh mock; video mẫu là URL công khai nhỏ hoặc asset cục bộ; Jest/QA chạy không cần backend.

---

## 8. Workflow triển khai (làm lần lượt; mỗi phase có "gate")

> Quy ước chung mọi phase: đọc `RULE.md` → kiểm tra code hiện có → làm → `tsc --noEmit` + `jest` xanh → ghi `docs/change.md` (append) → ADR vào `docs/decisions.md` nếu ảnh hưởng người khác. Migration **chỉ** bằng `prisma migrate`, không `db push`. Mock mode phải luôn chạy.

### Phase 0 — Spike kỹ thuật (2–3 ngày) · *loại rủi ro lớn nhất*
**Mobile:** màn hình thử `expo-video` 5 video mẫu, vuốt dọc, auto-play — chạy trên **BlueStacks + 1 điện thoại Android thật**. Thử chọn video bằng `expo-image-picker` (`mediaTypes:['videos']`, `videoMaxDuration`, `videoQuality`), đọc `duration/width/height/fileSize`. Thử PUT file ~20 MB tới signed URL, đo RAM & thời gian.
**Backend:** tạo bucket/policy cho video; thử `createSignedUploadUrl`; xác nhận **giới hạn file thực tế** và dung lượng còn lại; kiểm tra `getPublicUrl` phát được.
**Gate:** (a) phát mượt + chuyển video không có tiếng chồng; (b) upload ≥ 20 MB thành công không crash RAM; (c) chốt `MAX_SIZE`, độ dài, cách làm thumbnail. **Nếu (a) fail trên Expo Go → dùng thiết bị thật/dev build; nếu (b) fail → hạ giới hạn hoặc chuyển R2.** Ghi kết quả vào `docs/decisions.md`.

### Phase 1 — Nền dữ liệu & media (≈ 1 tuần)
**Dev B:** migration #1 (`Post.reelEligible`, cột `PostMedia`, `Save`, `Topic`, `PostTopic`) · `POST /media/upload-url` · `POST /posts/media` (validate, `reelEligible`, trích hashtag→Topic) · `POST|DELETE /posts/:id/save` · mở rộng select `media` + `viewsCount`/`isSaved` ở `getFeed/findOne/users/:id/posts` (giữ tương thích). Seed taxonomy.
**Dev A:** commit/ổn định phần tích hợp API thật đang dở trên nhánh; mở rộng `types.ts`/`postMapper` (field media mới, optional); `PostCard` render `VideoPoster` + carousel; thay `setPostSavedLocally` bằng API save; khai báo type & `reelService` mock.
**Gate:** ảnh cũ vẫn đăng/đọc bình thường; post có video (tạo bằng script/curl) hiện poster trong feed; hợp đồng API được Dev B xác nhận bằng văn bản.

### Phase 2 — Đăng video (≈ 1 tuần)
**Dev A:** `useVideoPicker` (validate) · `uploadService` (xin URL → PUT → progress → create) · cập nhật `CreateScreen` (nút Video, preview, progress, hủy/retry, lỗi rõ ràng).
**Dev B:** cleanup object khi tạo post thất bại (như `PostsService.create` đang làm); xóa storage khi post bị xóa; log lỗi upload.
**Gate:** máy A đăng 1 reel (vertical ≤ 60s); máy B thấy trong Following feed và mở/phát được; vi phạm giới hạn bị chặn cả client và server.

### Phase 3 — Luồng xem Reels (≈ 1 tuần)
**Dev A:** `ReelsFeed`, `ReelPlayer`, `ReelOverlay`; segmented trên `HomeScreen`; tap-video-từ-feed → Reels tại post; preload item kế, release item cũ; like/save/follow/comment (tái dùng `feedService`, `followApi`, `CommentModal`); trạng thái loading/empty/error/offline.
**Dev B:** `GET /reels/feed` **bản đơn giản** (reelEligible, mới nhất, `exclude`) để Dev A làm UI với dữ liệu thật.
**Gate:** vuốt mượt (dữ liệu mock rồi thật); chỉ 1 video phát; quay lại tab khác thì dừng; không rò RAM sau ~30 lượt vuốt.

### Phase 4 — Hành vi & Topic & Interest (≈ 1 tuần)
**Dev B:** migration #2 (`ContentInteraction`, `PostStats`, `UserInterest`, `RecommendationLog`) · `POST /interactions` (validate, batch insert, tăng `PostStats`, cập nhật `UserInterest` + decay trong transaction) · keyword classifier + dictionary · `POST /posts/:id/not-interested`. Script **seed dữ liệu mẫu** (vài chục user, vài trăm hành vi theo nhóm sở thích rõ).
**Dev A:** `useReelViewTracker` (watchMs, complete ≥ 90%, replay, skip < 2s; flush theo lô + khi app background); phát event like/save/comment/follow từ reel; nút "Không quan tâm".
**Gate:** bảng `ContentInteraction` có đủ `postId+mediaId+watchMs`; `UserInterest` đổi sau một phiên xem; giải thích được topic của 1 post (confidence/source).

### Phase 5 — Recommendation core: For You + Reels (≈ 1–1.5 tuần)
**Dev B:** `RecommendationService` (Candidate → Filter → Rank → Diversity), config trọng số, ghi `RecommendationLog`, `GET /posts/for-you` (đặt trước `:id`) và nâng `GET /reels/feed` dùng engine; trả `reason`.
**Dev A:** segmented `For You`; "Vì sao tôi thấy video này" (hiển thị `reason`); (stretch) slider Người quen↔Khám phá.
**Gate (nghiệm thu chính):** tạo 2 tài khoản, một xem hết `#nauan`, một xem hết `#bongda`; sau ~20 video, lô kế tiếp mỗi bên có đa số đúng chủ đề; cùng DB nhưng For You khác nhau; truy vết 1 request trong `RecommendationLog`; Following vẫn là chronological.

### Phase 6 — Hoàn thiện & Demo (3–5 ngày)
Trạng thái rỗng/lỗi/mất mạng; chỉ mục & đo thời gian phản hồi feed (mục tiêu < 500 ms với dữ liệu seed); test Jest cho mapper/tracker/ranker; script QA Reels (giữ nguyên tab nên không phá `e2e.ps1`); kịch bản demo 5–7 phút (đăng → xem → hành vi → feed đổi → vì sao thấy → log).

### Thứ tự cắt khi trễ
Cắt trước: slider khám phá → "Vì sao thấy" → `explain` → source `creator` → carousel ngang trong Reels → preload nâng cao. **Không được cắt:** event tracking, Topic/PostTopic, UserInterest, Candidate/Filter/Rank/Diversity, For You cá nhân hóa, upload trực tiếp.

---

## 9. Rủi ro & giảm thiểu

| Rủi ro | Giảm thiểu |
|---|---|
| `expo-video` giật/không chạy trên Expo Go/BlueStacks | Phase 0; có máy Android thật; fallback dev build |
| Video quá nặng / vượt hạn mức Supabase | Giới hạn 60s & ≤30 MB; `videoQuality` ở picker; bộ video mẫu nhỏ; `storageKey` để chuyển R2 |
| Đọc file vào RAM khi upload | Stream qua `File`/PUT, không `bytes()`; đo ở Phase 0 |
| Schema/route đụng phần đang chạy | Chỉ additive migration; `posts/for-you` trước `:id`; không sửa `POST /posts` cũ |
| Không có dữ liệu thật → For You trông ngẫu nhiên | Script seed theo nhóm sở thích; cold-start nghiêng trending/fresh |
| Bảng event phình | Tăng dần `PostStats`; ranker đọc stats, không đếm event; index `(userId, createdAt)` |
| Phá QA script / mock mode | Không thêm tab/stack; mọi service có nhánh mock; chạy `jest` + `verify-ui` mỗi phase |
| Pricing/hạn mức đổi | Số liệu trong 2 tài liệu là snapshot 03/10/2026 — kiểm tra lại ở Phase 0 |

---

## 10. Việc cần hai dev chốt trước Phase 0

1. Duyệt toàn bộ bảng/endpoint ở mục 4–5 (Dev B), kể cả việc thêm `POST /posts/media` song song `POST /posts`.
2. Duyệt thêm dependency `expo-video` (RULE điều 5).
3. Commit/chốt nhánh tích hợp API thật hiện đang chưa commit trước khi bắt đầu Phase 1.
4. Chọn điểm nhấn demo: *Reel gắn với cuộc trò chuyện* + *gợi ý minh bạch* (đề xuất giữ).
5. Taxonomy topic (30–100) và domain demo (ví dụ nấu ăn, bóng đá, lập trình, du lịch…).
