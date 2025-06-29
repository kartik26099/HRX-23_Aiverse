# AI Advisor Setup Guide

## Overview
The AI Advisor is a career counseling chatbot that uses the Groq API to provide personalized career advice and guidance.

## Prerequisites
- Python 3.8+
- Groq API key (free at https://console.groq.com/)

## Setup Instructions

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Configure API Key
1. Get a free API key from [Groq Console](https://console.groq.com/)
2. Create a `.env` file in this directory:
```bash
cp env_template.txt .env
```
3. Edit the `.env` file and replace `your_groq_api_key_here` with your actual API key:
```
GROQ_API_KEY=gsk_your_actual_api_key_here
MODEL_NAME=llama-3.3-70b-versatile
```

### 3. Test Configuration
Run the test script to verify your setup:
```bash
python test_connection.py
```

### 4. Start the Server
```bash
python app.py
```

The server will start on `http://localhost:5000`

## Troubleshooting

### "I'm having trouble connecting to my brain right now" Error

This error occurs when there are issues with the Groq API connection. Here are the most common causes and solutions:

#### 1. Missing or Invalid API Key
- **Symptom**: Error mentions authentication or API key issues
- **Solution**: 
  - Check that your `.env` file exists and contains a valid API key
  - Verify the API key format starts with `gsk_`
  - Get a new API key from https://console.groq.com/

#### 2. Network Connectivity Issues
- **Symptom**: Connection timeout or network errors
- **Solution**:
  - Check your internet connection
  - Try again in a few minutes
  - Check if Groq services are down at https://status.groq.com/

#### 3. Rate Limiting
- **Symptom**: Quota exceeded or rate limit errors
- **Solution**:
  - Wait a few minutes before trying again
  - Check your Groq usage in the console
  - Consider upgrading your plan if needed

#### 4. Model Configuration Issues
- **Symptom**: Invalid model or configuration errors
- **Solution**:
  - Verify the model name in your `.env` file
  - Check that the model is available in your Groq plan

### Running the Test Script
The `test_connection.py` script will help diagnose issues:
```bash
python test_connection.py
```

This will check:
- ✅ .env file existence
- ✅ API key configuration
- ✅ Groq library installation
- ✅ API connection test

## API Endpoints

- `POST /api/advisor` - Chat with the AI advisor
- `POST /api/upload` - Upload documents for context
- `POST /api/generate-quiz` - Generate quizzes from conversation
- `GET /` - Health check

## Features

- **Career Counseling**: Get personalized career advice
- **Document Analysis**: Upload resumes/CVs for context-aware advice
- **Quiz Generation**: Create quizzes based on conversations
- **Session Management**: Maintain conversation history

## Support

If you continue to experience issues:
1. Run the test script and check the output
2. Verify your API key is valid
3. Check the server logs for detailed error messages
4. Ensure all dependencies are installed correctly 