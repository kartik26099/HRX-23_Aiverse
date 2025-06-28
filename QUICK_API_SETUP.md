# 🚀 Quick API Setup Guide

## 🎯 **RECOMMENDED: Start with HuggingFace (Free)**

### Step 1: Get HuggingFace API Key
1. Go to: https://huggingface.co/join
2. Sign up for free account
3. Go to: https://huggingface.co/settings/tokens
4. Click "New token" → Name it "Sentiment Analysis" → Select "Read" → Generate
5. Copy the token (starts with `hf_`)

### Step 2: Update Your Environment
```bash
# Go to your backend directory
cd backend/community_sentiment_analyzer

# Create or edit .env file
# Add these lines:
HUGGINGFACE_API_KEY=hf_your_token_here
SENTIMENT_METHOD=huggingface
```

### Step 3: Test It
```bash
# Restart your backend
python app.py

# Check if it's working
curl http://localhost:5001/api/health
```

## 🔄 Alternative Options

### Option A: Cohere (Free Tier - 1000 requests/month)
1. Go to: https://cohere.ai/
2. Sign up for free account
3. Go to dashboard → API Keys → Create API Key
4. Copy the key (starts with `cohere_`)
5. Add to `.env`:
   ```bash
   COHERE_API_KEY=cohere_your_key_here
   SENTIMENT_METHOD=cohere
   ```

### Option B: Rule-Based (No API Key Needed)
```bash
# In your .env file:
SENTIMENT_METHOD=rule_based
# No API keys needed!
```

## 📊 Comparison

| Service | Cost | Setup | Rate Limits | Accuracy |
|---------|------|-------|-------------|----------|
| **HuggingFace** | Free | 2 min | 30K/month | 85-90% |
| **Cohere** | Free tier | 2 min | 1K/month | 90-95% |
| **Rule-Based** | Free | 0 min | None | 70-80% |
| **OpenRouter** | Pay per use | 5 min | Strict | 90-95% |

## 🎯 **My Recommendation**

**Start with HuggingFace** because:
- ✅ Completely free
- ✅ No credit card needed
- ✅ 30,000 requests/month
- ✅ No rate limiting issues
- ✅ Takes 2 minutes to setup

## 🆘 Need Help?

If you get stuck:
1. Use rule-based analysis (no setup needed)
2. Check the detailed guides in the files I created
3. The system automatically falls back to rule-based if APIs fail

## 🔗 Quick Links
- [HuggingFace Sign Up](https://huggingface.co/join)
- [HuggingFace API Tokens](https://huggingface.co/settings/tokens)
- [Cohere Sign Up](https://cohere.ai/)
- [OpenRouter](https://openrouter.ai/) 