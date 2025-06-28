# 🚀 Final Execution Guide - Sentiment Analysis System

## ✅ **System Status: READY TO RUN**

Your sentiment analysis system is now fully configured and ready to execute. Here's the complete step-by-step guide:

## 📋 **Prerequisites Checklist**

- [x] Python 3.8+ installed
- [x] Node.js 18+ installed  
- [x] Supabase project with your database
- [x] OpenRouter API key (free tier available)

## 🔧 **Step 1: Environment Setup**

### **Create .env file:**
```bash
# Navigate to sentiment analyzer directory
cd backend/community_sentiment_analyzer

# Copy environment template
cp env_template.txt .env

# Edit .env with your actual credentials
notepad .env  # Windows
# OR
nano .env     # Linux/Mac
```

### **Required .env content:**
```bash
# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key_here

# OpenRouter Configuration  
OPENROUTER_API_KEY=your_openrouter_api_key_here

# Flask Configuration
PORT=5001
FLASK_ENV=development
FLASK_DEBUG=1
```

## 📦 **Step 2: Install Dependencies**

### **Backend Dependencies:**
```bash
# Navigate to backend
cd backend

# Create virtual environment (if not exists)
python -m venv venv

# Activate virtual environment
venv\Scripts\activate  # Windows
# OR
source venv/bin/activate  # Linux/Mac

# Install Python dependencies
pip install -r community_sentiment_analyzer/requirements.txt
```

### **Frontend Dependencies:**
```bash
# Open new terminal window
cd frontend-admin

# Install Node.js dependencies
npm install
```

## 🚀 **Step 3: Start the System**

### **Option A: Automated Startup (Recommended)**

**Windows:**
```bash
# From project root
start_sentiment_system.bat
```

**Linux/Mac:**
```bash
# From project root
chmod +x start_sentiment_system.sh
./start_sentiment_system.sh
```

### **Option B: Manual Startup**

**Terminal 1 - Backend:**
```bash
cd backend
venv\Scripts\activate  # Windows
python start_sentiment_analyzer.py
```

**Terminal 2 - Frontend:**
```bash
cd frontend-admin
npm run dev
```

## 🧪 **Step 4: Test the System**

### **Run the test script:**
```bash
# From project root
python test_sentiment_system.py
```

### **Manual testing:**
- **Health Check**: http://localhost:5001/api/health
- **Admin Dashboard**: http://localhost:3002
- **Sentiment Analysis**: http://localhost:5001/api/sentiment-analysis

## 📊 **Expected Output**

### **Backend Terminal:**
```
🚀 Starting Community Sentiment Analyzer on port 5001
📊 Dashboard: http://localhost:3002
🔍 Health Check: http://localhost:5001/api/health
✅ Supabase client initialized successfully
 * Running on http://0.0.0.0:5001
```

### **Frontend Terminal:**
```
> hackronx-admin-dashboard@0.1.0 dev
> next dev -p 3002
- ready started server on 0.0.0.0:3002, url: http://localhost:3002
```

### **Test Script Output:**
```
🧪 Testing Community Sentiment Analysis System
==================================================
✅ Health check passed!
✅ Sentiment analysis successful!
✅ Admin dashboard is accessible!

🎉 All tests passed! Your sentiment analysis system is working correctly.
```

## 🎯 **Dashboard Features**

Once running, you'll have access to:

### **📈 Interactive Charts:**
1. **Posts Sentiment Distribution** (Pie Chart)
2. **Comments Sentiment Distribution** (Pie Chart)  
3. **Tag Sentiment Analysis** (Bar Chart)
4. **Sentiment Over Time** (Area Chart)

### **📊 Real-time Statistics:**
- Total posts and comments
- Positive/negative sentiment percentages
- Tag-based analysis
- AI-generated recommendations

### **🔄 Auto-refresh System:**
- Automatic cache invalidation
- 5-minute refresh cycles
- Manual refresh button

## 🔧 **Troubleshooting**

### **Common Issues:**

1. **"Module not found" errors:**
   ```bash
   # Reinstall dependencies
   pip install -r community_sentiment_analyzer/requirements.txt
   npm install
   ```

2. **"Connection refused" errors:**
   - Check if ports 5001 and 3002 are available
   - Ensure environment variables are set correctly

3. **"API key invalid" errors:**
   - Verify your OpenRouter API key
   - Check Supabase credentials

4. **"Supabase client error":**
   - Ensure .env file is in correct location
   - Verify Supabase URL and service key

### **Debug Commands:**
```bash
# Check if services are running
netstat -an | findstr :5001  # Windows
lsof -i :5001                # Linux/Mac

# Test API endpoints
curl http://localhost:5001/api/health
curl http://localhost:5001/api/sentiment-analysis
```

## 🎉 **Success Indicators**

✅ Backend shows "Supabase client initialized successfully"  
✅ Frontend shows "ready started server on 0.0.0.0:3002"  
✅ Health check returns JSON response  
✅ Dashboard loads with charts  
✅ Sentiment analysis returns data  

## 📱 **Access Points**

- **Admin Dashboard**: http://localhost:3002
- **API Health**: http://localhost:5001/api/health  
- **Sentiment Analysis**: http://localhost:5001/api/sentiment-analysis

## 🔄 **Backend Commands**

Once the backend is running, you can use these commands:
```bash
restart  # Restart the service
refresh  # Trigger fresh analysis  
health   # Check service health
quit     # Stop the service
```

---

## 🎯 **Next Steps**

1. **Configure your .env file** with real API keys
2. **Run the startup script** to launch both services
3. **Test the system** using the test script
4. **Access the dashboard** at http://localhost:3002
5. **Enjoy your sentiment analysis system!** 🎉

---

**🚀 Your sentiment analysis system is ready to analyze your community data and provide valuable insights!** 