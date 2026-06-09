import { Platform } from 'react-native';

function getDefaultApiUrl() {
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8000';
  }
  return 'http://localhost:8000';
}

export const API_CONFIG = {
  baseUrl: process.env.EXPO_PUBLIC_API_URL ?? getDefaultApiUrl(),
  apiPrefix: '/api',
} as const;

export function getApiUrl(path: string) {
  return `${API_CONFIG.baseUrl}${API_CONFIG.apiPrefix}${path}`;
}
