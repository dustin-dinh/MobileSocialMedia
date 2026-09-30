# Render Performance Notes

Tài liệu ghi lại các thay đổi kỹ thuật nhằm tối ưu hóa hiệu năng render trong `apps/mobile`, phương pháp đo lường tự động và hướng dẫn kiểm thử thực tế trên thiết bị. Không bao gồm các con số phần trăm suy đoán hoặc bịa đặt.

---

## 1. Phân cấp hiệu ứng Claymorphism (`full` vs `lite`)

- **Vấn đề trước khi sửa:**
  Mọi phần tử UI (kể cả từng card trong FlatList dài) đều sử dụng các preset bóng nhiều lớp (3-4 lớp shadow/inset), tạo áp lực render GPU lớn trên thiết bị di động, đặc biệt là Android (vốn chỉ hỗ trợ `elevation` đơn lẻ cho bóng ngoài và phải giả lập inset).
- **Giải pháp áp dụng:**
  - `full` (tối đa 4 lớp bóng/inset): Chỉ áp dụng cho các thành phần cố định, điểm nhấn chính:
    - Floating `ClayTabBar`
    - Nút hành động chính (`primaryButton`)
    - Modal / Bottom Sheet (`CommentModal`, `EditProfileModal`)
    - `ProfileHeader`
    - Nút đăng bài (`CreateScreen` submit button)
  - `lite` (`raisedLite`, `cardLite`): Áp dụng cho **tất cả** các item và skeleton xuất hiện trong danh sách lặp (`FlatList`):
    - `PostCard`
    - `CommentItem`
    - `NotificationItem`
    - `UserSearchCard`
    - `SearchSkeleton`, `NotificationSkeleton`
  - Cấu trúc `lite`: Tối đa 2 lớp bóng ngoài mềm (`shadowDark` với blur nhỏ + `shadowLight`), tối đa 1 lớp inset, ưu tiên `elevation: 2` trên Android.

---

## 2. Ghi nhớ Component (React.memo) và Ổn định Props

- **Các component danh sách được bọc `React.memo`:**
  - `PostCard`
  - `CommentItem`
  - `NotificationItem`
  - `UserSearchCard`
- **Ổn định Props & Tham chiếu:**
  - Toàn bộ hàm handler (`handleToggleLike`, `handleToggleSave`, `handlePressComment`, `handleFollow`, `handleOpenPost`, v.v.) được bọc trong `useCallback`.
  - `keyExtractor` và `renderItem` được định nghĩa ngoài JSX hoặc bọc `useCallback`.
  - Khai báo style tĩnh hoàn toàn trong `StyleSheet.create`, loại bỏ việc tạo inline style object hoặc style array mới trong mỗi chu kỳ render của list item.

---

## 3. Cấu hình FlatList

Đã áp dụng đồng bộ các thuộc tính điều tiết render theo lô trên tất cả màn hình có danh sách (`HomeScreen`, `SearchScreen`, `NotificationsScreen`, `ProfileScreen`, `CommentModal`):
- `initialNumToRender={6}`: Giới hạn số phần tử render ban đầu đủ lấp đầy màn hình nhìn thấy đầu tiên, giảm TTI (Time to Interactive).
- `maxToRenderPerBatch={6}`: Giới hạn số lượng phần tử dựng thêm trong mỗi lượt cuộn.
- `windowSize={7}`: Giảm bán kính vùng đệm ngoài viewport (mặc định của RN là 21, chiếm rất nhiều bộ nhớ), giải phóng các item ngoài tầm nhìn sớm hơn.
- `removeClippedSubviews={Platform.OS === 'android'}`: Kích hoạt ngắt kết nối native view ngoài màn hình trên Android để tiết kiệm bộ nhớ; không áp dụng cho carousel ngang để tránh hiện tượng nhấp nháy.

---

## 4. Hoạt ảnh (Animated)

- Toàn bộ `Animated.timing` / `Animated.spring` điều khiển `opacity` và `transform` đều chỉ định `useNativeDriver: true`.
- Các đối tượng `Animated.Value` được khởi tạo và lưu giữ qua `useRef`, không tạo mới trong chu kỳ render.
- Không sử dụng mount animation (hoạt ảnh xuất hiện ban đầu) bên trong từng item lặp của danh sách, tránh nghẽn thread JS khi nạp batch mới.

---

## 5. Tối ưu Hóa Hình Ảnh (expo-image)

- Tích hợp thư viện `expo-image` thay thế component `Image` mặc định của React Native trong:
  - `PostCard` (avatar tác giả & media bài viết)
  - `UserSearchCard` (avatar người dùng)
  - `NotificationItem` (avatar người tương tác & thumbnail bài viết)
  - `CommentItem` (avatar người bình luận)
  - `ProfileHeader` (avatar trang cá nhân)
  - `CommentModal` (avatar trong form nhập)
- Cấu hình caching: `cachePolicy="memory-disk"`, cho phép lưu cache cả trên RAM và ổ đĩa thiết bị, tránh tải lại ảnh khi cuộn ngược.
- Kích thước ảnh: Quy định kích thước cố định (`width`, `height`) qua style hoặc prop; bổ sung tham số kích thước `w=800&q=70` (hoặc `w=600&q=70`) trong dữ liệu mock Unsplash để giảm dung lượng mạng và kích thước bitmap giải mã.

---

## 6. Rà soát Console Log trong Render Path

- Đã rà soát toàn bộ `apps/mobile/src`.
- Xác nhận: Không có lệnh `console.log` trong render function, hook body hay render loop của bất kỳ component giao diện nào. (Chỉ có log gỡ lỗi mạng có chủ đích trong tầng transport `httpClient.ts`).

---

## 7. Phương Pháp Đo Lường và Kiểm Chứng

### A. Kiểm chứng tự động bằng React.Profiler (CI Gate)
- File kiểm thử: `apps/mobile/__tests__/perf.test.tsx`
- Cơ chế:
  - Dựng component cha chứa 2 `PostCard` được bọc bên trong `<Profiler id="..." onRender={spy}>`.
  - Thực hiện cập nhật một state không liên quan của cha (`unrelatedCount`).
  - Khẳng định: `spy` của cả 2 `PostCard` chỉ được gọi đúng 1 lần (phase `mount`) và **0 lần** trong phase `update` khi cha re-render.

### B. Kiểm thử thủ công trên thiết bị thực tế / BlueStacks
1. Chạy ở chế độ phát triển: `corepack pnpm run start:lan`
2. Chạy ở chế độ tối ưu hóa / production bundle (tắt dev overlay, bật JS minification):
   ```bash
   corepack pnpm exec expo start --lan --no-dev --minify
   ```
3. Quan sát trải nghiệm cuộn (scroll feel) của feed khi lướt nhanh danh sách bài viết giữa 2 chế độ.
