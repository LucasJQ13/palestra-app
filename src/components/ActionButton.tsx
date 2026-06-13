import React from 'react';
import { AppButton } from './ui';

export function ActionButton({ label, onPress }: { label: string; onPress: () => void }) {
  return <AppButton label={label} onPress={onPress} />;
}
