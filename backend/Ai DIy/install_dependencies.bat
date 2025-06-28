@echo off
echo Installing AI DIY Dependencies...
echo.

REM Activate virtual environment if it exists
if exist "venv\Scripts\activate.bat" (
    echo Activating virtual environment...
    call venv\Scripts\activate.bat
) else (
    echo No virtual environment found, installing globally...
)

echo.
echo Installing Python dependencies...
pip install --upgrade pip
pip install Flask==3.1.0
pip install flask-cors==5.0.1
pip install requests==2.32.3
pip install google-generativeai==0.8.5
pip install youtube-transcript-api==0.6.2
pip install python-dotenv==1.1.0
pip install graphviz==0.20.1
pip install opencv-python==4.9.0.80
pip install numpy==1.26.4
pip install Pillow>=9.0.0

echo.
echo Installation completed!
echo.
echo To start the server, run: python app.py
pause 