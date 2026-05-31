import React from 'react';
import QRCode from 'react-native-qrcode-svg';

const qrLogo = require('../../assets/qr-logo.png');

export function CredentialQrCode({ value, size = 104 }: { value: string; size?: number }) {
  return <QRCode value={value} size={size} quietZone={4} logo={qrLogo} logoSize={Math.max(22, Math.round(size * 0.24))} logoBackgroundColor="white" />;
}
