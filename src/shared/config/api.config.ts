import { env } from './env.types';

export const apiConfig = {
  baseUrl: env.apiUrl,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
};
