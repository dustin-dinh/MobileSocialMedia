# UI Audit - Bản đồ giao diện Mobile Social Media (Claymorphism Restyle)

Bản kiểm kê toàn diện các thành phần giao diện của ứng dụng `apps/mobile/src`, phân loại theo 7 tầng kiến trúc UI (T1 - T7). Mỗi thành phần chỉ rõ file nguồn, các mã màu/bóng hardcode hiện tại và primitive clay dự kiến thay thế.

---

## 1. Phân loại thành phần UI theo 7 tầng (T1 - T7)

### T1: Screen Shell (Nền màn hình, SafeArea, Container danh sách)
| Thành phần | File | Hiện trạng màu/bóng | Primitive Clay thay thế | Ghi chú |
|---|---|---|---|---|
| `AuthScreenContainer` | `features/auth/components/AuthScreenContainer.tsx` | Nền `#F4F7FB`, bóng `#101828` opacity 0.08 | `ClayScreen` / `clayTokens.colors.canvas` (`#F5E8D5`) | Bọc SafeAreaView + KeyboardAvoidingView |
| `SplashScreen` | `features/auth/screens/SplashScreen.tsx` | Nền `authColors.background` (`#F4F7FB`) | `ClayScreen` (`colors.canvas`) | Giữ splash khi load font |
| `HomeScreen` | `features/feed/screens/HomeScreen.tsx` | Nền `feedColors.background` (`#F4F7FB`), loading indicator | `ClayScreen` (`colors.canvas`), list content padding vani | RefreshControl tint màu hồng chủ đạo |
| `SearchScreen` | `features/search/screens/SearchScreen.tsx` | Nền `#FFFFFF` (`searchColors.surface`) | `ClayScreen` (`colors.canvas`) | Shell tìm kiếm bọc SafeAreaInsets |
| `CreateScreen` | `features/post/screens/CreateScreen.tsx` | Nền `#FFFFFF` (colors.surface), border `#E8ECF2` | `ClayScreen` (`colors.canvas`) | Shell đăng bài |
| `NotificationsScreen` | `features/notifications/screens/NotificationsScreen.tsx` | Nền `#FFFFFF` (`notificationsColors.surface`) | `ClayScreen` (`colors.canvas`) | Container danh sách thông báo |
| `ProfileScreen` | `features/profile/screens/ProfileScreen.tsx` | Nền `profileColors.background` (`#F4F7FB`) | `ClayScreen` (`colors.canvas`) | Container danh sách bài viết trang cá nhân |
| `PlaceholderScreen` | `components/common/PlaceholderScreen.tsx` | Nền `#FFFFFF`, chữ `#111827`, `#4B5563` | `ClayScreen` (`colors.canvas`), Text variants | Màn hình dự phòng/placeholder |

### T2: Navigation Chrome (Bottom Tab Bar, Header các màn)
| Thành phần | File | Hiện trạng màu/bóng | Primitive Clay thay thế | Ghi chú |
|---|---|---|---|---|
| Bottom Tab Bar | `navigation/MainTabNavigator.tsx` | Tab bar mặc định của React Navigation, không icon | Clay floating pill tab bar (`ClaySurface` raised, bo góc 999, safe-area aware) | 5 tab: Home, Search, Create, Notifications, Profile |
| Create Tab Button | `navigation/MainTabNavigator.tsx` | Nút tab tiêu chuẩn | Nút tròn nổi to giữa (`ClaySurface` raised / primary hồng đậm), icon Plus | Nhấn vào kích hoạt hiệu ứng lõm nhẹ |
| Home Header | `features/feed/screens/HomeScreen.tsx` / `MainTabNavigator.tsx` | Header mặc định React Navigation với tiêu đề chữ | Custom Clay Header đồng bộ (chữ thương hiệu "Mobile Social" hoặc logo vani/hồng) | Header ẩn trên tab navigator, dùng header component đồng bộ |
| Search Header | `features/search/screens/SearchScreen.tsx` | Container nền `#FFFFFF`, viền `#E8ECF2`, title `#172033` | Header vani đồng bộ, thanh search clay inset | SafeArea aware |
| Create Header | `features/post/screens/CreateScreen.tsx` | Viền `#E8ECF2`, title `#172033` | Header vani đồng bộ, nút Cancel/Post clay | SafeArea aware |
| Notifications Header | `features/notifications/screens/NotificationsScreen.tsx` | Nền `#FFFFFF`, viền `#E8ECF2`, title `#172033` | Header vani đồng bộ, badge unread clay | Nút "Đọc tất cả" clay ghost |

### T3: Surface / Container (Card, List Item, Modal / Sheet, Profile Header)
| Thành phần | File | Hiện trạng màu/bóng | Primitive Clay thay thế | Ghi chú |
|---|---|---|---|---|
| Card đăng nhập/ký | `features/auth/components/AuthScreenContainer.tsx` | Card `#FFFFFF`, viền `#D7DEE9`, shadow `#101828` | `ClaySurface` raised (bo 28-32, nền `surface` `#FBEFDD`, 2 lớp shadow) | Card phồng mềm auth |
| `PostCard` | `features/feed/components/PostCard.tsx` | Nền `#FFFFFF`, bo 16, shadow `#000` opacity 0.06 | `ClaySurface` raised (bo 28, nền `surface` `#FBEFDD`, viền sáng trong) | Card bài viết trên feed |
| `UserSearchCard` | `features/search/components/UserSearchCard.tsx` | Hàng `#FFFFFF`, viền `#E8ECF2`, pressed `#F8FAFC` | `ClaySurface` raised (bo 24, nền `surfaceHigh` `#FFF5E6`) | Hàng người dùng tìm kiếm |
| `NotificationItem` | `features/notifications/components/NotificationItem.tsx` | Nền `#FFFFFF` (unread `#F0F6FF`), viền `#E8ECF2`, pressed `#F8FAFC` | `ClaySurface` flat/raised (unread dùng nền `surfaceHigh` viền hồng, read dùng `surface`) | Hàng thông báo |
| `CommentModal` (Sheet) | `features/comment/components/CommentModal.tsx` | Sheet `#FFFFFF`, overlay `rgba(0,0,0,0.45)`, bo 20 | `ClaySurface` modal raised (bo trên 32, nền `surface`) | Sheet bình luận trượt lên |
| `CommentItem` | `features/comment/components/CommentItem.tsx` | Hàng `#FFFFFF`, viền `#E8ECF2` | `ClaySurface` con bo 20 hoặc item vani mềm | Từng hàng bình luận |
| `ProfileHeader` | `features/profile/components/ProfileHeader.tsx` | Nền `#FFFFFF`, stats bar `#F4F7FB` bo 16 | `ClaySurface` raised cho stats bar (`surfaceWell` `#EFDFC9`), bo 24 | Header profile người dùng |
| `EditProfileModal` (Sheet) | `features/profile/components/EditProfileModal.tsx` | Sheet `#FFFFFF`, overlay `rgba(0,0,0,0.35)`, bo 20 | `ClaySurface` modal raised (bo trên 32, nền `surface`) | Sheet chỉnh sửa profile |

### T4: Controls (Nút, Input, Chip, Nút nổi)
| Thành phần | File | Hiện trạng màu/bóng | Primitive Clay thay thế | Ghi chú |
|---|---|---|---|---|
| `PrimaryButton` | `features/auth/components/PrimaryButton.tsx` | Nền `#2563EB`, pressed `#1D4ED8`, bo 14 | `ClayButton` variant="primary" (nền `#CC2F6E`, pressed `#A82459`, bo 20, minHeight 52) | Nút bấm chính auth |
| `AuthTextInput` | `features/auth/components/AuthTextInput.tsx` | Nền `#FFFFFF`, viền `#D7DEE9`, focus `#2563EB`, bo 14 | `ClayInput` (nền `surfaceWell` `#EFDFC9`, bóng inset, bo 20, focus viền `#CC2F6E`) | Ô nhập liệu auth |
| Nút hiện/ẩn mật khẩu | `features/auth/components/AuthTextInput.tsx` | Chữ `authColors.primary` (`#2563EB`) | `ClayButton` ghost hoặc ClayIcon eye | Chuyển sang ClayIcon Eye / EyeClosed |
| Nút Post (Create) | `features/post/screens/CreateScreen.tsx` | Nền `#2563EB`, disabled `#E8ECF2`, bo 20 | `ClayButton` variant="primary" (hồng đậm) | Nút đăng bài |
| Ô nhập nội dung bài | `features/post/screens/CreateScreen.tsx` | Nền trong suốt trên màn `#FFFFFF` | `ClayInput` multiline hoặc `ClaySurface` inset bo 24 | Ô soạn thảo bài viết |
| Nút thêm ảnh | `features/post/screens/CreateScreen.tsx` | Nền trong suốt, chữ `#2563EB` | `ClayButton` variant="secondary" với ClayIcon Image | Nút chọn media |
| Ô tìm kiếm | `features/search/screens/SearchScreen.tsx` | Nền `#F1F5F9`, bo 14, icon vector thủ công | `ClayInput` search (nền `surfaceWell`, bóng inset, ClayIcon MagnifyingGlass) | Thanh search |
| Nút xóa text tìm kiếm | `features/search/screens/SearchScreen.tsx` | Nền `#E2E8F0`, Text `✕` | `ClayButton` icon tròn nhỏ hoặc ClayIcon X | Thay thế ký tự ✕ |
| Nút Follow / Following | `features/search/components/UserSearchCard.tsx` | Nền `#2563EB`, following `#F4F7FB` viền `#D7DEE9` | `ClayButton` follow / following (nền primary hoặc surfaceWell, bo 20) | Nút theo dõi user |
| Filter Pills (All / Unread)| `features/notifications/screens/NotificationsScreen.tsx` | Active `#2563EB`, inactive `#F1F5F9` viền `#E2E8F0` | `ClayPill` / `ClayButton` variant="pill" (active hồng đậm, inactive surfaceWell) | Bộ lọc thông báo |
| Nút Đọc tất cả | `features/notifications/screens/NotificationsScreen.tsx` | Text `#2563EB` | `ClayButton` ghost (chữ `#CC2F6E`) | Đánh dấu đã đọc |
| Nút Follow Back | `features/notifications/components/NotificationItem.tsx` | Nền `#2563EB`, following `#FFFFFF` viền `#E8ECF2` | `ClayButton` follow/following (bo 16) | Nút theo dõi lại |
| Ô nhập comment | `features/comment/components/CommentModal.tsx` | Nền `#F1F5F9`, bo 20 | `ClayInput` comment (nền `surfaceWell` inset, bo 20) | Ô gõ bình luận |
| Nút gửi comment | `features/comment/components/CommentModal.tsx` | Nền `#2563EB`, Text `↑` | `ClayButton` icon gửi (ClayIcon PaperPlaneTilt hoặc ArrowUp, nền hồng) | Thay thế ký tự ↑ |
| Nút đóng modal | `features/comment/components/CommentModal.tsx`, `EditProfileModal.tsx` | Nền `#F1F5F9`, Text `✕` | ClayIcon X / nút đóng clay | Thay thế ký tự ✕ |
| Nút Edit Profile | `features/profile/components/ProfileHeader.tsx` | Nền `#2563EB`, pressed `#1D4ED8`, bo 12 | `ClayButton` variant="primary" (hồng đậm) | Chỉnh sửa trang cá nhân |
| Nút Log out | `features/profile/components/ProfileHeader.tsx` | Nền `#FFFFFF`, viền `#E8ECF2`, chữ `#B42318` | `ClayButton` variant="destructive" (nền surfaceHigh, chữ `#C8413B`) | Đăng xuất |
| Ô nhập Edit Profile | `features/profile/components/EditProfileModal.tsx` | Nền `#F4F7FB`, viền `#E8ECF2` | `ClayInput` inset (nền `surfaceWell`) | Nhập display name & bio |
| Action buttons trên post | `features/feed/components/PostCard.tsx` | Like, Comment, Share, Bookmark | `ClayIconButton` bọc `ClayIcon` (vùng chạm >= 44px) | Like tim, comment bóng thoại, share mũi tên, save đánh dấu |

### T5: Content (Avatar, Media, Phân cấp Typography)
| Thành phần | File | Hiện trạng | Thay thế Clay / Nunito | Ghi chú |
|---|---|---|---|---|
| Avatar thương hiệu Auth | `features/auth/components/AuthBrand.tsx` | Nền `#2563EB`, bo 22, Text "MS" | `ClaySurface` raised bo 24, nền `primary` hồng đậm | Biểu tượng nhận diện ứng dụng |
| Avatar tác giả bài viết | `features/feed/components/PostCard.tsx` | Fallback `#2563EB`, viền không có, bo tròn | Avatar viền sáng clay (ring `surfaceHigh` + shadow nhẹ) | Viền clay mềm |
| Media bài viết (đơn/carousel)| `features/feed/components/PostCard.tsx` | Bo 12 | Bo lớn 20-24, viền nhẹ `border` (`#E6D2BA`) | Hiển thị ảnh bài đăng |
| Avatar tìm kiếm user | `features/search/components/UserSearchCard.tsx` | Fallback `#3B82F6` | Avatar viền sáng clay | Avatar người dùng tìm kiếm |
| Avatar thông báo | `features/notifications/components/NotificationItem.tsx` | Fallback `#3B82F6` | Avatar viền sáng clay + badge loại thông báo | Kèm TypeBadge |
| Avatar profile lớn | `features/profile/components/ProfileHeader.tsx` | Fallback `#2563EB`, kích thước 96 | Avatar lớn 96 bo 48, viền clay 3D nổi | Avatar trang cá nhân |
| Avatar thu nhỏ nhập comment| `features/comment/components/CommentModal.tsx` | Fallback `#2563EB` | Avatar nhỏ viền clay | Cạnh ô nhập bình luận |
| Avatar bình luận | `features/comment/components/CommentItem.tsx` | Fallback `#3B82F6` | Avatar viền clay | Của người bình luận |
| Typography chung | Toàn bộ ứng dụng | Font hệ thống, chữ `#172033`, `#4B5563`, `#667085` | Font `Nunito` (Regular, SemiBold, Bold, ExtraBold), màu `#4A2A35`, `#6E4B57`, `#85606C` | Phân cấp: title, heading, body, caption, meta |

### T6: Iconography (Icon hành động, Badge loại thông báo, Tab Icon, Emoji trang trí)
*Tất cả ký tự Unicode / emoji đang dùng trong `<Text>` được liệt kê dưới đây để thay thế bằng ClayIcon hoặc ClayEmoji:*
| Ký tự hiện tại | File | Dòng | Mục đích | Thay thế bằng |
|---|---|---|---|---|
| `♥` / `♡` | `features/feed/components/PostCard.tsx` | 113 | Nút Like bài viết | `ClayIcon` name="Heart" weight="fill" / "duotone", color=`liked` (`#E0457B`) |
| `💬` | `features/feed/components/PostCard.tsx` | 119 | Nút Comment bài viết | `ClayIcon` name="ChatCircle" weight="duotone" |
| `↗` | `features/feed/components/PostCard.tsx` | 123 | Nút Share bài viết | `ClayIcon` name="ShareNetwork" weight="duotone" |
| `★` / `☆` | `features/feed/components/PostCard.tsx` | 129 | Nút Bookmark bài viết | `ClayIcon` name="BookmarkSimple" weight="fill" / "duotone", color=`saved` (`#E3A02E`) |
| `•••` | `features/feed/components/PostCard.tsx` | 135 | Nút tùy chọn bài viết | `ClayIcon` name="DotsThree" weight="bold" |
| `📭` | `features/feed/components/FeedEmptyState.tsx` | 8 | Empty feed | `ClayEmoji` name="sparkles" (Fluent 3D PNG hoặc fallback SVG/ClayEmoji) |
| `🔍` | `features/search/components/SearchEmptyState.tsx` | 14 | Empty search | `ClayEmoji` name="magnifying_glass" |
| `✕` | `features/search/screens/SearchScreen.tsx` | 256 | Xóa tìm kiếm | `ClayIcon` name="X" weight="bold" |
| `🖼` | `features/post/screens/CreateScreen.tsx` | 290 | Thêm ảnh | `ClayIcon` name="Image" weight="duotone" |
| `✕` | `features/post/screens/CreateScreen.tsx` | 94 | Xóa ảnh đã chọn | `ClayIcon` name="X" weight="bold" |
| `✨` / `🔔` | `features/notifications/components/NotificationEmptyState.tsx` | 14 | Empty thông báo | `ClayEmoji` name="bell" / "sparkles" |
| `♥` | `features/notifications/components/NotificationItem.tsx` | 24 | Badge like thông báo | `ClayIcon` name="Heart" weight="fill" |
| `💬` | `features/notifications/components/NotificationItem.tsx` | 28 | Badge comment thông báo | `ClayIcon` name="ChatCircle" weight="fill" |
| `👤` | `features/notifications/components/NotificationItem.tsx` | 31 | Badge follow thông báo | `ClayIcon` name="UserPlus" weight="fill" |
| `✍️` | `features/profile/components/ProfileEmptyPosts.tsx` | 12 | Empty bài viết profile | `ClayEmoji` name="camera_or_memo" |
| `💬` | `features/comment/components/CommentModal.tsx` | 64 | Empty bình luận | `ClayEmoji` name="speech_balloon" |
| `✕` | `features/comment/components/CommentModal.tsx` | 267 | Đóng sheet comment | `ClayIcon` name="X" weight="bold" |
| `↑` | `features/comment/components/CommentModal.tsx` | 338 | Nút gửi comment | `ClayIcon` name="ArrowUp" weight="bold" |
| `♥` / `♡` | `features/comment/components/CommentItem.tsx` | 99 | Like comment | `ClayIcon` name="Heart" weight="fill" / "duotone" |
| (Không có) | `navigation/MainTabNavigator.tsx` | - | Icon 5 tabs | `ClayIcon`: House, MagnifyingGlass, Plus, Bell, User |

### T7: Feedback States (Skeleton, Empty, Error/FormMessage, Loading, Refresh, Splash)
| Thành phần | File | Hiện trạng màu | Primitive Clay thay thế | Ghi chú |
|---|---|---|---|---|
| `SearchSkeleton` | `features/search/components/SearchSkeleton.tsx` | `#E2E8F0`, `#EEF2F6` (xám lạnh) | Tông vani ấm: `#EFDFC9` (surfaceWell), `#E6D2BA` (border) | Animation pulse dịu mắt |
| `NotificationSkeleton` | `features/notifications/components/NotificationSkeleton.tsx` | `#E2E8F0`, `#EEF2F6` (xám lạnh) | Tông vani ấm: `#EFDFC9`, `#E6D2BA` | Skeleton thông báo |
| `FeedEmptyState` | `features/feed/components/FeedEmptyState.tsx` | Emoji `📭`, chữ `#172033`, `#667085` | `ClayEmoji` 3D + Typography Nunito | Trạng thái rỗng feed |
| `SearchEmptyState` | `features/search/components/SearchEmptyState.tsx` | Vòng tròn `#EEF2F6`, emoji `🔍`, nút `#EEF2F6` | `ClaySurface` raised + `ClayEmoji` + `ClayButton` | Trạng thái rỗng tìm kiếm |
| `NotificationEmptyState` | `features/notifications/components/NotificationEmptyState.tsx` | Emoji `✨` / `🔔` | `ClayEmoji` 3D + Typography Nunito | Trạng thái rỗng thông báo |
| `ProfileEmptyPosts` | `features/profile/components/ProfileEmptyPosts.tsx` | Emoji `✍️`, nút `#2563EB` | `ClayEmoji` 3D + `ClayButton` primary hồng đậm | Trạng thái rỗng profile |
| `FormMessage` | `features/auth/components/FormMessage.tsx` | Error `#B42318` trên `#FFF1F0`, info `#1849A9` trên `#EEF4FF` | Error `#C8413B` trên `#F8D9D3` bo 20; info hồng đậm trên `#F6CADB` bo 20 | Thông báo lỗi/thông tin form |
| `SplashScreen` (Dots) | `features/auth/screens/SplashScreen.tsx` | Dots `#2563EB`, text `#667085` | Dots `#CC2F6E` (hồng đậm), text `#85606C` (caption), nền vani | Loading khi app khởi động |
| RefreshControl | `HomeScreen`, `SearchScreen`, `NotificationsScreen`, `ProfileScreen`, `CommentModal` | Xanh `#2563EB` | Hồng đậm `#CC2F6E` | Vòng xoay pull-to-refresh |
| ActivityIndicator | Các nút & màn loading | Trắng hoặc xanh `#2563EB` | Trắng vani `#FFF5E6` trên nút, hồng đậm `#CC2F6E` trên nền vani | Indicator tương thích WCAG |

---

## 2. Kế hoạch triển khai qua các Phase

- **P1 - Nền tảng:**
  1. Cài đặt các thư viện cho phép: `react-native-svg`, `phosphor-react-native`, `expo-font`, `@expo-google-fonts/nunito`.
  2. Tạo hệ thống theme trong `src/theme/`:
     - `colors.ts`: Token màu vani/hồng, WCAG compliant, cấm `#FFFFFF`/`#000000`.
     - `spacing.ts`: 4, 8, 12, 16, 20, 24, 32.
     - `typography.ts`: Cấu hình font Nunito và các text variants.
     - `clay.ts`: Hàm tính toán shadow 2 lớp (shadowDark, shadowLight) + inset fallback.
  3. Tạo các primitive clay trong `src/components/ui/`:
     - `ClaySurface.tsx`: Container raised/inset/flat, hỗ trợ Platform check + border sáng bên trong.
     - `ClayButton.tsx`: Nút bấm clay phồng mềm, hiệu ứng co/lõm khi pressed, minHeight/minWidth 44px, có accessibilityLabel.
     - `ClayInput.tsx`: Ô nhập lõm (inset), bo góc, focus highlight hồng đậm.
     - `ClayText.tsx`: Text bọc Nunito với các variant (title, heading, body, caption, meta).
  4. Tạo các icon component trong `src/components/icons/`:
     - `ClayIcon.tsx`: Bọc duy nhất phosphor-react-native (duotone/fill).
     - `ClayEmoji.tsx`: Hiển thị ảnh 3D Fluent emoji (có fallback emoji).
  5. Cập nhật 6 file `*Theme.ts` trỏ về theme trung tâm, giữ nguyên tên export.
  6. Chạy Gate G1 (typecheck).

- **P2 - Navigation Chrome:**
  1. Tùy biến `MainTabNavigator.tsx`: tab bar viên nổi clay (`ClaySurface`), an toàn safe-area, 5 icon Phosphor, nút Create nổi giữa.
  2. Đồng bộ header `HomeScreen` với các màn hình khác (bỏ header mặc định hoặc bọc bằng custom Clay Header).
  3. Chạy Gate G1, Gate G2 (expo export).

- **P3 - Auth & Components:**
  1. Cập nhật `SplashScreen`, `LoginScreen`, `RegisterScreen`.
  2. Cập nhật `AuthBrand`, `AuthScreenContainer`, `AuthTextInput`, `FormMessage`, `PrimaryButton`.
  3. Chạy Gate G1.

- **P4 - Home & Feed:**
  1. Cập nhật `PostCard` (card raised, ClayIcon row, avatar viền clay, media bo lớn).
  2. Cập nhật `FeedEmptyState`.
  3. Cập nhật `HomeScreen`.
  4. Chạy Gate G1, Gate G2.

- **P5 - Create & Comments:**
  1. Cập nhật `CreateScreen` (header, input inset, nút thêm ảnh, nút đăng clay).
  2. Cập nhật `CommentModal` (sheet raised, ô nhập inset, ClayIcon).
  3. Cập nhật `CommentItem` (hàng bình luận, like ClayIcon).
  4. Chạy Gate G1.

- **P6 - Search & Notifications:**
  1. Cập nhật `SearchScreen` (search bar inset, clear icon ClayIcon).
  2. Cập nhật `UserSearchCard`, `SearchSkeleton`, `SearchEmptyState`.
  3. Cập nhật `NotificationsScreen` (filter pills clay, mark all clay).
  4. Cập nhật `NotificationItem` (TypeBadge ClayIcon, avatar viền clay, follow button clay).
  5. Cập nhật `NotificationSkeleton`, `NotificationEmptyState`.
  6. Chạy Gate G1.

- **P7 - Profile & Modals:**
  1. Cập nhật `ProfileScreen`, `ProfileHeader` (avatar lớn nổi, stats bar clay, edit/logout button clay).
  2. Cập nhật `EditProfileModal` (sheet raised, input inset).
  3. Cập nhật `ProfileEmptyPosts`.
  4. Chạy Gate G1, Gate G2.

- **P8 - Rà soát & Dọn dẹp:**
  1. Quét sạch mọi mã hex cũ (#2563EB, #FFFFFF, v.v.) ngoài `src/theme/`.
  2. Loại bỏ toàn bộ emoji/unicode làm icon trong `<Text>`.
  3. Cập nhật `PlaceholderScreen.tsx`.
  4. Cập nhật `docs/summary.md` (mô tả UI đã lỗi thời).
  5. Cập nhật `docs/decisions.md` và `docs/change.md`.

- **P9 - Cổng kiểm tra tự động G1 - G5:**
  1. Viết `scripts/verify-ui.mjs` kiểm tra các ràng buộc a -> h.
  2. Cấu hình Jest + smoke render tests trong `__tests__/`.
  3. Chạy toàn bộ các cổng kiểm tra.
