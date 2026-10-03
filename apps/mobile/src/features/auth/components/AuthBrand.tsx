import React from 'react';
import { StyleSheet, View } from 'react-native';
import { clayColors } from '../../../theme/colors';
import { fontFamilies } from '../../../theme/typography';
import { ClaySurface } from '../../../components/ui/ClaySurface';
import { ClayText } from '../../../components/ui/ClayText';

export function AuthBrand() {
  return (
    <View style={styles.container}>
      <ClaySurface variant="raisedPrimary" borderRadius={26} style={styles.mark}>
        <ClayText variant="title" style={styles.markText}>
          MS
        </ClayText>
      </ClaySurface>
      <ClayText variant="title" style={styles.name}>
        Mobile Social
      </ClayText>
      <ClayText variant="caption" style={styles.tagline}>
        Share moments. Stay connected.
      </ClayText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  mark: {
    alignItems: 'center',
    height: 76,
    justifyContent: 'center',
    width: 76,
  },
  markText: {
    color: clayColors.onPrimary,
    fontSize: 24,
    fontFamily: fontFamilies.extraBold,
    letterSpacing: 1,
  },
  name: {
    marginTop: 14,
    textAlign: 'center',
  },
  tagline: {
    marginTop: 4,
    textAlign: 'center',
  },
});
