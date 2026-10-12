import { Component, type ErrorInfo, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { clayColors } from '../../theme/colors';
import { claySpacing } from '../../theme/spacing';
import { ClayIcon } from '../icons/ClayIcon';
import { ClayButton } from '../ui/ClayButton';
import { ClayText } from '../ui/ClayText';

type ErrorBoundaryProps = { children: ReactNode };
type ErrorBoundaryState = { hasError: boolean };

/**
 * Catches render errors anywhere below it and shows a recoverable screen
 * instead of a blank app.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // shortcut: errors only reach the device log; send them to a crash reporter (e.g. Sentry) before a public release.
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <View style={styles.container}>
        <ClayIcon color={clayColors.error} name="WarningCircle" size={52} weight="duotone" />
        <ClayText style={styles.title} variant="heading">
          Đã có lỗi xảy ra
        </ClayText>
        <ClayText style={styles.message} variant="body">
          Ứng dụng gặp sự cố khi hiển thị màn hình này. Hãy thử tải lại.
        </ClayText>
        <ClayButton
          accessibilityLabel="Tải lại ứng dụng"
          onPress={() => this.setState({ hasError: false })}
          style={styles.button}
          title="Tải lại"
          variant="primary"
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  button: {
    marginTop: claySpacing.xl,
  },
  container: {
    alignItems: 'center',
    backgroundColor: clayColors.canvas,
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: claySpacing.xxl,
  },
  message: {
    color: clayColors.caption,
    marginTop: claySpacing.xs,
    textAlign: 'center',
  },
  title: {
    color: clayColors.text,
    marginTop: claySpacing.md,
    textAlign: 'center',
  },
});
