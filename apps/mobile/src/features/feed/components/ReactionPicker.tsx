import { Modal, Pressable, StyleSheet, useWindowDimensions } from 'react-native';

import { ClaySurface } from '../../../components/ui/ClaySurface';
import { ClayText } from '../../../components/ui/ClayText';
import { clayRadii } from '../../../theme/spacing';
import { REACTIONS, type ReactionType } from '../reactions';

const ITEM_SIZE = 44;
const BAR_PADDING = 6;
const BAR_WIDTH = REACTIONS.length * ITEM_SIZE + BAR_PADDING * 2;
const BAR_HEIGHT = ITEM_SIZE + BAR_PADDING * 2;

type ReactionPickerProps = {
  /** Where the like button is on screen; the bar opens just above it. */
  anchor: { x: number; y: number } | null;
  onClose: () => void;
  onSelect: (type: ReactionType) => void;
  selected?: ReactionType | null;
};

/** The row of reactions that appears when the like button is held. */
export function ReactionPicker({ anchor, onClose, onSelect, selected }: ReactionPickerProps) {
  const { width } = useWindowDimensions();

  if (!anchor) {
    return null;
  }

  // Keep the whole bar on screen whatever the button's position.
  const left = Math.min(Math.max(8, anchor.x - 8), width - BAR_WIDTH - 8);
  const top = Math.max(8, anchor.y - BAR_HEIGHT - 8);

  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible>
      <Pressable
        accessibilityLabel="Đóng bảng cảm xúc"
        accessibilityRole="button"
        onPress={onClose}
        style={styles.overlay}
      >
        <ClaySurface
          borderRadius={clayRadii.pill}
          style={[styles.bar, { left, top }]}
          variant="dialog"
        >
          {REACTIONS.map((reaction) => (
            <Pressable
              accessibilityLabel={reaction.label}
              accessibilityRole="button"
              accessibilityState={{ selected: reaction.type === selected }}
              key={reaction.type}
              onPress={() => onSelect(reaction.type)}
              style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
            >
              <ClayText style={styles.emoji} variant="title">
                {reaction.emoji}
              </ClayText>
            </Pressable>
          ))}
        </ClaySurface>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    padding: BAR_PADDING,
    position: 'absolute',
  },
  emoji: {
    fontSize: 26,
    lineHeight: 34,
  },
  item: {
    alignItems: 'center',
    height: ITEM_SIZE,
    justifyContent: 'center',
    width: ITEM_SIZE,
  },
  itemPressed: {
    transform: [{ scale: 1.25 }],
  },
  overlay: {
    flex: 1,
  },
});
