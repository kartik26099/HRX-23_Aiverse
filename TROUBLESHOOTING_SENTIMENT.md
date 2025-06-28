# Troubleshooting Sentiment Detection Error

## Error: "TypeError: Failed to fetch"

This error occurs when the frontend cannot connect to the backend sentiment detection API. Here's how to fix it:

## 🔧 **Quick Fixes**

### 1. **Check Backend Server Status**
Make sure the backend server is running:

```bash
# Navigate to backend directory
cd hackronx/backend/Ai\ DIy/

# Start the backend server
python app.py
```

The server should start on port 4009 and show:
```
[ROCKET] AI DIY Service starting on port 4009...
```

### 2. **Test Backend Connection**
Open your browser console on the DIY generator page and run:

```javascript
// Load the test script
// Copy and paste the contents of hackronx/frontend/test-backend-connection.js

// Then run:
testBackendConnection()
```

This will test:
- ✅ Health endpoint (`/health`)
- ✅ Sentiment API (`/api/detect-sentiment`)
- ✅ Roadmap API (`/api/generate-roadmap`)

### 3. **Check Environment Variables**
Make sure your frontend has the correct backend URL:

```bash
# In your frontend .env.local file
NEXT_PUBLIC_BACKEND_URL=http://localhost:4009
```

## 🚀 **How the System Works Now**

### **Automatic Detection (No Camera Required)**
1. **User generates project roadmap**
2. **10 seconds later**: Automatic sentiment detection triggers
3. **Backend check**: System tries to connect to backend first
4. **Fallback**: If backend is unavailable, uses local sentiment generation
5. **Popup shows**: Appropriate options based on detected sentiment

### **Sentiment Types with Project Change Options**
- **Sad**: "You seem a bit down about this project..."
- **Surprise**: "You look surprised! This project might be different..."
- **Disgust**: "You look disgusted! Would you like to adjust..."

### **Available Actions**
- **Change Project**: Reset form for new project
- **Explain Details**: Scroll to project overview
- **No Change**: Continue with current project

## 🔍 **Debugging Steps**

### Step 1: Check Backend Status
```bash
# Check if port 4009 is in use
netstat -an | grep 4009

# Or on Windows
netstat -an | findstr 4009
```

### Step 2: Test API Endpoints
```bash
# Test health endpoint
curl http://localhost:4009/health

# Test sentiment API
curl -X POST http://localhost:4009/api/detect-sentiment \
  -H "Content-Type: application/json" \
  -d '{"auto_detect": true}'
```

### Step 3: Check Browser Console
Open browser developer tools and look for:
- Network errors in the Network tab
- Console errors in the Console tab
- CORS errors

### Step 4: Verify Frontend Configuration
Check that your frontend is using the correct backend URL:
```javascript
// Should show: http://localhost:4009
console.log('Backend URL:', process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4009")
```

## 🛠️ **Common Issues & Solutions**

### Issue 1: Backend Not Starting
**Error**: `ModuleNotFoundError: No module named 'cv2'`
**Solution**: Install OpenCV
```bash
pip install opencv-python
```

### Issue 2: Port Already in Use
**Error**: `Address already in use`
**Solution**: Kill existing process or change port
```bash
# Kill process on port 4009
lsof -ti:4009 | xargs kill -9

# Or change port in app.py
port = int(os.getenv('PORT', 4010))  # Use different port
```

### Issue 3: CORS Errors
**Error**: `Access to fetch at 'http://localhost:4009' from origin 'http://localhost:3000' has been blocked by CORS policy`
**Solution**: Backend should already have CORS configured, but if not:
```python
from flask_cors import CORS
app = Flask(__name__)
CORS(app)
```

### Issue 4: Environment Variables Not Loading
**Error**: Backend URL shows as undefined
**Solution**: Restart frontend development server
```bash
# Stop frontend (Ctrl+C)
# Then restart
npm run dev
```

## 🎯 **Testing the Fix**

### Manual Test
1. **Start backend**: `python app.py` (should show port 4009)
2. **Start frontend**: `npm run dev` (should show port 3000)
3. **Generate project**: Create a project roadmap
4. **Wait 10 seconds**: Automatic sentiment detection should trigger
5. **Check popup**: Should show sentiment with appropriate options

### Automated Test
```javascript
// In browser console
testBackendConnection()
// Should show all tests passing
```

## 📋 **Expected Behavior**

### When Backend is Available:
- ✅ Shows "Analyzing your reaction to the project..."
- ✅ Calls backend sentiment API
- ✅ Shows popup with backend-generated sentiment
- ✅ Includes project change options for Sad/Surprise/Disgust

### When Backend is Unavailable:
- ✅ Shows "Analyzing your reaction to the project..."
- ✅ Falls back to local sentiment generation
- ✅ Shows popup with locally-generated sentiment
- ✅ Still includes project change options for Sad/Surprise/Disgust

## 🆘 **Still Having Issues?**

If the problem persists:

1. **Check logs**: Look at backend console for error messages
2. **Test manually**: Use the test script to isolate the issue
3. **Verify versions**: Make sure all dependencies are installed
4. **Restart everything**: Stop both frontend and backend, then restart

## 📞 **Support**

The system is designed to work even without the backend (using local sentiment generation), so the sentiment popup should always appear regardless of backend status. 