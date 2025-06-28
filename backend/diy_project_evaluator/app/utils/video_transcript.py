try:
    import whisper
    # Try to load the model
    try:
        model = whisper.load_model("base")
        WHISPER_AVAILABLE = True
    except Exception as e:
        print(f"Warning: Could not load Whisper model: {e}")
        WHISPER_AVAILABLE = False
        model = None
except ImportError as e:
    print(f"Warning: openai-whisper not available: {e}")
    WHISPER_AVAILABLE = False
    model = None

def get_transcript(video_path: str) -> str:
    """Get transcript from video using Whisper with fallback."""
    if not WHISPER_AVAILABLE:
        return f"Video transcript not available - missing openai-whisper dependency. File: {video_path}"
    
    try:
        result = model.transcribe(video_path)
        return result.get("text", "")
    except Exception as e:
        return f"Error generating transcript: {str(e)}"
