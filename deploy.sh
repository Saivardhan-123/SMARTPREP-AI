#!/bin/bash

# SMARTPREP Deployment Script
# This script helps prepare your application for deployment

echo "🚀 SMARTPREP Deployment Preparation Script"
echo "=========================================="

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "❌ Git repository not found. Please initialize git first:"
    echo "   git init"
    echo "   git add ."
    echo "   git commit -m 'Initial commit'"
    echo "   git remote add origin <your-github-repo-url>"
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Creating from template..."
    cp env.example .env
    echo "✅ Created .env file from template"
    echo "📝 Please edit .env file with your actual values:"
    echo "   - OPENROUTER_API_KEY"
    echo "   - SESSION_SECRET"
else
    echo "✅ .env file found"
fi

# Check if all required files exist
echo "📋 Checking required files..."

required_files=("package.json" "server.js" "render.yaml" ".gitignore" "README.md" "config.js" "database.js" "auth.js")
missing_files=()

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file (missing)"
        missing_files+=("$file")
    fi
done

if [ ${#missing_files[@]} -ne 0 ]; then
    echo "❌ Missing required files: ${missing_files[*]}"
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    if [ $? -eq 0 ]; then
        echo "✅ Dependencies installed successfully"
    else
        echo "❌ Failed to install dependencies"
        exit 1
    fi
else
    echo "✅ Dependencies already installed"
fi

# Test the application locally
echo "🧪 Testing application locally..."
npm start &
PID=$!
sleep 5

if kill -0 $PID 2>/dev/null; then
    echo "✅ Application started successfully"
    kill $PID
else
    echo "❌ Application failed to start"
    exit 1
fi

# Check git status
echo "📊 Git status:"
git status --porcelain

if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  You have uncommitted changes"
    echo "💡 Consider committing them before deployment:"
    echo "   git add ."
    echo "   git commit -m 'Prepare for deployment'"
fi

echo ""
echo "🎉 Deployment preparation completed!"
echo ""
echo "📋 Next steps:"
echo "1. Push your code to GitHub:"
echo "   git push origin main"
echo ""
echo "2. Deploy to Render:"
echo "   - Go to https://dashboard.render.com"
echo "   - Create new Web Service"
echo "   - Connect your GitHub repository"
echo "   - Set environment variables:"
echo "     - NODE_ENV=production"
echo "     - PORT=10000"
echo "     - SESSION_SECRET=<your-secret>"
echo "     - OPENROUTER_API_KEY=<your-api-key>"
echo ""
echo "3. For detailed instructions, see RENDER_DEPLOYMENT.md"
echo ""
echo "🔗 Useful links:"
echo "   - Render Dashboard: https://dashboard.render.com"
echo "   - OpenRouter API: https://openrouter.ai"
echo "   - Deployment Guide: RENDER_DEPLOYMENT.md"
