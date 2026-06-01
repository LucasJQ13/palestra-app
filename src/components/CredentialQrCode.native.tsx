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
      logoSize={Math.max(33, Math.round(size * 0.36))}
      logoBackgroundColor="transparent"
      logoMargin={0}
      logoBorderRadius={6}
    />
  );
}
