import React from 'react';
import { Image } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { credentialQrLogoFor } from '../lib/credentialQrLogo';
import { Role } from '../types/auth';

export function CredentialQrCode({ value, size = 104, province, role }: { value: string; size?: number; province?: string | null; role?: Role | null }) {
  const qrLogoSource = Image.resolveAssetSource(credentialQrLogoFor(province, role));
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
