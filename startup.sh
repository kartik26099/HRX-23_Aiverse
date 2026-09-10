#!/bin/bash

# Azure App Service startup script for Linux
echo "🚀 Starting Hackronyx Application on Azure Linux..."

# Set environment variables
export FLASK_APP=backend/app.py
export FLASK_ENV=production
export PORT=${PORT:-5000}

# Install Python dependencies
echo "📦 Installing Python dependencies..."
pip install -r backend/requirements.txt

# Install Node.js dependencies and build frontend
echo "🎨 Building frontend..."
cd frontend
npm install
npm run build
cd ..

# Start the application
echo "🌟 Starting application on port $PORT..."
cd backend
python app.py
