export const config = {
  SERVER_URL: process.env.NEXT_PUBLIC_SERVER_URL || 'https://backend-production-357c.up.railway.app',
  CACHE_BUST: Date.now() // Add cache busting
};
