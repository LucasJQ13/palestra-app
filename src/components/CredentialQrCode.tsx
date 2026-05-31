import React from 'react';
import { Text } from 'react-native';

export function CredentialQrCode({ value, size = 104 }: { value: string; size?: number }) {
  return <Text style={{ width: size, height: size }}>{value ? 'QR' : ''}</Text>;
}
