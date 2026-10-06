import { ClayButton } from '../../../components/ui/ClayButton';
import { GoogleLogo } from './GoogleLogo';

type GoogleButtonProps = {
  accessibilityLabel?: string;
  disabled?: boolean;
  isLoading?: boolean;
  onPress: () => void;
};

export function GoogleButton({
  accessibilityLabel = 'Continue with Google',
  disabled = false,
  isLoading = false,
  onPress,
}: GoogleButtonProps) {
  return (
    <ClayButton
      accessibilityLabel={accessibilityLabel}
      variant="secondary"
      label="Continue with Google"
      icon={<GoogleLogo size={20} />}
      isLoading={isLoading}
      disabled={disabled}
      onPress={onPress}
      style={{ minHeight: 52, width: '100%' }}
    />
  );
}
