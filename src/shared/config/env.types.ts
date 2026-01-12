export interface EnvConfig {
  apiUrl: string;
  defaultDialect: string;
}

export function validateEnv(): EnvConfig {
  const apiUrl = import.meta.env.VITE_API_URL;
  
  if (!apiUrl) {
    throw new Error('VITE_API_URL is required. Set it in .env file.');
  }
  
  // Remove trailing slash
  const cleanApiUrl = apiUrl.replace(/\/$/, '');
  
  return {
    apiUrl: cleanApiUrl,
    defaultDialect: import.meta.env.VITE_DEFAULT_DIALECT || 'generic',
  };
}

export const env = validateEnv();
