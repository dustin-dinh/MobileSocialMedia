import { StyleSheet, Text, View } from 'react-native';

import { notificationsColors } from '../notificationsTheme';

type NotificationEmptyStateProps = {
  activeTab: 'all' | 'unread';
};

export function NotificationEmptyState({ activeTab }: NotificationEmptyStateProps) {
  const isUnreadTab = activeTab === 'unread';

  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>{isUnreadTab ? '✨' : '🔔'}</Text>
      <Text style={styles.title}>
        {isUnreadTab
          ? 'Bạn đã đọc hết thông báo!'
          : 'Chưa có thông báo nào'}
      </Text>
      <Text style={styles.subtitle}>
        {isUnreadTab
          ? 'Không có thông báo mới nào chưa đọc. Hãy thư giãn nhé!'
          : 'Khi có người thích, bình luận hoặc theo dõi bạn, thông báo sẽ hiển thị ở đây.'}
      </Text>
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
  emoji: {
    fontSize: 42,
    marginBottom: 12,
  },
  subtitle: {
    color: notificationsColors.caption,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
    textAlign: 'center',
  },
  title: {
    color: notificationsColors.text,
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
  },
});
