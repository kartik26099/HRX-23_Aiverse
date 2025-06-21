import whisper

model = whisper.load_model("base")

def get_transcript(video_path: str) -> str:
    result = model.transcribe(video_path)
    return result.get("text", "")
