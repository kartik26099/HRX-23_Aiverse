from fastapi import UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
import os
import uuid
import logging
import tempfile
from document_handler import process_document

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def handle_file_upload(file: UploadFile = File(...)):
    """
    Handle uploaded files and return the analysis
    
    Args:
        file: The uploaded file
        
    Returns:
        JSONResponse with the analysis results
    """
    try:
        # Generate a unique filename to avoid conflicts
        temp_dir = tempfile.gettempdir()
        file_extension = os.path.splitext(file.filename)[1]
        temp_file_path = os.path.join(temp_dir, f"{uuid.uuid4()}{file_extension}")
        
        logger.info(f"Processing uploaded file: {file.filename} (temp path: {temp_file_path})")
        
        # Save uploaded file to temp directory
        with open(temp_file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        # Process the document
        result = process_document(temp_file_path, file.filename)
        
        # Clean up the temp file
        try:
            os.remove(temp_file_path)
        except Exception as e:
            logger.warning(f"Failed to remove temp file {temp_file_path}: {str(e)}")
        
        return JSONResponse(
            status_code=200,
            content={
                "status": "success",
                "file_name": file.filename,
                "document_type": result["document_type"],
                "analysis": result["analysis"]
            }
        )
        
    except Exception as e:
        logger.error(f"Error handling file upload: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process uploaded file: {str(e)}"
        )