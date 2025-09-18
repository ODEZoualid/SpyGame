# 🚀 Quick Deployment Guide

## ✅ Frontend Deployed!
**URL**: https://spy-game-darija-fp1lslkxk-vievimie-3261s-projects.vercel.app

## 🔧 Backend Deployment (Railway)

### Method 1: Railway Dashboard (Easiest)
1. Go to [Railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Choose "server" folder as root directory
5. Set environment variables:
   - `NODE_ENV=production`
   - `PORT=3001`
   - `CORS_ORIGIN=https://spy-game-darija-fp1lslkxk-vievimie-3261s-projects.vercel.app`

### Method 2: Railway CLI
```bash
cd server
npm install -g @railway/cli
railway login
railway init
railway variables set NODE_ENV=production
railway variables set PORT=3001
railway variables set CORS_ORIGIN=https://spy-game-darija-fp1lslkxk-vievimie-3261s-projects.vercel.app
railway up
```

## 🔄 Update Frontend with Backend URL

After Railway deployment, update `app/config.ts`:
```typescript
export const config = {
  SERVER_URL: 'https://your-railway-url.up.railway.app'
};
```

Then redeploy frontend:
```bash
vercel --prod
```

## 🧪 Test the Deployment

1. **Frontend**: Visit https://spy-game-darija-fp1lslkxk-vievimie-3261s-projects.vercel.app
2. **Test Multiplayer**: 
   - Click "إنشاء غرفة (متعدد)"
   - Create a room and get the 6-digit code
   - Open another browser/device and join with the code

## 🎮 Game Features Available

- ✅ Single-player mode (original)
- ✅ Multiplayer host/join system
- ✅ Real-time synchronization
- ✅ QR code generation
- ✅ Live lobby
- ✅ Synchronized game phases
- ✅ Real-time voting

## 🐛 Troubleshooting

### CORS Errors
- Make sure `CORS_ORIGIN` matches your frontend URL exactly
- Check Railway environment variables

### Connection Issues
- Verify backend URL in `app/config.ts`
- Check Railway logs for errors
- Ensure both frontend and backend are deployed

### Socket.IO Issues
- Check if backend is running
- Verify WebSocket support in Railway
- Check browser console for errors

---

**Ready to play! 🎮👥**
