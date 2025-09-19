export const config = {
  SERVER_URL: process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000',
  CACHE_BUST: Date.now() // Add cache busting
};
