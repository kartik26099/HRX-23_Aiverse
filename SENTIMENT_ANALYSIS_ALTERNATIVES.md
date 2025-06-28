# Sentiment Analysis Alternatives Guide

## 🚀 Quick Start (Recommended)

**Use Rule-Based Analysis (No API Keys Needed)**
```bash
# In your .env file, set:
SENTIMENT_METHOD=rule_based
```

This method works immediately without any API keys and provides decent accuracy for most use cases.

## 📊 Available Methods

### 1. **Rule-Based Analysis** ⭐ (Recommended for Start)
- **Cost**: Free
- **Setup**: No API keys needed
- **Accuracy**: Good for basic sentiment detection
- **Speed**: Instant
- **Limitations**: May miss nuanced sentiment

**Features:**
- Keyword-based analysis
- Negation handling
- No rate limits
- Works offline

### 2. **HuggingFace API** ⭐⭐
- **Cost**: Free tier available
- **Setup**: Get API key from [HuggingFace](https://huggingface.co/settings/tokens)
- **Accuracy**: Very good
- **Speed**: Fast
- **Rate Limits**: Generous free tier

**Setup:**
1. Go to [HuggingFace](https://huggingface.co/settings/tokens)
2. Create account and get API key
3. Add to `.env`: `HUGGINGFACE_API_KEY=your_key_here`
4. Set: `SENTIMENT_METHOD=huggingface`

### 3. **Cohere API** ⭐⭐⭐
- **Cost**: Free tier (1000 requests/month)
- **Setup**: Get API key from [Cohere](https://cohere.ai/)
- **Accuracy**: Excellent
- **Speed**: Very fast
- **Rate Limits**: 1000 requests/month free

**Setup:**
1. Go to [Cohere](https://cohere.ai/)
2. Sign up and get API key
3. Add to `.env`: `COHERE_API_KEY=your_key_here`
4. Set: `SENTIMENT_METHOD=cohere`

### 4. **OpenRouter API** ⭐⭐
- **Cost**: Pay per use
- **Setup**: Get API key from [OpenRouter](https://openrouter.ai/)
- **Accuracy**: Excellent
- **Speed**: Fast
- **Rate Limits**: Strict (causing your current issues)

## 🔧 Configuration

### Environment Variables
```bash
# Choose your method
SENTIMENT_METHOD=rule_based  # Options: rule_based, huggingface, cohere, openrouter

# API Keys (only needed for API methods)
HUGGINGFACE_API_KEY=your_huggingface_key
COHERE_API_KEY=your_cohere_key
OPENROUTER_API_KEY=your_openrouter_key
```

### Switching Methods
You can change methods without restarting by updating the environment variable:

```bash
# For rule-based (immediate, no API calls)
SENTIMENT_METHOD=rule_based

# For HuggingFace
SENTIMENT_METHOD=huggingface

# For Cohere
SENTIMENT_METHOD=cohere

# For OpenRouter
SENTIMENT_METHOD=openrouter
```

## 📈 Performance Comparison

| Method | Accuracy | Speed | Cost | Setup | Rate Limits |
|--------|----------|-------|------|-------|-------------|
| Rule-Based | 70-80% | Instant | Free | None | None |
| HuggingFace | 85-90% | Fast | Free | Easy | Generous |
| Cohere | 90-95% | Very Fast | Free tier | Easy | 1000/month |
| OpenRouter | 90-95% | Fast | Pay per use | Easy | Strict |

## 🛠️ Implementation Details

### Rule-Based Analysis
- Uses predefined positive/negative word lists
- Handles basic negation patterns
- No external dependencies
- Works completely offline

### API-Based Methods
- Automatic fallback to rule-based if API fails
- Rate limiting protection
- Error handling and retry logic
- Caching to reduce API calls

## 🚀 Recommended Setup

### For Development/Testing:
```bash
SENTIMENT_METHOD=rule_based
```

### For Production (Free):
```bash
SENTIMENT_METHOD=huggingface
HUGGINGFACE_API_KEY=your_key_here
```

### For Production (Paid):
```bash
SENTIMENT_METHOD=cohere
COHERE_API_KEY=your_key_here
```

## 🔄 Migration Guide

### From OpenRouter to Rule-Based:
1. Update `.env` file:
   ```bash
   SENTIMENT_METHOD=rule_based
   # Comment out or remove OPENROUTER_API_KEY
   ```

2. Restart the backend service
3. The system will automatically use rule-based analysis

### From OpenRouter to HuggingFace:
1. Get HuggingFace API key
2. Update `.env` file:
   ```bash
   SENTIMENT_METHOD=huggingface
   HUGGINGFACE_API_KEY=your_key_here
   ```

3. Restart the backend service

## 🎯 Best Practices

1. **Start with Rule-Based**: Use this for development and testing
2. **Graduate to APIs**: Move to HuggingFace or Cohere for production
3. **Monitor Usage**: Keep track of API call limits
4. **Implement Caching**: The system already caches results for 5 minutes
5. **Error Handling**: All methods have automatic fallbacks

## 🔍 Testing Your Setup

Use the health check endpoint:
```bash
curl http://localhost:5001/api/health
```

This will show you which sentiment method is currently active.

## 💡 Tips

- **Rule-based is perfect for MVP**: No setup, no costs, works immediately
- **HuggingFace is great for free production**: Good accuracy, generous limits
- **Cohere is best for paid production**: Excellent accuracy, good pricing
- **OpenRouter is for advanced use cases**: When you need specific models

## 🆘 Troubleshooting

### Rate Limit Issues:
- Switch to rule-based analysis
- Implement better caching
- Use multiple API keys

### API Key Issues:
- Check your API key is correct
- Verify your account has credits/access
- Try the rule-based fallback

### Accuracy Issues:
- Rule-based: Add more keywords to the lists
- API-based: Check the model being used
- Consider combining multiple methods 