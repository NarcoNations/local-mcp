export const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS !== 'false';

export function getBaseUrl() {
  if (typeof window !== 'undefined') {
    return '';
  }
  const url = process.env.VERCEL_URL;
  if (url) {
    return `https://${url}`;
  }
  return process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
}
