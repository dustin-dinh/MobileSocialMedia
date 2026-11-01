import { StyleSheet } from 'react-native';

import { ClayText } from '../../../components/ui/ClayText';
import { clayColors } from '../../../theme/colors';
import { clayDimensions } from '../../../theme/spacing';

type NotificationEmptyStateProps = {
  activeTab: 'all' | 'unread';
};

/** One sentence in the list's place; the header and the filter stay above it. */
export function NotificationEmptyState({ activeTab }: NotificationEmptyStateProps) {
  return (
    <ClayText style={styles.text} variant="body">
      {activeTab === 'unread'
        ? 'Bạn đã đọc hết thông báo.'
        : 'Chưa có thông báo. Khi có người thích, bình luận hoặc theo dõi bạn, bạn sẽ thấy ở đây.'}
    </ClayText>
  );
}

const styles = StyleSheet.create({
  text: {
    color: clayColors.textSecondary,
    padding: clayDimensions.gutter,
  },
});
