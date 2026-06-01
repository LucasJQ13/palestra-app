import React, { useEffect, useState } from 'react';
import { Image, Text, View } from 'react-native';
import * as QRCode from 'qrcode';

const qrLogo = require('../../assets/qr-logo.png');

export function CredentialQrCode({ value, size = 104 }: { value: string; size?: number }) {
  const [uri, setUri] = useState('');
  const logoSize = Math.max(33, Math.round(size * 0.36));

  useEffect(() => {
    let alive = true;
    QRCode.toDataURL(value, { errorCorrectionLevel: 'H', margin: 1, width: size })
      .then((nextUri) => {
        if (alive) {
          setUri(nextUri);
        }
      })
      .catch(() => {
        if (alive) {
          setUri('');
        }
      });
    return () => {
      alive = false;
    };
  }, [value, size]);

  if (!uri) {
    return <Text>QR</Text>;
  }

  return (
    <View style={{ width: size, height: size, position: 'relative' }}>
      <Image source={{ uri }} style={{ width: size, height: size }} />
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: (size - logoSize) / 2,
          top: (size - logoSize) / 2,
          width: logoSize,
          height: logoSize,
          borderRadius: 6,
          backgroundColor: 'transparent',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Image source={qrLogo} style={{ width: logoSize, height: logoSize, borderRadius: 4 }} />
      </View>
    </View>
  );
}
