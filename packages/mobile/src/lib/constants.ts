/**
 * API base URL. Set EXPO_PUBLIC_API_URL in .env for local development.
 * Default: production API.
 */
export const API_BASE =
  process.env.EXPO_PUBLIC_API_URL || "https://api.casperevents.org/v1";
