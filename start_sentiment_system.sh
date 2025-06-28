#!/bin/bash

echo "========================================"
echo "   Hackronx Sentiment Analysis System"
echo "========================================"
echo

echo "Checking for virtual environment..."
if [ ! -d "backend/venv" ]; then
    echo "Creating virtual environment..."
    cd backend
    python3 -m venv venv
    cd ..
fi

echo
echo "Starting Community Sentiment Analyzer..."
echo

# Start the sentiment analyzer backend with venv
cd backend
gnome-terminal --title="Sentiment Analyzer" -- bash -c "source venv/bin/activate && python start_sentiment_analyzer.py; exec bash" &
cd ..

echo
echo "Waiting for backend to start..."
sleep 5

echo
echo "Starting Admin Dashboard..."
echo

# Start the admin dashboard frontend
cd frontend-admin
gnome-terminal --title="Admin Dashboard" -- bash -c "npm run dev; exec bash" &
cd ..

echo
echo "========================================"
echo "    Services Starting..."
echo "========================================"
echo
echo "Backend (Sentiment Analyzer): http://localhost:5001"
echo "Admin Dashboard: http://localhost:3002"
echo
echo "Press Enter to open the admin dashboard..."
read

# Open the admin dashboard in default browser
if command -v xdg-open &> /dev/null; then
    xdg-open http://localhost:3002
elif command -v open &> /dev/null; then
    open http://localhost:3002
else
    echo "Please manually open: http://localhost:3002"
fi

echo
echo "========================================"
echo "    System Started Successfully!"
echo "========================================"
echo
echo "Services running:"
echo "- Sentiment Analyzer: http://localhost:5001"
echo "- Admin Dashboard: http://localhost:3002"
echo
echo "To stop services, close the terminal windows."
echo
read -p "Press Enter to exit..." 