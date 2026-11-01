import { ClayButton } from '../../../components/ui/ClayButton';
import { GoogleLogo } from './GoogleLogo';

type GoogleButtonProps = {
  accessibilityLabel?: string;
  disabled?: boolean;
  isLoading?: boolean;
  onPress: () => void;
};

export function GoogleButton({
  accessibilityLabel = 'Tiếp tục với Google',
  disabled = false,
  isLoading = false,
  onPress,
}: GoogleButtonProps) {
  return (
    <ClayButton
      accessibilityLabel={accessibilityLabel}
      variant="secondary"
      label="Tiếp tục với Google"
      icon={<GoogleLogo size={20} />}
      isLoading={isLoading}
      disabled={disabled}
      onPress={onPress}
      style={{ minHeight: 50, width: '100%' }}
    />
  );
}
