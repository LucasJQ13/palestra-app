export function normalizeExternalUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return 'https://palestra.org.ar';
  }
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}
