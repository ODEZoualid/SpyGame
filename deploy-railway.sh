#!/bin/bash

echo "🚀 Deploying Spy Game Backend to Railway..."

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Installing..."
    npm install -g @railway/cli
fi

# Login to Railway (will open browser)
echo "🔐 Please login to Railway in your browser..."
railway login

# Initialize project if not already done
echo "📁 Initializing Railway project..."
railway init

# Set environment variables
echo "⚙️ Setting environment variables..."
railway variables set NODE_ENV=production
railway variables set PORT=3001
railway variables set CORS_ORIGIN=https://spy-game-darija-fp1lslkxk-vievimie-3261s-projects.vercel.app

# Deploy
echo "🚀 Deploying to Railway..."
railway up

echo "✅ Backend deployed! Check the URL in Railway dashboard."
echo "🔗 Frontend: https://spy-game-darija-fp1lslkxk-vievimie-3261s-projects.vercel.app"
