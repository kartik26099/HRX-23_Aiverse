try:
    from transformers import BlipProcessor, BlipForConditionalGeneration
    from PIL import Image
    import torch
    
    # Initialize models only if dependencies are available
    try:
        processor = BlipProcessor.from_pretrained("Salesforce/blip-image-captioning-base")
        model = BlipForConditionalGeneration.from_pretrained("Salesforce/blip-image-captioning-base")
        TRANSFORMERS_AVAILABLE = True
    except Exception as e:
        print(f"Warning: Could not load BLIP models: {e}")
        TRANSFORMERS_AVAILABLE = False
        processor = None
        model = None
        
except ImportError as e:
    print(f"Warning: transformers not available: {e}")
    TRANSFORMERS_AVAILABLE = False
    processor = None
    model = None

def get_image_caption(image_path: str) -> str:
    """Get caption for an image using BLIP model with fallback."""
    if not TRANSFORMERS_AVAILABLE:
        return f"Image caption not available - missing dependencies. File: {image_path}"
    
    try:
        image = Image.open(image_path).convert("RGB")
        inputs = processor(image, return_tensors="pt")
        with torch.no_grad():
            out = model.generate(**inputs)
        return processor.decode(out[0], skip_special_tokens=True)
    except Exception as e:
        return f"Error generating caption: {str(e)}"

def get_caption(image_path: str) -> str:
    """Alias for get_image_caption."""
    return get_image_caption(image_path)
