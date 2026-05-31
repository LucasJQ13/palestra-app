export const CREDENTIAL_QR_TYPE = 'palestra_credential';
export const CREDENTIAL_QR_VERSION = 1;

export type CredentialQrPayload = {
  type: typeof CREDENTIAL_QR_TYPE;
  version: number;
  credentialId: string;
  token: string;
  issuedAt?: string | null;
};

export function buildCredentialQrPayload(values: {
  credentialId: string;
  token: string;
  issuedAt?: string | null;
}) {
  return JSON.stringify({
    type: CREDENTIAL_QR_TYPE,
    version: CREDENTIAL_QR_VERSION,
    credentialId: values.credentialId,
    token: values.token,
    issuedAt: values.issuedAt ?? null
  } satisfies CredentialQrPayload);
}

export function parseCredentialQrPayload(value: string): CredentialQrPayload | null {
  try {
    const parsed = JSON.parse(value) as Partial<CredentialQrPayload>;
    if (parsed.type !== CREDENTIAL_QR_TYPE || parsed.version !== CREDENTIAL_QR_VERSION || !parsed.credentialId || !parsed.token) {
      return null;
    }
    return {
      type: CREDENTIAL_QR_TYPE,
      version: CREDENTIAL_QR_VERSION,
      credentialId: parsed.credentialId,
      token: parsed.token,
      issuedAt: parsed.issuedAt ?? null
    };
  } catch {
    return null;
  }
}
