import { ClayButton } from '../../../components/ui/ClayButton';

type PrimaryButtonProps = {
  accessibilityLabel?: string;
  disabled?: boolean;
  isLoading?: boolean;
  label: string;
  onPress: () => void;
};

export function PrimaryButton({
  accessibilityLabel,
  disabled = false,
  isLoading = false,
  label,
  onPress,
}: PrimaryButtonProps) {
  return (
    <ClayButton
      accessibilityLabel={accessibilityLabel ?? label}
      variant="primary"
      label={label}
      isLoading={isLoading}
      disabled={disabled}
      onPress={onPress}
      style={{ minHeight: 52, width: '100%' }}
    />
  );
}
