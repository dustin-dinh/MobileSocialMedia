import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { UserAvatar } from '../../../components/common/UserAvatar';
import { ClayIcon } from '../../../components/icons/ClayIcon';
import { clayColors } from '../../../theme/colors';
import type { PostAuthor } from '../../feed/types';
import { ANONYMOUS_USER_ID } from '../services/messageService';

/** The other person's avatar; a mask for a hidden anonymous sender. */
export const PeerAvatar = memo(function PeerAvatar({ peer, size }: { peer: PostAuthor; size: number }) {
  if (peer.id !== ANONYMOUS_USER_ID) {
    const name = peer.displayName?.trim() || peer.username;

    return <UserAvatar avatarUrl={peer.avatarUrl} name={name} size={size} />;
  }

  return (
    <View
      accessibilityLabel="Người ẩn danh"
      style={[styles.mask, { borderRadius: size / 2, height: size, width: size }]}
    >
      <ClayIcon color={clayColors.surface} name="Mask" size={size * 0.5} />
    </View>
  );
});

const styles = StyleSheet.create({
  // Ink, not a grey: the hidden sender reads as a deliberate mark, never as a missing photo.
  mask: {
    alignItems: 'center',
    backgroundColor: clayColors.text,
    justifyContent: 'center',
  },
});
