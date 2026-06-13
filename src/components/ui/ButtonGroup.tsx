import React, { ReactNode } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { buttonStyles } from './buttonStyles';

export type ButtonGroupProps = {
  children: ReactNode;
  direction?: 'horizontal' | 'vertical';
  wrap?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function ButtonGroup({
  children,
  direction = 'horizontal',
  wrap = true,
  style
}: ButtonGroupProps) {
  return (
    <View
      style={[
        buttonStyles.group,
        direction === 'horizontal' ? buttonStyles.groupHorizontal : buttonStyles.groupVertical,
        direction === 'horizontal' && wrap && buttonStyles.groupWrap,
        style
      ]}
    >
      {children}
    </View>
  );
}
