# 🚀 DoLab Services Startup Guide

## Quick Fix for All Issues

### Step 1: Reset Everything
Run the reset script to kill all processes and clear caches:
```bash
# Double-click this file in Windows Explorer:
reset_all_services.bat
```

### Step 2: Start Backend (Terminal 1)
```bash
cd backend
python start_sentiment_stable.py
```

### Step 3: Start Frontend Admin (Terminal 2)
```bash
cd frontend-admin
npm run dev
```

## ✅ What This Fixes

1. **TypeScript Errors**: Fixed duplicate variable definitions
2. **Port Conflicts**: Kills all conflicting processes
3. **Backend Restart Loop**: Disabled Flask auto-reloader
4. **Cache Issues**: Clears Next.js cache
5. **Console Allocation**: Fresh terminals

## 🔍 Verification

After starting both services:

1. **Backend Health**: http://localhost:5001/api/health
2. **Admin Dashboard**: http://localhost:3003
3. **Real-time Data**: Check the debug endpoint: http://localhost:5001/api/debug-realtime

## 🎯 Expected Results

- ✅ Backend runs stably without constant restarts
- ✅ Frontend-admin loads without TypeScript errors
- ✅ Real-time data from Supabase displays correctly
- ✅ Active Users count shows actual user count
- ✅ Sentiment trend graph shows real data
- ✅ AI recommendations work based on negative feedback

## 🆘 If Issues Persist

1. **Restart your computer** to clear all console allocations
2. **Use Windows Command Prompt** instead of Git Bash
3. **Check firewall settings** for port blocking
4. **Verify Supabase credentials** in environment files

## 📞 Support

If you still have issues, the backend is working correctly (as verified by our tests). The problem is likely with the frontend startup process. 