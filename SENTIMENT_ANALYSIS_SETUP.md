# Community Sentiment Analysis System

This system provides real-time sentiment analysis for the Hackronx community platform, including an admin dashboard with interactive charts and AI-powered recommendations.

## 🏗️ Architecture

- **Backend**: Flask-based sentiment analyzer (Port 5001)
- **Frontend**: Next.js admin dashboard (Port 3002)
- **AI**: OpenRouter API with Llama 3.1 8B model
- **Database**: Supabase integration
- **Charts**: Recharts for data visualization

## 📊 Features

### Sentiment Analysis
- Real-time analysis of posts and comments
- Classification into Positive, Negative, and Neutral sentiments
- Tag-based sentiment analysis
- Time-series sentiment tracking

### Admin Dashboard
- Interactive charts and visualizations
- Real-time statistics
- AI-generated recommendations
- Automatic data refresh

### Charts Included
1. **Posts Sentiment Distribution** (Pie Chart)
2. **Comments Sentiment Distribution** (Pie Chart)
3. **Tag Sentiment Analysis** (Bar Chart)
4. **Sentiment Over Time** (Area Chart)

## 🚀 Quick Start

### 1. Environment Setup

Create a `.env` file in the `backend/community_sentiment_analyzer/` directory:

```bash
# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key

# OpenRouter Configuration
OPENROUTER_API_KEY=your_openrouter_api_key

# Flask Configuration
PORT=5001
FLASK_ENV=development
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
pip install -r community_sentiment_analyzer/requirements.txt

# Start the sentiment analyzer
python start_sentiment_analyzer.py
```

### 3. Frontend Setup

```bash
# Navigate to admin frontend directory
cd frontend-admin

# Install dependencies
npm install

# Start the admin dashboard
npm run dev
```

## 📈 Dashboard Access

- **Admin Dashboard**: http://localhost:3002
- **API Health Check**: http://localhost:5001/api/health
- **Sentiment Analysis API**: http://localhost:5001/api/sentiment-analysis

## 🔧 Configuration

### Supabase Setup

1. **Database Functions**: Ensure these Supabase functions exist:
   ```sql
   -- Function to get posts with details
   CREATE OR REPLACE FUNCTION get_posts_with_details(
     p_limit INTEGER DEFAULT 20,
     p_offset INTEGER DEFAULT 0,
     p_tag_filter TEXT DEFAULT NULL
   )
   RETURNS TABLE (
     id UUID,
     content TEXT,
     type TEXT,
     created_at TIMESTAMPTZ,
     is_anonymous BOOLEAN,
     user_username TEXT,
     user_avatar_url TEXT,
     reaction_count BIGINT,
     comment_count BIGINT,
     tags TEXT[]
   ) AS $$
   BEGIN
     RETURN QUERY
     SELECT 
       p.id,
       p.content,
       p.type,
       p.created_at,
       p.is_anonymous,
       u.username as user_username,
       u.avatar_url as user_avatar_url,
       COUNT(DISTINCT r.id) as reaction_count,
       COUNT(DISTINCT c.id) as comment_count,
       ARRAY_AGG(DISTINCT t.name) FILTER (WHERE t.name IS NOT NULL) as tags
     FROM posts p
     LEFT JOIN users u ON p.user_id = u.id
     LEFT JOIN reactions r ON p.id = r.post_id
     LEFT JOIN comments c ON p.id = c.post_id
     LEFT JOIN post_tags pt ON p.id = pt.post_id
     LEFT JOIN tags t ON pt.tag_id = t.id
     WHERE p.status = 'active'
     GROUP BY p.id, u.username, u.avatar_url
     ORDER BY p.created_at DESC
     LIMIT p_limit OFFSET p_offset;
   END;
   $$ LANGUAGE plpgsql;
   ```

2. **Webhook Setup**: Configure Supabase webhooks for automatic analysis:
   - **Table**: `posts`, `comments`, `reactions`
   - **Event**: `INSERT`
   - **URL**: `http://localhost:5001/api/webhook/database-change`

### OpenRouter API

1. Sign up at [OpenRouter](https://openrouter.ai/)
2. Get your API key
3. Add to environment variables

## 📊 Dashboard Features

### Statistics Cards
- Total Posts and Comments
- Positive/Negative sentiment percentages
- Real-time metrics

### Interactive Charts
1. **Sentiment Distribution**: Pie charts showing sentiment breakdown
2. **Tag Analysis**: Bar charts showing sentiment by community tags
3. **Time Series**: Area chart showing sentiment trends over time

### AI Recommendations
- Automated analysis of negative feedback
- Actionable improvement suggestions
- Community engagement strategies

## 🔄 Auto-Refresh System

### Manual Refresh
- Click "Refresh Data" button in dashboard
- Use command line interface in backend

### Automatic Refresh
- Webhook triggers on new posts/comments
- Cache invalidation system
- 5-minute cache expiration

## 🛠️ Development

### Backend Commands
```bash
# Start service
python start_sentiment_analyzer.py

# Available commands:
# restart  - Restart the service
# refresh  - Trigger fresh analysis
# health   - Check service health
# quit     - Stop the service
```

### API Endpoints
- `GET /api/sentiment-analysis` - Get comprehensive analysis
- `POST /api/webhook/database-change` - Trigger cache invalidation
- `GET /api/health` - Health check

### Frontend Development
```bash
cd frontend-admin
npm run dev    # Development mode
npm run build  # Production build
npm run start  # Production server
```

## 🔍 Troubleshooting

### Common Issues

1. **API Connection Errors**
   - Check environment variables
   - Verify Supabase credentials
   - Ensure OpenRouter API key is valid

2. **Chart Not Loading**
   - Check browser console for errors
   - Verify data format from API
   - Ensure Recharts is properly installed

3. **Sentiment Analysis Fails**
   - Check OpenRouter API quota
   - Verify text content is not empty
   - Check network connectivity

### Debug Mode
```bash
# Enable debug logging
export FLASK_ENV=development
export FLASK_DEBUG=1
```

## 📝 API Response Format

```json
{
  "sentiment_data": {
    "overall_stats": {
      "total_posts": 150,
      "total_comments": 450,
      "positive_posts": 120,
      "negative_posts": 15,
      "neutral_posts": 15,
      "positive_comments": 380,
      "negative_comments": 35,
      "neutral_comments": 35
    },
    "posts_sentiment": [...],
    "comments_sentiment": [...],
    "tag_analysis": {...}
  },
  "recommendations": "AI-generated recommendations...",
  "timestamp": "2024-01-01T12:00:00Z"
}
```

## 🚀 Deployment

### Production Setup
1. Set `FLASK_ENV=production`
2. Configure production database
3. Set up proper CORS settings
4. Use production API keys

### Docker Deployment
```dockerfile
# Example Dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 5001
CMD ["python", "app.py"]
```

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review API documentation
3. Check server logs for errors
4. Verify environment configuration

## 🔄 Updates

The system automatically:
- Refreshes sentiment analysis every 5 minutes
- Invalidates cache on new content
- Provides real-time recommendations
- Updates dashboard metrics

---

**Note**: Ensure all environment variables are properly configured before starting the services. 