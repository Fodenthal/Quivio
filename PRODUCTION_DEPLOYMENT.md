# Production Deployment Guide

This guide covers deploying the Quivio application to production, including both the Node.js server and the new Python RAG service.

## Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Next.js Web   │    │  Colyseus Server │    │  Python RAG     │
│   Application   │◄──►│   (Node.js)      │◄──►│   Service       │
│                 │    │                  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Prerequisites

### Required Environment Variables

**For the Server (Node.js):**
- `GEMINI_API_KEY` - Google Gemini API key
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `RAG_SERVICE_URL` - URL of the RAG service (auto-set in production)

**For the RAG Service (Python):**
- `OPENAI_API_KEY` - OpenAI API key for embeddings
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key

## Deployment Options

### Option 1: Render Blueprint (Recommended)

The easiest way to deploy both services is using Render's Blueprint feature:

1. **Push your code to GitHub** with the new `render.yaml` file
2. **Go to Render Dashboard**: https://dashboard.render.com
3. **Create New Blueprint Instance**
4. **Connect your GitHub repository**
5. **Deploy** - Render will automatically create both services

### Option 2: Manual Deployment

If you prefer to deploy services separately:

#### Deploy RAG Service First

1. **Create a new Web Service** on Render
2. **Connect your GitHub repository**
3. **Set build settings**:
   - **Build Command**: `cd apps/rag-service && pip install uv && uv sync --frozen`
   - **Start Command**: `cd apps/rag-service && uv run uvicorn main:app --host 0.0.0.0 --port $PORT`
4. **Set environment variables** (see prerequisites)
5. **Deploy**

#### Deploy Server

1. **Create a new Web Service** on Render
2. **Connect your GitHub repository**
3. **Set build settings**:
   - **Build Command**: `cd apps/server && npm install && npm run build`
   - **Start Command**: `cd apps/server && npm start`
4. **Set environment variables** including `RAG_SERVICE_URL`
5. **Deploy**

## Deployment Steps

### Step 1: Prepare Your Repository

Ensure your repository has all the necessary files:

```bash
# Check that all files are present
ls -la
# Should include:
# - render.yaml
# - apps/rag-service/Dockerfile
# - apps/rag-service/.dockerignore
# - apps/rag-service/env.example
# - deploy.sh
```

### Step 2: Test Locally (Optional)

Before deploying, you can test the setup locally:

```bash
# Test the deployment script
./deploy.sh --test-local
```

### Step 3: Deploy to Production

#### Using the Deployment Script

```bash
# Deploy both services
./deploy.sh
```

#### Using Render Dashboard

1. Go to https://dashboard.render.com
2. Click "New +" → "Blueprint Instance"
3. Connect your GitHub repository
4. Review the services that will be created
5. Click "Apply"

### Step 4: Configure Environment Variables

After deployment, configure environment variables for each service:

#### RAG Service Environment Variables

1. Go to your RAG service in Render dashboard
2. Navigate to "Environment" tab
3. Add the following variables:
   ```
   OPENAI_API_KEY=your-openai-key
   SUPABASE_URL=your-supabase-url
   SUPABASE_ANON_KEY=your-supabase-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
   ```

#### Server Environment Variables

1. Go to your server in Render dashboard
2. Navigate to "Environment" tab
3. Add the following variables:
   ```
   GEMINI_API_KEY=your-gemini-key
   SUPABASE_URL=your-supabase-url
   SUPABASE_ANON_KEY=your-supabase-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
   RAG_SERVICE_URL=https://your-rag-service-name.onrender.com
   ```

### Step 5: Verify Deployment

#### Check RAG Service Health

```bash
# Test the health endpoint
curl https://your-rag-service-name.onrender.com/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-30T00:00:00Z",
  "checks": {
    "vector_store": {"status": "pass"},
    "embedding_cache": {"status": "pass"}
  }
}
```

#### Test Context Endpoint

```bash
# Test the context endpoint
curl -X POST https://your-rag-service-name.onrender.com/get-context \
  -H "Content-Type: application/json" \
  -d '{"topic": "Albert Einstein", "category": "History"}'
```

#### Check Server Logs

1. Go to your server in Render dashboard
2. Navigate to "Logs" tab
3. Look for successful RAG service connections

## Monitoring and Troubleshooting

### Health Checks

Both services include health check endpoints:

- **Server**: `https://your-server-name.onrender.com/health`
- **RAG Service**: `https://your-rag-service-name.onrender.com/health`

### Common Issues

#### RAG Service Not Responding

1. **Check environment variables** - Ensure all required variables are set
2. **Check logs** - Look for startup errors in Render logs
3. **Test locally** - Use `./deploy.sh --test-local` to test locally

#### Server Can't Connect to RAG Service

1. **Verify RAG_SERVICE_URL** - Ensure it points to the correct RAG service URL
2. **Check network connectivity** - Both services should be on the same Render account
3. **Check RAG service health** - Ensure the RAG service is running

#### Performance Issues

1. **Monitor response times** - Check Render metrics
2. **Check cache hit rates** - Monitor embedding cache performance
3. **Scale if needed** - Consider upgrading to a higher tier plan

### Logs and Debugging

#### RAG Service Logs

Look for these log patterns:
- `✅ Vector store initialized successfully` - Successful startup
- `📚 Enhanced question generation` - Successful context retrieval
- `⚠️ RAG service timeout` - Performance issues
- `❌ Could not resolve topic` - Title resolution failures

#### Server Logs

Look for these log patterns:
- `🔍 Requesting RAG context` - RAG service requests
- `📚 Enhanced question generation` - Successful context usage
- `⚠️ RAG service timeout` - RAG service issues
- `🔄 Falling back to basic prompt` - RAG service fallbacks

## Scaling Considerations

### Current Limitations

- **Free tier**: 750 hours/month per service
- **Starter plan**: $7/month per service
- **Memory limits**: 512MB RAM per service

### When to Scale

Consider upgrading when you see:
- High response times (>2 seconds)
- Memory usage >80%
- Frequent timeouts
- High error rates

### Scaling Options

1. **Upgrade plan tier** - More CPU/memory
2. **Add caching layer** - Redis for better performance
3. **Load balancing** - Multiple instances
4. **CDN** - For static assets

## Security Considerations

### Environment Variables

- Never commit API keys to version control
- Use Render's environment variable encryption
- Rotate keys regularly

### Network Security

- Services communicate over HTTPS
- Internal communication uses Render's private network
- No direct database access from client

### Rate Limiting

- Wikipedia API: 100 requests/minute
- OpenAI API: Varies by plan
- Render: Built-in rate limiting

## Maintenance

### Regular Tasks

1. **Monitor logs** - Check for errors weekly
2. **Update dependencies** - Monthly security updates
3. **Backup data** - Ensure Supabase backups are enabled
4. **Review costs** - Monitor API usage and costs

### Updates

To update the application:

1. **Push changes** to GitHub
2. **Render auto-deploys** (if enabled)
3. **Or manually redeploy** from dashboard
4. **Test endpoints** after deployment

## Support

If you encounter issues:

1. **Check this guide** - Common solutions
2. **Review logs** - Error details
3. **Test locally** - Isolate issues
4. **Contact support** - Render or project maintainers

## Cost Estimation

### Monthly Costs (Starter Plans)

- **Server**: $7/month
- **RAG Service**: $7/month
- **API Usage**: Varies by usage
  - OpenAI: ~$0.0001 per embedding
  - Gemini: ~$0.0005 per request
  - Wikipedia: Free

**Total**: ~$14/month + API usage 