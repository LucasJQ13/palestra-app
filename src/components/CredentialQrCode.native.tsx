import React from 'react';
import QRCode from 'react-native-qrcode-svg';

export function CredentialQrCode({ value, size = 104 }: { value: string; size?: number }) {
  return <QRCode value={value} size={size} quietZone={4} />;
}
