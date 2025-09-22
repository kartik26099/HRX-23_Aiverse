# Community Sentiment Analyzer

A simple, clean sentiment analysis service for the DoLab community platform.

## Features

- ✅ Simple rule-based sentiment analysis
- ✅ Supabase integration for data fetching
- ✅ Caching system (5-minute cache)
- ✅ Health check endpoint
- ✅ Force refresh capability
- ✅ Active users count
- ✅ Test sentiment endpoint

## Quick Start

### 1. Start the Server

```bash
# Windows
start_server.bat

# Or manually
python app.py
```

### 2. Test the Server

```bash
python test_server.py
```

### 3. Access Endpoints

- **Health Check**: http://localhost:5001/api/health
- **Sentiment Analysis**: http://localhost:5001/api/sentiment-analysis
- **Active Users**: http://localhost:5001/api/active-users
- **Force Refresh**: POST http://localhost:5001/api/force-refresh
- **Test Sentiment**: POST http://localhost:5001/api/test-sentiment

## Environment Variables

Create a `.env` file in the backend directory:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key
```

## API Endpoints

### GET /api/health
Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00",
  "supabase_connected": true,
  "cache_exists": true,
  "cache_age": 120.5
}
```

### GET /api/sentiment-analysis
Get sentiment analysis data.

**Query Parameters:**
- `force_refresh=true` - Force refresh cache

**Response:**
```json
{
  "sentiment_data": {
    "overall_stats": {
      "total_posts": 100,
      "total_comments": 250,
      "positive_posts": 70,
      "negative_posts": 10,
      "neutral_posts": 20,
      "positive_comments": 180,
      "negative_comments": 30,
      "neutral_comments": 40
    },
    "posts_sentiment": [...],
    "comments_sentiment": [...],
    "time_series": [...],
    "tag_analysis": {...}
  },
  "recommendations": "📊 Good community sentiment...",
  "timestamp": "2024-01-01T12:00:00",
  "cache_age": 120.5,
  "force_refresh_used": false
}
```

### GET /api/active-users
Get active user count.

**Response:**
```json
{
  "active_users": 150
}
```

### POST /api/force-refresh
Force refresh the cache.

**Response:**
```json
{
  "status": "success",
  "message": "Cache refreshed successfully",
  "data_summary": {
    "total_posts": 100,
    "total_comments": 250,
    "timestamp": "2024-01-01T12:00:00"
  }
}
```

### POST /api/test-sentiment
Test sentiment analysis with custom text.

**Request Body:**
```json
{
  "text": "This is a great platform!"
}
```

**Response:**
```json
{
  "text": "This is a great platform!",
  "sentiment": "POSITIVE",
  "timestamp": "2024-01-01T12:00:00"
}
```

## Dependencies

- Flask
- Flask-CORS
- python-dotenv
- supabase
- requests

## Troubleshooting

1. **Port 5001 already in use**: Kill the process or change the port in `app.py`
2. **Supabase connection failed**: Check your environment variables
3. **Import errors**: Run `pip install -r requirements.txt`

## Development

The server runs on port 5001 by default. You can change this by setting the `PORT` environment variable. 