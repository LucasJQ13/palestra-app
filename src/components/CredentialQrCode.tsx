import React from 'react';
import { Image } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

const qrLogo = require('../../assets/qr-logo.png');
const qrLogoSource = Image.resolveAssetSource(qrLogo);

export function CredentialQrCode({ value, size = 104 }: { value: string; size?: number }) {
  return (
    <QRCode
      value={value}
      size={size}
      quietZone={4}
      ecl="H"
      logo={{ uri: qrLogoSource.uri }}
      logoSize={Math.max(22, Math.round(size * 0.24))}
      logoBackgroundColor="white"
      logoMargin={2}
      logoBorderRadius={6}
    />
  );
}
