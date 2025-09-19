# 🚀 Spy Game Backend Deployment Instructions

## 📋 Prerequisites
- GitHub account
- Railway account (sign up at [railway.app](https://railway.app))
- Node.js 18+ installed locally

## 🏗️ Local Testing

### 1. Install Dependencies
```bash
cd server
npm install
```

### 2. Start the Server
```bash
npm start
```

### 3. Test the Server
- Server will run on `http://localhost:3000`
- Health check: `http://localhost:3000/api/health`
- Check console logs for connection events

### 4. Test with Frontend
```bash
# In another terminal, from project root
npm run dev
```
- Frontend will run on `http://localhost:3001`
- Test creating rooms and joining

## 🚀 Railway Deployment

### Step 1: Prepare Repository
1. **Commit all changes:**
   ```bash
   git add .
   git commit -m "feat: add clean backend server"
   git push origin main
   ```

### Step 2: Create Railway Project
1. **Go to [Railway Dashboard](https://railway.app/dashboard)**
2. **Click "New Project"**
3. **Select "Deploy from GitHub repo"**
4. **Choose your SpyGame repository**
5. **Select the `server` folder as the root directory**

### Step 3: Configure Environment
1. **In Railway dashboard, go to your project**
2. **Click on "Variables" tab**
3. **Add environment variable:**
   - Key: `NODE_ENV`
   - Value: `production`

### Step 4: Deploy
1. **Railway will automatically detect the `package.json` and `Procfile`**
2. **Click "Deploy"**
3. **Wait for deployment to complete (2-3 minutes)**
4. **Copy the generated URL (e.g., `https://your-project-name.up.railway.app`)**

### Step 5: Update Frontend
1. **Update `app/config.ts`:**
   ```typescript
   export const config = {
     SERVER_URL: process.env.NEXT_PUBLIC_SERVER_URL || 'https://your-project-name.up.railway.app',
     CACHE_BUST: Date.now()
   };
   ```

2. **Deploy frontend to Vercel:**
   ```bash
   vercel --prod
   ```

## 🔧 Server Features

### ✅ Fixed Issues
- **No Host Duplication**: Only one host per room
- **No Player Duplication**: Players stored by socket.id, cleaned on disconnect
- **No Virtual Players**: Page refresh properly cleans up old socket
- **Real-time Updates**: Always broadcasts players list after changes
- **Clear Game Start**: Proper `start-game` event with validation

### 📡 Socket Events
- `create-room` → Creates room, returns roomCode
- `join-room` → Joins room, validates player name
- `start-game` → Host starts game, broadcasts to all players
- `get-room-state` → Returns current players list
- `disconnect` → Cleans up player/room

### 🛡️ Validation
- Room exists before joining
- Room not full (max 9 players)
- Player name not taken
- Host authorization for game start
- Minimum 3 players to start game

## 🧪 Testing Checklist

### Local Testing
- [ ] Server starts without errors
- [ ] Health endpoint returns 200
- [ ] Can create room
- [ ] Can join room
- [ ] Can start game with 3+ players
- [ ] Host disconnection removes room
- [ ] Player disconnection removes player

### Production Testing
- [ ] Railway deployment successful
- [ ] Frontend connects to Railway backend
- [ ] Multiplayer flow works end-to-end
- [ ] No duplicate players
- [ ] Real-time updates work
- [ ] Game starts properly

## 📊 Monitoring

### Railway Logs
- View logs in Railway dashboard
- Look for connection/disconnection events
- Monitor room creation/joining

### Health Check
- `GET https://your-project-name.up.railway.app/api/health`
- Returns server status and room count

## 🆘 Troubleshooting

### Common Issues
1. **CORS errors**: Check Railway URL in frontend config
2. **Connection refused**: Verify Railway deployment is running
3. **Room not found**: Check room code generation and storage
4. **Duplicate players**: Verify socket cleanup on disconnect

### Debug Commands
```bash
# Check Railway logs
railway logs

# Check server health
curl https://your-project-name.up.railway.app/api/health

# Test socket connection
# Use browser console to check WebSocket connection
```

## 🎯 Success Criteria
- ✅ Backend runs on Railway
- ✅ Frontend connects successfully
- ✅ No duplicate players
- ✅ Real-time multiplayer works
- ✅ Game starts properly
- ✅ Clean disconnection handling
