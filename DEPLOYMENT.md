# SmartPrep Deployment Guide

## ✅ Issues Fixed

1. **OpenAI to OpenRouter Migration**: Successfully converted from OpenAI API to OpenRouter API
2. **Port Configuration**: Fixed server to run on port 8080 (local) and use environment PORT (production)
3. **API Route Order**: Fixed catch-all route to not interfere with API endpoints
4. **Dynamic URLs**: Frontend now automatically detects environment and uses correct API URLs

## 🚀 Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   - Create `.env` file with your OpenRouter API key:
   ```
   OPENROUTER_API_KEY="your_openrouter_api_key_here"
   ```

3. **Start the server:**
   ```bash
   node server.js
   ```

4. **Access the application:**
   - Open http://localhost:8080 in your browser

## 🌐 Render Deployment

### Prerequisites
1. Get an OpenRouter API key from [https://openrouter.ai/](https://openrouter.ai/)
2. Create a Render account

### Deployment Steps

1. **Connect your GitHub repository to Render**

2. **Create a new Web Service**

3. **Configure the service:**
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Environment:** Node

4. **Add Environment Variables:**
   - `OPENROUTER_API_KEY`: Your OpenRouter API key
   - `NODE_ENV`: `production`

5. **Deploy**

### Environment Variables for Render
```
OPENROUTER_API_KEY=your_openrouter_api_key_here
NODE_ENV=production
```

## 🔧 Configuration Details

### Server Configuration
- **Port**: Uses `process.env.PORT` (Render sets this automatically) or defaults to 8080
- **Static Files**: Serves from `public/` directory
- **API Routes**: All API routes are prefixed correctly
- **CORS**: Enabled for cross-origin requests

### Frontend Configuration
- **Dynamic API URLs**: Automatically detects environment
  - Local: `http://localhost:8080`
  - Production: `https://your-render-url.onrender.com`

### OpenRouter Integration
- **Model**: `cognitivecomputations/dolphin-mistral-24b-venice-edition:free`
- **Headers**: Properly configured with dynamic HTTP-Referer
- **Error Handling**: Comprehensive error handling for API failures

## 🧪 Testing

### Local Testing
```bash
# Test health endpoint
curl http://localhost:8080/health

# Test subjects API
curl "http://localhost:8080/get-subjects?state=Karnataka&curriculum=CBSE&grade=10"
```

### Production Testing
```bash
# Test health endpoint
curl https://your-render-url.onrender.com/health

# Test subjects API
curl "https://your-render-url.onrender.com/get-subjects?state=Karnataka&curriculum=CBSE&grade=10"
```

## 🐛 Troubleshooting

### Common Issues

1. **"Unexpected token '<', "<!DOCTYPE "..." error**
   - **Cause**: API returning HTML instead of JSON
   - **Solution**: Check if API routes are properly configured and not being intercepted by catch-all route

2. **401 Unauthorized Error**
   - **Cause**: Invalid or missing OpenRouter API key
   - **Solution**: Verify your OpenRouter API key is correct and properly set in environment variables

3. **CORS Errors**
   - **Cause**: Cross-origin request issues
   - **Solution**: CORS is already configured in the server

4. **Port Issues**
   - **Cause**: Wrong port configuration
   - **Solution**: Server uses `process.env.PORT` for production, 8080 for local development

## 📝 API Endpoints

- `GET /health` - Health check
- `GET /get-subjects` - Get subjects for state/curriculum/grade
- `GET /get-topics` - Get topics for a subject
- `GET /get-chapters` - Get chapters for a subject
- `POST /api/get-chapter-content` - Get content for a topic
- `POST /api/generate-summary` - Generate summary
- `POST /api/generate-mcq` - Generate MCQs

## 🔄 Updates Made

1. **Removed OpenAI dependency** from package.json
2. **Updated all API calls** to use OpenRouter endpoints
3. **Fixed route ordering** in server.js
4. **Added dynamic URL configuration** in frontend
5. **Updated HTTP-Referer headers** for proper OpenRouter integration
6. **Fixed port configuration** for local development
