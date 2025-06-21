import os
import logging
from groq import AsyncGroq, Groq
from config import GROQ_API_KEY

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create Groq client instances
try:
    # First, try to use the environment variable if available
    api_key = os.environ.get("GROQ_API_KEY", GROQ_API_KEY)
    
    if not api_key:
        logger.warning("No Groq API key found. Using dummy client.")
        
        # Create a dummy client class for testing without API key
        class DummyGroqClient:
            class ChatCompletions:
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
                            
                    return DummyResponse([DummyResponse.Choice(DummyResponse.Choice.Message("This is a dummy response. Please configure a valid Groq API key."))])
                    
            def __init__(self):
                self.chat = self.ChatCompletions()
                
        groq_client = DummyGroqClient()
        async_groq_client = DummyGroqClient()
        
    else:
        # Create real Groq clients
        groq_client = Groq(api_key=api_key)
        async_groq_client = AsyncGroq(api_key=api_key)
        logger.info("Groq client initialized successfully")
        
except Exception as e:
    logger.error(f"Error initializing Groq client: {str(e)}")
    raise