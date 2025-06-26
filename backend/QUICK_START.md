# Quick Start Guide - Backend Services

## Port Configuration

All backend services now use organized port ranges to avoid conflicts:

### Backend Services (Ports 4001-4009)
- **4001** - AI Advisor Service
- **4002** - Faculty Service  
- **4003** - AI Research Helper Service
- **4004** - AI Library Service
- **4005** - AI Placement Service (excluded by default)
- **4006** - DIY Project Evaluator Service
- **4007** - AI Course Service
- **4008** - DIY Scheduler Service
- **4009** - AI DIY Service

### Frontend
- **3001** - Next.js Frontend (avoids PostgreSQL on 3000)

## Quick Commands

### Start All Services (Recommended)
```bash
cd backend
python start_services.py start-all
```

### Start Specific Services
```bash
python start_services.py start ai_course faculty
```

### Check Service Status
```bash
python start_services.py status
```

### Stop All Services
```bash
python start_services.py stop
```

## Testing Services

### Test All Backend Services
```bash
python test_backend.py
```

### Test Individual Services
```bash
# AI Course Service
curl http://localhost:4007/test

# DIY Scheduler Service  
curl http://localhost:4008/health

# AI Research Helper Service
curl http://localhost:4003/health
```

## Frontend Integration

The frontend is configured to connect to the new backend ports:
- Frontend runs on: `http://localhost:3001`
- All API calls use the new port assignments (4001-4009)

## Troubleshooting

1. **Port Already in Use**: Stop all services first with `python start_services.py stop`
2. **Service Not Starting**: Check the terminal output for error messages
3. **Frontend Can't Connect**: Ensure backend services are running and ports are accessible
4. **Environment Variables**: Copy `env_template.txt` to `.env` and configure your API keys

## Service Health Checks

Each service provides health check endpoints:
- `/health` - Most services
- `/test` - Some services use this instead

Visit `http://localhost:PORT/health` or `http://localhost:PORT/test` to verify each service is running.

## 🚀 Quick Start (Recommended)

### Windows
```bash
# Navigate to backend directory
cd backend

# Run the batch script
start_all_services.bat
```

### Linux/Mac
```bash
# Navigate to backend directory
cd backend

# Run the shell script
./start_all_services.sh
```

### Manual Python Command
```bash
# Navigate to backend directory
cd backend

# Start all services except ai_placement
python start_services.py start-all
```

## 📋 Services Started

The following services will be started automatically:

| Service | Port | Description |
|---------|------|-------------|
| AI Advisor | 5274 | AI Advisor Service |
| Faculty | 5000 | Faculty Service |
| AI Research Helper | 5005 | AI Research Helper Service |
| AI Library | 4001 | AI Library Service |
| DIY Project Evaluator | 8000 | DIY Project Evaluator Service |
| AI Course | 5002 | AI Course Service |
| DIY Scheduler | 5003 | DIY Scheduler Service |
| AI DIY | 5004 | AI DIY Service |

## 🛑 Stopping Services

Press `Ctrl+C` in the terminal to stop all services gracefully.

## 🔧 Other Commands

```bash
# Check service status
python start_services.py status

# Stop all services
python start_services.py stop

# Start specific services
python start_services.py start ai_library faculty

# Start only ai_placement (if needed)
python start_services.py start ai_placement
```

## ⚠️ Prerequisites

1. Python 3.7+ installed
2. All required packages installed (run `pip install -r requirements.txt`)
3. Environment variables configured (see `env_template.txt`)

## 🐛 Troubleshooting

If services fail to start:

1. Check if all required packages are installed
2. Verify environment variables are set correctly
3. Check if ports are available (no other services using them)
4. Look at the error messages in the terminal output

## 📝 Notes

- The ai-placement service is excluded by default to avoid conflicts
- Each service runs on its own port to avoid conflicts
- Services are started with a 1-second delay between each to ensure proper initialization
- All services will be stopped when you press Ctrl+C 