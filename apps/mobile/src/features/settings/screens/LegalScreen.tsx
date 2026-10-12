import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ScreenHeader } from '../../../components/common/ScreenHeader';
import { ClayText } from '../../../components/ui/ClayText';
import type { AuthStackParamList, MainStackParamList } from '../../../navigation/types';
import { clayColors } from '../../../theme/colors';
import { claySpacing } from '../../../theme/spacing';

// Reachable both before sign-in (from Register) and from Settings.
type LegalScreenProps =
  | NativeStackScreenProps<AuthStackParamList, 'Legal'>
  | NativeStackScreenProps<MainStackParamList, 'Legal'>;

type Section = { body: string; heading: string };

// shortcut: draft wording written for the MVP, not reviewed by a lawyer; replace before a public release.
const DOCUMENTS: Record<'privacy' | 'terms', { sections: Section[]; title: string }> = {
  privacy: {
    sections: [
      {
        body: 'Email, tên người dùng, tên hiển thị, ảnh đại diện, tiểu sử và nội dung bạn đăng (bài viết, ảnh, bình luận). Khi bạn đăng nhập bằng Google, chúng tôi nhận email, tên và ảnh đại diện từ Google.',
        heading: 'Dữ liệu chúng tôi thu thập',
      },
      {
        body: 'Lượt thích, bình luận, bài đăng lại, bài đã lưu, danh sách theo dõi, người bạn chặn và báo cáo bạn gửi. Khi có tính năng video ngắn, chúng tôi ghi nhận video bạn xem và thời gian xem để gợi ý nội dung phù hợp.',
        heading: 'Dữ liệu về cách bạn sử dụng',
      },
      {
        body: 'Để hiển thị nội dung cho bạn và người khác, gửi thông báo, gợi ý người bạn có thể quen, bảo vệ tài khoản và xử lý nội dung vi phạm. Chúng tôi không bán dữ liệu cá nhân của bạn.',
        heading: 'Mục đích sử dụng',
      },
      {
        body: 'Dữ liệu được lưu trên máy chủ của nhà cung cấp hạ tầng mà ứng dụng sử dụng. Mật khẩu được lưu ở dạng băm, không ai đọc được mật khẩu gốc.',
        heading: 'Lưu trữ và bảo mật',
      },
      {
        body: 'Bạn có thể sửa hồ sơ, xoá bài viết và bình luận bất cứ lúc nào. Vào Cài đặt > Xoá tài khoản để xoá toàn bộ dữ liệu của bạn; việc xoá có hiệu lực ngay và không thể khôi phục.',
        heading: 'Quyền của bạn',
      },
    ],
    title: 'Chính sách quyền riêng tư',
  },
  terms: {
    sections: [
      {
        body: 'Bạn chịu trách nhiệm về nội dung mình đăng và về việc giữ bí mật mật khẩu cũng như mã xác thực được gửi qua email. Không chia sẻ mã xác thực cho bất kỳ ai.',
        heading: 'Tài khoản của bạn',
      },
      {
        body: 'Không đăng nội dung vi phạm pháp luật, quấy rối, đe doạ, khiêu dâm, kích động thù ghét, lừa đảo hoặc spam. Không mạo danh người khác và không đăng nội dung bạn không có quyền sử dụng.',
        heading: 'Nội dung không được phép',
      },
      {
        body: 'Bạn có thể báo cáo bài viết, bình luận hoặc người dùng vi phạm, và chặn người bạn không muốn tương tác. Chúng tôi có thể gỡ nội dung hoặc khoá tài khoản vi phạm các điều khoản này.',
        heading: 'Báo cáo và xử lý vi phạm',
      },
      {
        body: 'Bạn giữ quyền đối với nội dung của mình. Khi đăng, bạn cho phép ứng dụng hiển thị nội dung đó cho những người mà bạn đã chọn trong phần quyền riêng tư của bài viết.',
        heading: 'Quyền đối với nội dung',
      },
      {
        body: 'Ứng dụng được cung cấp ở trạng thái hiện có. Chúng tôi có thể thay đổi tính năng và cập nhật các điều khoản này; thay đổi quan trọng sẽ được thông báo trong ứng dụng.',
        heading: 'Thay đổi dịch vụ',
      },
    ],
    title: 'Điều khoản sử dụng',
  },
};

/** Static Terms of Use / Privacy Policy page. */
export function LegalScreen({ navigation, route }: LegalScreenProps) {
  const document = DOCUMENTS[route.params.doc];

  return (
    <View style={styles.container}>
      <ScreenHeader onBack={navigation.goBack} title={document.title} />
      <ScrollView contentContainerStyle={styles.content}>
        {document.sections.map((section) => (
          <View key={section.heading} style={styles.section}>
            <ClayText style={styles.heading} variant="heading">
              {section.heading}
            </ClayText>
            <ClayText style={styles.body} variant="body">
              {section.body}
            </ClayText>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    color: clayColors.textSecondary,
    marginTop: claySpacing.xs,
  },
  container: {
    backgroundColor: clayColors.canvas,
    flex: 1,
  },
  content: {
    padding: claySpacing.lg,
    paddingBottom: 48,
  },
  heading: {
    color: clayColors.text,
  },
  section: {
    marginBottom: claySpacing.lg,
  },
});
