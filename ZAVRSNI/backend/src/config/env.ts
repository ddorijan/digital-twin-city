// Centralized environment-derived configuration

// Comma-separated list of allowed origins, e.g. "http://localhost:5173,https://example.com"
export const CORS_ORIGIN: string | string[] = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim())
  : 'http://localhost:5173';
