# 🚀 Quick Setup Guide - Sentiment Analysis System

## Prerequisites

1. **Python 3.8+** installed
2. **Node.js 18+** installed
3. **Supabase account** with your project
4. **OpenRouter API key** (free tier available)

## Step 1: Environment Setup

### Backend Configuration
```bash
# Navigate to sentiment analyzer directory
cd backend/community_sentiment_analyzer

# Copy environment template
cp env_template.txt .env

# Edit .env file with your credentials
# - SUPABASE_URL: Your Supabase project URL
# - SUPABASE_SERVICE_KEY: Your Supabase service role key
# - OPENROUTER_API_KEY: Your OpenRouter API key
```

### Get Your API Keys

1. **Supabase Keys**:
   - Go to your Supabase project dashboard
   - Settings → API
   - Copy "Project URL" and "service_role" key

2. **OpenRouter API Key**:
   - Sign up at [OpenRouter](https://openrouter.ai/)
   - Go to API Keys section
   - Create a new API key

## Step 2: Install Dependencies

### Backend Dependencies
```bash
cd backend
pip install -r community_sentiment_analyzer/requirements.txt
```

### Frontend Dependencies
```bash
cd frontend-admin
npm install
```

## Step 3: Start the System

### Option A: Use Startup Scripts (Recommended)

**Windows:**
```bash
# Double-click or run:
start_sentiment_system.bat
```

**Linux/Mac:**
```bash
# Make executable and run:
chmod +x start_sentiment_system.sh
./start_sentiment_system.sh
```

### Option B: Manual Start

**Terminal 1 - Backend:**
```bash
cd backend
python start_sentiment_analyzer.py
```

**Terminal 2 - Frontend:**
```bash
cd frontend-admin
npm run dev
```

## Step 4: Access the Dashboard

- **Admin Dashboard**: http://localhost:3002
- **API Health Check**: http://localhost:5001/api/health

## Step 5: Test the System

1. **Check Health**: Visit http://localhost:5001/api/health
2. **View Dashboard**: Visit http://localhost:3002
3. **Test Analysis**: Click "Refresh Data" in dashboard

## Troubleshooting

### Common Issues

1. **"Module not found" errors**:
   ```bash
   # Reinstall dependencies
   pip install -r requirements.txt
   npm install
   ```

2. **"Connection refused" errors**:
   - Check if ports 5001 and 3002 are available
   - Ensure environment variables are set correctly

3. **"API key invalid" errors**:
   - Verify your OpenRouter API key
   - Check Supabase credentials

4. **Charts not loading**:
   - Check browser console for errors
   - Ensure backend is running and accessible

### Debug Mode

**Backend Debug:**
```bash
export FLASK_DEBUG=1
python start_sentiment_analyzer.py
```

**Frontend Debug:**
```bash
# Check browser console for errors
# Verify API calls in Network tab
```

## Next Steps

1. **Configure Webhooks** (Optional):
   - Set up Supabase webhooks for automatic analysis
   - Configure database triggers

2. **Customize Dashboard**:
   - Modify chart colors and layouts
   - Add additional metrics

3. **Production Deployment**:
   - Set up production environment
   - Configure proper security settings

## Support

If you encounter issues:
1. Check the troubleshooting section
2. Verify all environment variables
3. Ensure all dependencies are installed
4. Check service logs for errors

---

**🎉 You're all set!** The sentiment analysis system should now be running and analyzing your community data. 