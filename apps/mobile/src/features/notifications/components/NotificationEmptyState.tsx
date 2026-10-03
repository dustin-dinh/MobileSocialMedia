import { StyleSheet, View } from 'react-native';

import { ClayEmoji } from '../../../components/icons/ClayEmoji';
import { ClayText } from '../../../components/ui/ClayText';
import { notificationsColors } from '../notificationsTheme';

type NotificationEmptyStateProps = {
  activeTab: 'all' | 'unread';
};

export function NotificationEmptyState({ activeTab }: NotificationEmptyStateProps) {
  const isUnreadTab = activeTab === 'unread';

  return (
    <View style={styles.container}>
      <View style={styles.emojiWrap}>
        <ClayEmoji name={isUnreadTab ? 'sparkles' : 'bell'} size={56} />
      </View>
      <ClayText variant="heading" style={styles.title}>
        {isUnreadTab
          ? 'Bạn đã đọc hết thông báo!'
          : 'Chưa có thông báo nào'}
      </ClayText>
      <ClayText variant="body" style={styles.subtitle}>
        {isUnreadTab
          ? 'Không có thông báo mới nào chưa đọc. Hãy thư giãn nhé!'
          : 'Khi có người thích, bình luận hoặc theo dõi bạn, thông báo sẽ hiển thị ở đây.'}
      </ClayText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 70,
  },
  emojiWrap: {
    alignItems: 'center',
    backgroundColor: notificationsColors.surfaceWell,
    borderRadius: 44,
    height: 88,
    justifyContent: 'center',
    marginBottom: 20,
    width: 88,
  },
  subtitle: {
    color: notificationsColors.caption,
    marginTop: 8,
    textAlign: 'center',
  },
  title: {
    color: notificationsColors.text,
    textAlign: 'center',
  },
});

