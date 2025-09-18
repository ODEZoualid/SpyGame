# 🚀 Deployment Guide

This guide covers deploying the Spy Game multiplayer application to production.

## 📋 Prerequisites

- Node.js 18+ installed
- Vercel account (for frontend)
- Railway account (for backend)
- Git repository

## 🎯 Architecture

```
Frontend (Vercel)     Backend (Railway)
     ↓                      ↓
https://spy-game.com  https://spy-game-api.com
     ↓                      ↓
   Next.js 14          Express + Socket.IO
     ↓                      ↓
   Socket.IO Client    Real-time Server
```

## 🖥️ Backend Deployment (Railway)

### 1. Prepare Backend
```bash
cd server
npm install
```

### 2. Deploy to Railway
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Initialize project
railway init

# Deploy
railway up
```

### 3. Set Environment Variables
In Railway dashboard, set:
```
PORT=3001
NODE_ENV=production
CORS_ORIGIN=https://your-frontend-url.vercel.app
```

### 4. Get Backend URL
Railway will provide a URL like:
```
https://spy-game-api-production.up.railway.app
```

## 🌐 Frontend Deployment (Vercel)

### 1. Prepare Frontend
```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login
```

### 2. Set Environment Variables
Create `.env.local`:
```
NEXT_PUBLIC_SERVER_URL=https://spy-game-api-production.up.railway.app
```

### 3. Deploy to Vercel
```bash
vercel --prod
```

### 4. Update Backend CORS
Update Railway environment variable:
```
CORS_ORIGIN=https://your-app.vercel.app
```

## 🔧 Alternative Deployment Options

### Backend Alternatives

#### Heroku
```bash
# Install Heroku CLI
npm install -g heroku

# Login
heroku login

# Create app
heroku create spy-game-api

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set CORS_ORIGIN=https://your-frontend-url.com

# Deploy
git push heroku main
```

#### DigitalOcean App Platform
1. Connect GitHub repository
2. Select Node.js buildpack
3. Set environment variables
4. Deploy

#### AWS Elastic Beanstalk
1. Create new application
2. Upload server code
3. Configure environment
4. Deploy

### Frontend Alternatives

#### Netlify
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build and deploy
npm run build
netlify deploy --prod --dir=out
```

#### AWS S3 + CloudFront
1. Build the project
2. Upload to S3 bucket
3. Configure CloudFront distribution
4. Set up custom domain

## 🐳 Docker Deployment

### Backend Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
EXPOSE 3001

CMD ["npm", "start"]
```

### Frontend Dockerfile
```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

### Docker Compose
```yaml
version: '3.8'
services:
  backend:
    build: ./server
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - CORS_ORIGIN=http://localhost:3000

  frontend:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_SERVER_URL=http://localhost:3001
    depends_on:
      - backend
```

## 🔒 SSL/HTTPS Setup

### Vercel (Automatic)
- SSL is automatically enabled
- Custom domains get free SSL

### Railway (Automatic)
- SSL is automatically enabled
- Custom domains get free SSL

### Manual SSL Setup
```bash
# Using Let's Encrypt
certbot --nginx -d yourdomain.com
```

## 📊 Monitoring & Analytics

### Backend Monitoring
```javascript
// Add to server.js
const express = require('express');
const app = express();

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});
```

### Frontend Analytics
```javascript
// Add to _app.js
import { Analytics } from '@vercel/analytics/react';

export default function App({ Component, pageProps }) {
  return (
    <>
      <Component {...pageProps} />
      <Analytics />
    </>
  );
}
```

## 🚨 Troubleshooting

### Common Issues

#### CORS Errors
```
Access to fetch at 'https://api.example.com' from origin 'https://app.example.com' has been blocked by CORS policy
```
**Solution**: Update `CORS_ORIGIN` environment variable

#### Socket.IO Connection Failed
```
WebSocket connection to 'wss://api.example.com/socket.io/' failed
```
**Solution**: Check if backend is running and accessible

#### Build Failures
```
Module not found: Can't resolve 'socket.io-client'
```
**Solution**: Run `npm install` in frontend directory

#### Environment Variables Not Loading
```
process.env.NEXT_PUBLIC_SERVER_URL is undefined
```
**Solution**: Restart Vercel deployment after adding env vars

### Debug Commands

#### Check Backend Health
```bash
curl https://your-backend-url.com/api/health
```

#### Test Socket.IO Connection
```bash
node server/test-server.js
```

#### Check Frontend Build
```bash
npm run build
npm start
```

## 🔄 CI/CD Pipeline

### GitHub Actions
```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: cd server && npm install
      - run: cd server && npm test
      - run: railway up

  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build
      - run: vercel --prod --token ${{ secrets.VERCEL_TOKEN }}
```

## 📈 Performance Optimization

### Backend
- Use Redis for session storage
- Implement rate limiting
- Add request compression
- Monitor memory usage

### Frontend
- Enable Next.js Image Optimization
- Use CDN for static assets
- Implement service worker
- Add performance monitoring

## 🔐 Security Checklist

- [ ] Environment variables secured
- [ ] CORS properly configured
- [ ] Input validation implemented
- [ ] Rate limiting enabled
- [ ] HTTPS enforced
- [ ] Dependencies updated
- [ ] Error messages sanitized
- [ ] Authentication implemented (if needed)

## 📞 Support

For deployment issues:
1. Check logs in Railway/Vercel dashboard
2. Verify environment variables
3. Test locally first
4. Check network connectivity
5. Review error messages

---

**Happy Deploying! 🚀**
