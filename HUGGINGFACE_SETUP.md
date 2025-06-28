# HuggingFace API Key Setup Guide

## 🚀 Step-by-Step Instructions

### 1. Create HuggingFace Account
1. Go to [HuggingFace](https://huggingface.co/join)
2. Click "Sign Up" and create your account
3. Verify your email address

### 2. Get Your API Key
1. Go to [HuggingFace Settings](https://huggingface.co/settings/tokens)
2. Click "New token"
3. Give it a name like "Sentiment Analysis"
4. Select "Read" role (that's all you need)
5. Click "Generate token"
6. **Copy the token immediately** (you won't see it again!)

### 3. Add to Your Environment
1. Go to `backend/community_sentiment_analyzer/`
2. Create or edit `.env` file
3. Add your key:
   ```bash
   HUGGINGFACE_API_KEY=hf_your_token_here
   SENTIMENT_METHOD=huggingface
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
- **Free**: No credit card required
- **Generous Limits**: 30,000 requests/month free
- **Fast**: Optimized for sentiment analysis
- **Reliable**: Used by thousands of developers

## 🔗 Direct Links
- [Sign Up](https://huggingface.co/join)
- [API Tokens](https://huggingface.co/settings/tokens)
- [Documentation](https://huggingface.co/docs/api-inference)

## 💡 Pro Tips
- Keep your token secure
- The free tier is very generous
- No rate limiting issues like OpenRouter
- Works great for sentiment analysis 