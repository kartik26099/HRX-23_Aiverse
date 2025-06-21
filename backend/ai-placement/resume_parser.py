import os
import json
import re
from mistralai import Mistral
from typing import Dict, Any, List, Optional

class MistralResumeParser:
    """Resume parser that uses Mistral AI for OCR and data extraction"""
    
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize the Mistral AI client
        
        Args:
            api_key: Mistral AI API key. If not provided, it will look for MISTRAL_API_KEY env variable
        """
        if api_key is None:
            api_key = os.environ.get("MISTRAL_API_KEY")
            if api_key is None:
                raise ValueError("API key must be provided or set as MISTRAL_API_KEY environment variable")
        
        self.client = Mistral(api_key=api_key)
        self.model = "mistral-large-latest"
    
    def _upload_file(self, file_path: str) -> str:
        """
        Upload a file to Mistral AI
        
        Args:
            file_path: Path to the file to upload
            
        Returns:
            URL of the uploaded file
        """
        try:
            # Extract filename from path
            file_name = os.path.basename(file_path)
            
            # Upload the file
            uploaded_file = self.client.files.upload(
                file={
                    "file_name": file_name,
                    "content": open(file_path, "rb"),
                },
                purpose="ocr"
            )
            
            # Get the signed URL
            signed_url = self.client.files.get_signed_url(file_id=uploaded_file.id)
            
            return signed_url.url
        except Exception as e:
            raise Exception(f"Error uploading file: {str(e)}")
    
    def parse_resume(self, file_path: str) -> Dict[str, Any]:
        """
        Parse a resume using Mistral AI
        
        Args:
            file_path: Path to the resume file
            
        Returns:
            Dictionary containing parsed resume data
        """
        try:
            # Upload the file
            file_url = self._upload_file(file_path)
            
            # Define the extraction prompt
            messages = [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": (
                                "Extract the following information from this resume and return it as a properly formatted JSON object with these keys:\n"
                                "- name: Full name of the person\n"
                                "- job_title: Current or most recent job title\n"
                                "- contact: Object containing email, phone, linkedin, github, website\n"
                                "- skills: Array of skills mentioned\n"
                                "- experience: Array of work experiences with company, title, dates, and description\n"
                                "- education: Array of education entries with institution, degree, dates\n"
                                "- projects: Array of project names and descriptions\n"
                                "- certifications: Array of certifications\n\n"
                                "Format your response as a valid JSON object only, with no additional text."
                            )
                        },
                        {
                            "type": "document_url",
                            "document_url": file_url
                        }
                    ]
                }
            ]
            
            # Get the response
            response = self.client.chat.complete(
                model=self.model,
                messages=messages
            )
            
            # Extract the JSON from the response
            response_text = response.choices[0].message.content
            
            # Try to extract JSON from the response if there's any surrounding text
            json_match = re.search(r'```json\s*([\s\S]*?)\s*```', response_text)
            if json_match:
                json_str = json_match.group(1)
            else:
                # If no code block, try to find JSON object directly
                json_match = re.search(r'({[\s\S]*})', response_text)
                if json_match:
                    json_str = json_match.group(1)
                else:
                    json_str = response_text
            
            # Parse the JSON
            try:
                parsed_data = json.loads(json_str)
            except json.JSONDecodeError:
                # If there's an error parsing the JSON, try again with a more explicit instruction
                clarification_messages = messages + [
                    {
                        "role": "assistant",
                        "content": response_text
                    },
                    {
                        "role": "user",
                        "content": "Please reformat your response as a valid JSON object only, with no additional text, explanations, or markdown formatting."
                    }
                ]
                
                clarification_response = self.client.chat.complete(
                    model=self.model,
                    messages=clarification_messages
                )
                
                clarification_text = clarification_response.choices[0].message.content
                
                # Try to extract JSON again
                json_match = re.search(r'```json\s*([\s\S]*?)\s*```', clarification_text)
                if json_match:
                    json_str = json_match.group(1)
                else:
                    # If no code block, try to find JSON object directly
                    json_match = re.search(r'({[\s\S]*})', clarification_text)
                    if json_match:
                        json_str = json_match.group(1)
                    else:
                        json_str = clarification_text
                
                parsed_data = json.loads(json_str)
            
            # Ensure the parsed data has all expected keys
            expected_keys = ['name', 'job_title', 'contact', 'skills', 'experience', 'education', 'projects', 'certifications']
            for key in expected_keys:
                if key not in parsed_data:
                    parsed_data[key] = [] if key in ['skills', 'experience', 'education', 'projects', 'certifications'] else ""
            
            # Ensure contact is a dictionary
            if not isinstance(parsed_data['contact'], dict):
                parsed_data['contact'] = {
                    'email': '',
                    'phone': '',
                    'linkedin': '',
                    'github': '',
                    'website': ''
                }
            
            return parsed_data
            
        except Exception as e:
            return {
                "error": str(e),
                "name": "",
                "job_title": "",
                "contact": {
                    "email": "",
                    "phone": "",
                    "linkedin": "",
                    "github": "",
                    "website": ""
                },
                "skills": [],
                "experience": [],
                "education": [],
                "projects": [],
                "certifications": []
            }
    
    def parse_and_save(self, file_path: str, output_path: Optional[str] = None) -> Dict[str, Any]:
        """
        Parse a resume and save the results to a JSON file
        
        Args:
            file_path: Path to the resume file
            output_path: Path to save the output JSON (optional)
            
        Returns:
            Dictionary containing parsed resume data
        """
        # Parse the resume
        parsed_data = self.parse_resume(file_path)
        
        # Save to file if output_path is provided
        if output_path:
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(parsed_data, f, indent=2)
        
        return parsed_data

# Example usage
if __name__ == "__main__":
    import argparse
    
    file_name = "Naman Shah resume.pdf"
    file_path = f"./resumes/{file_name}"
    api_key = "wxJu9G7KyqjjTfLbjaRRso4utGo9mqDX"
    output_path = f"./outputs/output_{file_name}.json"
    
    resume_parser = MistralResumeParser(api_key= api_key)
    result = resume_parser.parse_and_save(file_path, output_path)
    
    print(json.dumps(result, indent=2))