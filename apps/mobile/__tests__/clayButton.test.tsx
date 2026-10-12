import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import { ClayButton } from '../src/components/ui/ClayButton';

describe('ClayButton', () => {
  it('shows plain-text children as its label (confirm dialogs pass their labels this way)', async () => {
    const onPress = jest.fn();
    const { getByLabelText, toJSON } = await render(
      <ClayButton accessibilityLabel="Đóng hộp thoại" onPress={onPress}>
        Huỷ
      </ClayButton>,
    );

    expect(JSON.stringify(toJSON())).toContain('"children":["Huỷ"]');
    fireEvent.press(getByLabelText('Đóng hộp thoại'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
