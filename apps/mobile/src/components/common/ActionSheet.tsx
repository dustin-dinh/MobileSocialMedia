import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { clayColors } from '../../theme/colors';
import { clayDimensions, clayRadii } from '../../theme/spacing';
import { ClayIcon } from '../icons/ClayIcon';
import { ClaySurface } from '../ui/ClaySurface';
import { ClayText } from '../ui/ClayText';

export type ActionSheetOption = {
  description?: string;
  destructive?: boolean;
  icon: string;
  key: string;
  label: string;
  onPress: () => void;
};

type ActionSheetProps = {
  onClose: () => void;
  options: ActionSheetOption[];
  title: string;
  visible: boolean;
};

/**
 * Bottom sheet with a list of actions, in the same clay style as the post
 * options menu. The sheet closes itself before running the chosen action.
 */
export function ActionSheet({ onClose, options, title, visible }: ActionSheetProps) {
  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={visible}>
      <Pressable
        accessibilityLabel="Đóng bảng lựa chọn"
        accessibilityRole="button"
        onPress={onClose}
        style={styles.overlay}
      >
        <Pressable
          accessibilityLabel={title}
          onPress={() => {
            // Taps inside the sheet must not dismiss it.
          }}
          style={styles.sheetWrap}
        >
          <ClaySurface variant="modal" style={styles.sheet}>
            <View style={styles.handleWrap}>
              <View style={styles.handle} />
            </View>

            <View style={styles.header}>
              <ClayText variant="heading" style={styles.headerTitle}>
                {title}
              </ClayText>
            </View>

            <View style={styles.list}>
              {options.map((item) => {
                const color = item.destructive ? clayColors.error : clayColors.text;

                return (
                  <Pressable
                    accessibilityLabel={item.label}
                    accessibilityRole="button"
                    key={item.key}
                    onPress={() => {
                      onClose();
                      item.onPress();
                    }}
                    style={styles.optionRow}
                  >
                    <View
                      style={[styles.iconWrap, item.destructive && styles.iconWrapDestructive]}
                    >
                      <ClayIcon
                        color={color}
                        name={item.icon}
                        size={22}
                        weight={item.destructive ? 'bold' : 'duotone'}
                      />
                    </View>
                    <View style={styles.optionContent}>
                      <ClayText variant="body" style={[styles.optionLabel, { color }]}>
                        {item.label}
                      </ClayText>
                      {item.description ? (
                        <ClayText variant="caption" style={styles.optionDescription}>
                          {item.description}
                        </ClayText>
                      ) : null}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </ClaySurface>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  handle: {
    backgroundColor: clayColors.border,
    borderRadius: clayRadii.pill,
    height: 4,
    width: 36,
  },
  handleWrap: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  header: {
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  headerTitle: {
    color: clayColors.text,
  },
  iconWrap: {
    alignItems: 'center',
    backgroundColor: clayColors.surfaceWell,
    borderRadius: clayRadii.control,
    height: clayDimensions.minTouchTarget,
    justifyContent: 'center',
    marginRight: 14,
    width: clayDimensions.minTouchTarget,
  },
  iconWrapDestructive: {
    backgroundColor: clayColors.errorBg,
  },
  list: {
    paddingBottom: 24,
    paddingHorizontal: 14,
  },
  optionContent: {
    flex: 1,
  },
  optionDescription: {
    color: clayColors.caption,
    marginTop: 2,
  },
  optionLabel: {
    fontSize: 15,
  },
  optionRow: {
    alignItems: 'center',
    borderRadius: clayRadii.control,
    flexDirection: 'row',
    marginBottom: 6,
    minHeight: 56,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  overlay: {
    backgroundColor: 'rgba(74, 42, 53, 0.45)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderTopLeftRadius: clayRadii.modal,
    borderTopRightRadius: clayRadii.modal,
  },
  sheetWrap: {
    width: '100%',
  },
});
