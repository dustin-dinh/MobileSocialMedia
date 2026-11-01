import { Pressable, StyleSheet, View } from 'react-native';

import { ClayText } from './ClayText';
import { clayColors } from '../../theme/colors';
import { clayRadii, claySpacing } from '../../theme/spacing';
import { fontFamilies, tabularNums } from '../../theme/typography';

export type FolderTab<Key extends string> = {
  accessibilityLabel: string;
  count: number;
  key: Key;
  label: string;
};

type FolderTabsProps<Key extends string> = {
  onChange: (key: Key) => void;
  selected: Key;
  tabs: FolderTab<Key>[];
};

/**
 * A segmented control as wide as its options, each with its count. The
 * selected option takes the brand's pale tint with its dark ink.
 * Used by the inbox folders and the notification filter.
 */
export function FolderTabs<Key extends string>({ onChange, selected, tabs }: FolderTabsProps<Key>) {
  return (
    <View accessibilityRole="tablist" style={styles.track}>
      {tabs.map((tab) => {
        const isActive = tab.key === selected;

        return (
          <Pressable
            accessibilityLabel={tab.accessibilityLabel}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            key={tab.key}
            onPress={() => onChange(tab.key)}
            style={[styles.option, isActive && styles.optionActive]}
          >
            <ClayText style={[styles.label, isActive && styles.labelActive]} variant="caption">
              {tab.label}{' '}
              <ClayText style={[styles.count, isActive && styles.labelActive]} variant="caption">
                {tab.count}
              </ClayText>
            </ClayText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  count: {
    ...tabularNums,
    color: clayColors.caption,
    fontFamily: fontFamilies.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  label: {
    color: clayColors.textSecondary,
    fontFamily: fontFamilies.medium,
    fontSize: 14,
    lineHeight: 20,
  },
  labelActive: {
    color: clayColors.primaryInk,
    fontFamily: fontFamilies.semiBold,
  },
  option: {
    alignItems: 'center',
    borderRadius: clayRadii.control - 2,
    justifyContent: 'center',
    minHeight: 40,
    paddingHorizontal: claySpacing.md,
  },
  optionActive: {
    backgroundColor: clayColors.primarySoft,
  },
  track: {
    alignSelf: 'flex-start',
    backgroundColor: clayColors.surface,
    borderColor: clayColors.border,
    borderRadius: clayRadii.control,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 2,
    padding: 2,
  },
});
