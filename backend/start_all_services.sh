#!/bin/bash

echo "🤖 Starting AI Platform Backend Services (excluding ai_placement)..."
echo

# Check if Python is available (try multiple common paths)
PYTHON_CMD=""
if command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
elif command -v python &> /dev/null; then
    PYTHON_CMD="python"
elif [ -f "/c/Python312/python" ]; then
    PYTHON_CMD="/c/Python312/python"
elif [ -f "/c/Python311/python" ]; then
    PYTHON_CMD="/c/Python311/python"
elif [ -f "/c/Python310/python" ]; then
    PYTHON_CMD="/c/Python310/python"
else
    echo "❌ Python is not installed or not in PATH"
    echo "Please install Python and try again"
    exit 1
fi

echo "✅ Using Python: $PYTHON_CMD"

# Check if we're in the backend directory
if [ ! -f "start_services.py" ]; then
    echo "❌ Please run this script from the backend directory"
    echo "Current directory: $(pwd)"
    exit 1
fi

echo "🚀 Starting all backend services except ai_placement..."
echo
echo "Services that will be started:"
echo "  - AI Advisor (Port 5274)"
echo "  - Faculty (Port 5000)"
echo "  - AI Research Helper (Port 5005)"
echo "  - AI Library (Port 4001)"
echo "  - DIY Project Evaluator (Port 8000)"
echo "  - AI Course (Port 5002)"
echo "  - DIY Scheduler (Port 5003)"
echo "  - AI DIY (Port 5004)"
echo
echo "Press Ctrl+C to stop all services"
echo

# Start all services except ai_placement
$PYTHON_CMD start_services.py start-all

echo
echo "🛑 All services stopped" 