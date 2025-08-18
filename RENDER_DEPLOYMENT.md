# Render Deployment Guide for SMARTPREP

This guide will walk you through deploying your SMARTPREP application to Render.

## Prerequisites

1. **GitHub Account**: Your code must be in a GitHub repository
2. **Render Account**: Sign up at [render.com](https://render.com)
3. **OpenRouter API Key**: Get your API key from [openrouter.ai](https://openrouter.ai)

## Step 1: Prepare Your Repository

### 1.1 Ensure your repository is ready
Make sure your repository contains:
- `package.json` with all dependencies
- `server.js` as the main entry point
- `render.yaml` for configuration
- `.gitignore` to exclude sensitive files
- All your application files

### 1.2 Push to GitHub
```bash
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

## Step 2: Deploy to Render

### 2.1 Create a New Web Service

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" button
3. Select "Web Service"
4. Connect your GitHub account if not already connected
5. Select your SMARTPREP repository

### 2.2 Configure the Web Service

Fill in the following details:

- **Name**: `smartprep` (or your preferred name)
- **Environment**: `Node`
- **Region**: Choose closest to your users
- **Branch**: `main` (or your default branch)
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Plan**: `Free` (for testing) or `Starter` (for production)

### 2.3 Environment Variables

Click on "Environment" tab and add these variables:

| Key | Value | Description |
|-----|-------|-------------|
| `NODE_ENV` | `production` | Environment mode |
| `PORT` | `10000` | Port for the application |
| `SESSION_SECRET` | `[Auto-generated]` | Session encryption key |
| `OPENROUTER_API_KEY` | `your-api-key-here` | Your OpenRouter API key |

**Important**: 
- For `SESSION_SECRET`, you can use Render's auto-generate feature or create a strong random string
- Replace `your-api-key-here` with your actual OpenRouter API key

### 2.4 Advanced Settings (Optional)

- **Health Check Path**: `/health`
- **Auto-Deploy**: Enable for automatic deployments on push
- **Pull Request Previews**: Enable if you want preview deployments

### 2.5 Deploy

1. Click "Create Web Service"
2. Render will start building your application
3. Monitor the build logs for any errors
4. Once successful, your app will be available at the provided URL

## Step 3: Verify Deployment

### 3.1 Check Health Endpoint
Visit: `https://your-app-name.onrender.com/health`
Should return: `{"status":"ok"}`

### 3.2 Test Main Application
Visit: `https://your-app-name.onrender.com`
Should show your login page

### 3.3 Check Logs
In Render dashboard:
1. Go to your service
2. Click "Logs" tab
3. Monitor for any errors or issues

## Step 4: Custom Domain (Optional)

### 4.1 Add Custom Domain
1. In your Render service dashboard
2. Go to "Settings" → "Custom Domains"
3. Add your domain
4. Update DNS records as instructed

## Troubleshooting

### Common Issues

#### 1. Build Failures
**Error**: `npm install` fails
**Solution**: 
- Check `package.json` for correct dependencies
- Ensure Node.js version compatibility
- Check for any missing files

#### 2. Application Crashes
**Error**: Application starts but crashes
**Solution**:
- Check environment variables are set correctly
- Verify API keys are valid
- Check application logs in Render dashboard

#### 3. Database Issues
**Error**: SQLite database problems
**Solution**:
- SQLite files are ephemeral on Render free tier
- Consider using a persistent database for production
- Check database initialization in logs

#### 4. Port Issues
**Error**: Port binding problems
**Solution**:
- Ensure `PORT` environment variable is set to `10000`
- Check that your app uses `process.env.PORT`

### Debugging Steps

1. **Check Build Logs**: Look for any errors during the build process
2. **Check Runtime Logs**: Monitor application logs for runtime errors
3. **Test Locally**: Ensure your app works locally with the same environment variables
4. **Verify Environment Variables**: Double-check all environment variables are set correctly

## Performance Optimization

### For Production Use

1. **Upgrade Plan**: Consider upgrading from Free to Starter plan for better performance
2. **Database**: Use a persistent database service for production
3. **Caching**: Implement caching for frequently accessed data
4. **CDN**: Use a CDN for static assets

### Monitoring

1. **Uptime Monitoring**: Set up uptime monitoring for your application
2. **Error Tracking**: Implement error tracking and logging
3. **Performance Monitoring**: Monitor response times and resource usage

## Security Considerations

1. **Environment Variables**: Never commit sensitive data to your repository
2. **API Keys**: Keep your API keys secure and rotate them regularly
3. **HTTPS**: Render provides HTTPS by default
4. **Session Security**: Use strong session secrets in production

## Support

If you encounter issues:

1. Check Render's [documentation](https://render.com/docs)
2. Review your application logs
3. Test locally with the same configuration
4. Contact Render support if needed

## Next Steps

After successful deployment:

1. Set up monitoring and alerting
2. Configure custom domain
3. Set up CI/CD pipeline
4. Implement backup strategies
5. Plan for scaling

Your SMARTPREP application should now be successfully deployed on Render! 🚀
