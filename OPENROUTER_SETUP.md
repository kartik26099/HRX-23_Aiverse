# OpenRouter API Key Setup Guide

## ⚠️ Note: Rate Limiting Issues
You're currently experiencing rate limiting with OpenRouter. Consider using HuggingFace or Cohere instead.

## 🚀 Step-by-Step Instructions

### 1. Create OpenRouter Account
1. Go to [OpenRouter](https://openrouter.ai/)
2. Click "Sign Up" or "Get Started"
3. Create your account
4. Verify your email address

### 2. Get Your API Key
1. Go to [OpenRouter Keys](https://openrouter.ai/keys)
2. Click "Create Key"
3. Give it a name like "Sentiment Analysis"
4. Set budget limits if needed
5. Click "Create"
6. **Copy the API key immediately**

### 3. Add Credits (Required)
1. Go to [OpenRouter Billing](https://openrouter.ai/billing)
2. Add payment method
3. Add credits to your account
4. **Note**: Pay-per-use model

### 4. Add to Your Environment
1. Go to `backend/community_sentiment_analyzer/`
2. Create or edit `.env` file
3. Add your key:
   ```bash
   OPENROUTER_API_KEY=your_openrouter_key_here
   SENTIMENT_METHOD=openrouter
   ```

## ⚠️ Current Issues
- **Rate Limiting**: You're hitting 429 errors
- **Cost**: Pay per request
- **Reliability**: Can be unstable during high usage

## 🔄 Recommended Solution
Switch to **HuggingFace** (free) or **Cohere** (free tier):

```bash
# In your .env file, change to:
SENTIMENT_METHOD=huggingface
HUGGINGFACE_API_KEY=your_huggingface_key

# OR
SENTIMENT_METHOD=cohere
COHERE_API_KEY=your_cohere_key
```

## 🔗 Direct Links
- [OpenRouter](https://openrouter.ai/)
- [API Keys](https://openrouter.ai/keys)
- [Billing](https://openrouter.ai/billing)

## 💡 Alternative Recommendation
Use **HuggingFace** instead:
- Free (no credit card needed)
- 30,000 requests/month
- No rate limiting issues
- Better for sentiment analysis 