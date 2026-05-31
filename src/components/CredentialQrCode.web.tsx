import React, { useEffect, useState } from 'react';
import { Image, Text } from 'react-native';
import * as QRCode from 'qrcode';

export function CredentialQrCode({ value, size = 104 }: { value: string; size?: number }) {
  const [uri, setUri] = useState('');

  useEffect(() => {
    let alive = true;
    QRCode.toDataURL(value, { errorCorrectionLevel: 'M', margin: 1, width: size })
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

  return <Image source={{ uri }} style={{ width: size, height: size }} />;
}
