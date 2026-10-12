import { NavigationContext } from '@react-navigation/native';
import { useContext, useEffect, useState } from 'react';

/**
 * Whether the screen this component belongs to is the focused one. Unlike
 * `useIsFocused()` it does not throw outside a navigator (unit tests,
 * previews): it then reports `true`.
 */
export function useIsScreenFocused(): boolean {
  const navigation = useContext(NavigationContext);
  const [isFocused, setIsFocused] = useState(() => navigation?.isFocused() ?? true);

  useEffect(() => {
    if (!navigation) {
      return;
    }

    setIsFocused(navigation.isFocused());

    const removeFocus = navigation.addListener('focus', () => setIsFocused(true));
    const removeBlur = navigation.addListener('blur', () => setIsFocused(false));

    return () => {
      removeFocus();
      removeBlur();
    };
  }, [navigation]);

  return isFocused;
}
