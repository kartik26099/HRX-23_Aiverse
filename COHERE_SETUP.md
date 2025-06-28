# Cohere API Key Setup Guide

## 🚀 Step-by-Step Instructions

### 1. Create Cohere Account
1. Go to [Cohere](https://cohere.ai/)
2. Click "Get Started" or "Sign Up"
3. Create your account with email
4. Verify your email address

### 2. Get Your API Key
1. After signing in, go to [Cohere Dashboard](https://dashboard.cohere.ai/)
2. Look for "API Keys" in the sidebar
3. Click "Create API Key"
4. Give it a name like "Sentiment Analysis"
5. Click "Create"
6. **Copy the API key immediately** (starts with `cohere_`)

### 3. Add to Your Environment
1. Go to `backend/community_sentiment_analyzer/`
2. Create or edit `.env` file
3. Add your key:
   ```bash
   COHERE_API_KEY=cohere_your_key_here
   SENTIMENT_METHOD=cohere
   ```

### 4. Test Your Setup
```bash
# Restart your backend
cd backend/community_sentiment_analyzer
python app.py

# Test the health endpoint
curl http://localhost:5001/api/health
```

## ✅ Benefits
- **Free Tier**: 1000 requests/month free
- **Excellent Accuracy**: Very good sentiment detection
- **Fast**: Optimized API
- **Professional**: Used by many companies

## 🔗 Direct Links
- [Sign Up](https://cohere.ai/)
- [Dashboard](https://dashboard.cohere.ai/)
- [Documentation](https://docs.cohere.ai/)

## 💡 Pro Tips
- Free tier is 1000 requests/month
- Very reliable and fast
- Good for production use
- Easy to upgrade to paid plan if needed

## 📊 Pricing
- **Free**: 1000 requests/month
- **Paid**: $0.10 per 1000 requests after free tier
- **No credit card required** for free tier 