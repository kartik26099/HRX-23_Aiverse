import os
import logging
import httpx
from config import OPENROUTER_API_KEY, LLM_API_URL, MODEL_NAME

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create OpenRouter client instances
try:
    # Get API key from environment
    api_key = os.environ.get("OPENROUTER_API_KEY", OPENROUTER_API_KEY)
    
    # Debug logging for API key
    if api_key:
        masked_key = api_key[:8] + "..." + api_key[-4:] if len(api_key) > 12 else "***"
        logger.info(f"Using OpenRouter API key: {masked_key}")
        logger.info(f"API key source: {'Environment' if os.environ.get('OPENROUTER_API_KEY') else 'Config file'}")
    else:
        logger.warning("No OpenRouter API key found in environment or config!")
        logger.info("Environment OPENROUTER_API_KEY: " + str(bool(os.environ.get("OPENROUTER_API_KEY"))))
        logger.info("Config OPENROUTER_API_KEY: " + str(bool(OPENROUTER_API_KEY)))
    
    if not api_key:
        logger.warning("No OpenRouter API key found. Using dummy client.")
        
        # Create a dummy client class for testing without API key
        class DummyOpenRouterClient:
            class Completions:
                def create(self, **kwargs):
                    class DummyResponse:
                        class Choice:
                            class Message:
                                def __init__(self, content):
                                    self.content = content
                                    
                            def __init__(self, message):
                                self.message = message
                                
                        def __init__(self, choices):
                            self.choices = choices
                            
                    return DummyResponse([DummyResponse.Choice(DummyResponse.Choice.Message("This is a dummy response. Please configure a valid OpenRouter API key."))])
            
            class Chat:
                def __init__(self):
                    self.completions = DummyOpenRouterClient.Completions()
                    
            def __init__(self):
                self.chat = self.Chat()
                
        openrouter_client = DummyOpenRouterClient()
        async_openrouter_client = DummyOpenRouterClient()
        
    else:
        # Create OpenRouter client using httpx
        class OpenRouterClient:
            def __init__(self, api_key, api_url):
                self.api_key = api_key
                self.api_url = api_url
                self.client = httpx.AsyncClient()
                
            class Completions:
                def __init__(self, parent):
                    self.parent = parent
                    
                async def create(self, messages, model, **kwargs):
                    headers = {
                        "Authorization": f"Bearer {self.parent.api_key}",
                        "Content-Type": "application/json",
                        "HTTP-Referer": "http://localhost:5274",  # Your app URL
                        "X-Title": "AI Advisor"  # Your app name
                    }
                    
                    payload = {
                        "model": model,
                        "messages": messages,
                        **kwargs
                    }
                    
                    response = await self.parent.client.post(
                        self.parent.api_url,
                        headers=headers,
                        json=payload
                    )
                    
                    if response.status_code == 200:
                        data = response.json()
                        return type('Response', (), {
                            'choices': [type('Choice', (), {
                                'message': type('Message', (), {
                                    'content': data['choices'][0]['message']['content']
                                })()
                            })()]
                        })()
                    else:
                        raise Exception(f"OpenRouter API error: {response.status_code} - {response.text}")
            
            class Chat:
                def __init__(self, parent):
                    self.completions = OpenRouterClient.Completions(parent)
        
        # Create synchronous wrapper
        class SyncOpenRouterClient:
            def __init__(self, api_key, api_url):
                self.api_key = api_key
                self.api_url = api_url
                self.client = httpx.Client()
                
            class Completions:
                def __init__(self, parent):
                    self.parent = parent
                    
                def create(self, messages, model, **kwargs):
                    headers = {
                        "Authorization": f"Bearer {self.parent.api_key}",
                        "Content-Type": "application/json",
                        "HTTP-Referer": "http://localhost:5274",
                        "X-Title": "AI Advisor"
                    }
                    
                    payload = {
                        "model": model,
                        "messages": messages,
                        **kwargs
                    }
                    
                    response = self.parent.client.post(
                        self.parent.api_url,
                        headers=headers,
                        json=payload
                    )
                    
                    if response.status_code == 200:
                        data = response.json()
                        return type('Response', (), {
                            'choices': [type('Choice', (), {
                                'message': type('Message', (), {
                                    'content': data['choices'][0]['message']['content']
                                })()
                            })()]
                        })()
                    else:
                        raise Exception(f"OpenRouter API error: {response.status_code} - {response.text}")
            
            class Chat:
                def __init__(self, parent):
                    self.completions = SyncOpenRouterClient.Completions(parent)
        
        openrouter_client = SyncOpenRouterClient(api_key, LLM_API_URL)
        openrouter_client.chat = openrouter_client.Chat(openrouter_client)
        
        async_openrouter_client = OpenRouterClient(api_key, LLM_API_URL)
        async_openrouter_client.chat = async_openrouter_client.Chat(async_openrouter_client)
        
        logger.info("OpenRouter client initialized successfully")
        
except Exception as e:
    logger.error(f"Error initializing OpenRouter client: {str(e)}")
    raise