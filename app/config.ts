export const config = {
  SERVER_URL: process.env.NEXT_PUBLIC_SERVER_URL || 'https://YOUR_RENDER_URL_HERE.onrender.com',
  CACHE_BUST: Date.now() // Add cache busting
};
