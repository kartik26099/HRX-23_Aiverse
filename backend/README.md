# AI Platform Backend Services

A comprehensive AI platform with multiple specialized backend services for various AI-powered features.

## 🚀 Quick Start

### 1. Environment Setup

```bash
# Copy the environment template
cp env_template.txt .env

# Edit the .env file with your API keys
# Make sure to add alternative API keys for better reliability
```

### 2. Install Dependencies

```bash
# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Start Services

```bash
# Start all services
python start_services.py start

# Start specific services
python start_services.py start ai_library faculty

# Check service status
python start_services.py status

# Stop all services
python start_services.py stop
```

## 📋 Available Services

| Service | Port | Description | Status |
|---------|------|-------------|--------|
| AI Advisor | 5274 | AI-powered career and academic advising | ✅ |
| Faculty | 5000 | Faculty management and learning platform | ✅ |
| Research Helper | 5005 | AI research assistance and literature review | ✅ |
| AI Library | 4001 | Academic search and YouTube content discovery | ✅ |
| AI Placement | 5001 | Job placement and career matching | ✅ |
| DIY Evaluator | 8000 | Project evaluation and assessment | ✅ |
| AI Course | 5002 | Course generation and curriculum planning | ✅ |
| DIY Scheduler | 5003 | Project scheduling and time management | ✅ |
| AI DIY | 5004 | DIY project assistance and guidance | ✅ |

## 🔧 Recent Improvements

### AI Library Service Enhancements

The AI Library service has been significantly improved to handle API rate limits and provide better reliability:

#### ✅ **Error Handling & Fallbacks**
- **Graceful API Failure Handling**: When ScrapingDog API reaches limits (403 errors), the service now provides fallback data
- **Multiple API Support**: Configuration for alternative APIs (SerpAPI, RapidAPI) as backups
- **Fallback Data**: Provides placeholder content when APIs are unavailable

#### ✅ **Caching System**
- **In-Memory Caching**: Reduces API calls and improves response times
- **Configurable Cache Duration**: Default 1-hour cache with environment variable control
- **Cache Management**: Endpoints to view cache stats and clear cache

#### ✅ **Better Monitoring**
- **Health Check Endpoint**: `/health` for service monitoring
- **API Status Tracking**: Tracks success/failure/fallback status for each API
- **Detailed Error Logging**: Better debugging and monitoring capabilities

#### ✅ **Configuration Management**
- **Centralized Config**: `config.py` for better API key and endpoint management
- **Environment Variables**: Flexible configuration through `.env` file
- **Multiple API Keys**: Support for backup API keys

## 🔑 API Configuration

### Required API Keys

```env
# Primary APIs
Scholarly_api=your_scrapingdog_key_here
SCRAPINGDOG_API_KEY=your_scrapingdog_key_here

# Alternative APIs (recommended for reliability)
SCRAPINGDOG_BACKUP_KEY=your_backup_scrapingdog_key_here
SERPAPI_KEY=your_serpapi_key_here
RAPIDAPI_KEY=your_rapidapi_key_here
```

### Configuration Options

```env
# Cache settings
CACHE_DURATION=3600          # Cache duration in seconds (1 hour)
CACHE_ENABLED=true          # Enable/disable caching

# Fallback settings
FALLBACK_ENABLED=true       # Enable fallback data when APIs fail

# Rate limiting
RATE_LIMIT_DELAY=1.0        # Delay between API requests (seconds)
REQUEST_TIMEOUT=15          # API request timeout (seconds)
```

## 🛠️ Service Management

### Using the Service Manager

```bash
# Start all services
python start_services.py start

# Start specific services
python start_services.py start ai_library faculty

# Check status
python start_services.py status

# Restart services
python start_services.py restart ai_library

# Stop all services
python start_services.py stop
```

### Manual Service Start

```bash
# AI Library Service
cd "ai library"
python app.py

# Faculty Service
cd faculty
python app.py

# Other services follow the same pattern
```

## 📊 API Endpoints

### AI Library Service (Port 4001)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/search` | GET | Search academic papers and YouTube videos |
| `/test_youtube` | GET | Test YouTube API functionality |
| `/health` | GET | Service health check |
| `/cache/stats` | GET | View cache statistics |
| `/cache/clear` | POST | Clear the cache |

### Example Usage

```bash
# Search for AI-related content
curl "http://localhost:4001/search?query=Artificial%20Intelligence"

# Check service health
curl "http://localhost:4001/health"

# View cache stats
curl "http://localhost:4001/cache/stats"
```

## 🔍 Troubleshooting

### Common Issues

#### 1. API Rate Limits (403 Errors)
**Problem**: ScrapingDog API reaches account limits
**Solution**: 
- The service now provides fallback data automatically
- Add alternative API keys to `.env` file
- Upgrade your ScrapingDog account or wait for reset

#### 2. Service Won't Start
**Problem**: Port already in use
**Solution**:
```bash
# Check what's using the port
netstat -ano | findstr :4001  # Windows
lsof -i :4001                 # Linux/Mac

# Kill the process or change port in .env
```

#### 3. Missing Dependencies
**Problem**: Import errors when starting services
**Solution**:
```bash
# Reinstall dependencies
pip install -r requirements.txt

# Check virtual environment is activated
which python  # Should point to venv
```

### Debug Mode

Enable debug mode for detailed logging:

```python
# In any service's app.py
app.run(host='0.0.0.0', port=port, debug=True)
```

## 📈 Performance Optimization

### Caching Strategy
- **1-hour cache duration** for search results
- **Automatic cache invalidation** after timeout
- **Cache statistics** for monitoring

### Rate Limiting
- **1-second delay** between API requests
- **Configurable timeouts** for API calls
- **Graceful degradation** when APIs fail

### Fallback Strategy
- **Immediate fallback** when APIs reach limits
- **Informative placeholder data** with source indication
- **Multiple API support** for redundancy

## 🔐 Security Considerations

1. **API Key Management**: Store API keys in `.env` file (not in code)
2. **CORS Configuration**: Configured for local development
3. **Input Validation**: Query parameters are validated
4. **Error Handling**: No sensitive information in error messages

## 📝 Development

### Adding New Services

1. Create service directory and `app.py`
2. Add service configuration to `start_services.py`
3. Update `env_template.txt` with required environment variables
4. Add service to this README

### Code Style

- Follow PEP 8 guidelines
- Add type hints where possible
- Include docstrings for functions
- Use meaningful variable names

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is part of the Hackronyx AI Platform.

---

**Note**: Make sure to keep your API keys secure and never commit them to version control. The `.env` file should be added to `.gitignore`. 