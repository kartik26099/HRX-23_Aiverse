import os
from typing import Dict, Any

class APIConfig:
    """Configuration class for API settings"""
    
    def __init__(self):
        self.scrapingdog_api_key = os.getenv('Scholarly_api') or os.getenv('SCRAPINGDOG_API_KEY')
        self.alternative_api_keys = {
            'scrapingdog_backup': os.getenv('SCRAPINGDOG_BACKUP_KEY'),
            'serpapi': os.getenv('SERPAPI_KEY'),
            'rapidapi': os.getenv('RAPIDAPI_KEY')
        }
        
        # API endpoints
        self.endpoints = {
            'scrapingdog': {
                'scholar': "https://api.scrapingdog.com/google_scholar",
                'youtube': "https://api.scrapingdog.com/youtube/search"
            },
            'serpapi': {
                'scholar': "https://serpapi.com/search",
                'youtube': "https://serpapi.com/youtube/search"
            },
            'rapidapi': {
                'scholar': "https://google-search3.p.rapidapi.com/api/v1/scholar",
                'youtube': "https://youtube-search-results.p.rapidapi.com/youtube-search"
            }
        }
        
        # Cache settings
        self.cache_duration = int(os.getenv('CACHE_DURATION', 3600))  # 1 hour default
        self.cache_enabled = os.getenv('CACHE_ENABLED', 'true').lower() == 'true'
        
        # Fallback settings
        self.fallback_enabled = os.getenv('FALLBACK_ENABLED', 'true').lower() == 'true'
        
        # Rate limiting
        self.rate_limit_delay = float(os.getenv('RATE_LIMIT_DELAY', 1.0))  # seconds between requests
        
        # Timeout settings
        self.request_timeout = int(os.getenv('REQUEST_TIMEOUT', 15))
        
    def get_api_key(self, service: str = 'scrapingdog') -> str:
        """Get API key for specified service"""
        if service == 'scrapingdog':
            return self.scrapingdog_api_key
        return self.alternative_api_keys.get(f'{service}_backup') or self.alternative_api_keys.get(service)
    
    def get_endpoint(self, service: str, api_type: str) -> str:
        """Get endpoint URL for specified service and API type"""
        return self.endpoints.get(service, {}).get(api_type)
    
    def is_service_available(self, service: str) -> bool:
        """Check if a service is available (has API key)"""
        return bool(self.get_api_key(service))
    
    def get_available_services(self) -> Dict[str, bool]:
        """Get list of available services"""
        return {
            'scrapingdog': self.is_service_available('scrapingdog'),
            'serpapi': self.is_service_available('serpapi'),
            'rapidapi': self.is_service_available('rapidapi')
        }

# Global configuration instance
config = APIConfig()

def get_config() -> APIConfig:
    """Get the global configuration instance"""
    return config 