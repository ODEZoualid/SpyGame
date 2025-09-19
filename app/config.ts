export const config = {
  SERVER_URL: process.env.NEXT_PUBLIC_SERVER_URL || 'https://spygame-backend.onrender.com',
  CACHE_BUST: Date.now() // Add cache busting
};
