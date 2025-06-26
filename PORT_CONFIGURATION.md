# Port Configuration Summary

## Backend Services Port Assignment

| Service | Port | Description | Status |
|---------|------|-------------|--------|
| AI Advisor | 4001 | Career advisor chatbot with document processing | ✅ Running |
| Faculty | 4002 | Document processing, quiz generation, RAG chatbot | ✅ Running |
| Research Helper | 4003 | AI research assistance and tool finding | ✅ Running |
| AI Library | 4004 | AI resource library and knowledge base | ✅ Running |
| AI Placement | 4005 | Job placement and resume matching | ⚠️ Excluded by default |
| DIY Evaluator | 4006 | Project evaluation and assessment | ✅ Running |
| AI Course | 4007 | Course generation and curriculum planning | ✅ Running |
| DIY Scheduler | 4008 | Task scheduling and reminder system | ✅ Running |
| AI DIY | 4009 | DIY project generator and flowchart creator | ✅ Running |

## Frontend Configuration

| Component | Port | Description | Status |
|-----------|------|-------------|--------|
| Next.js App | 3001 | Main frontend application | ✅ Running |
| API Routes | 3001 | Frontend API endpoints | ✅ Running |

## Frontend Backend Connections

| Frontend Page | Backend Service | Port | Status |
|---------------|-----------------|------|--------|
| `/ai-advisor` | AI Advisor | 4001 | ✅ Correct |
| `/ai-faculty` | Faculty | 4002 | ✅ Fixed |
| `/research-helper` | Research Helper | 4003 | ✅ Correct |
| `/library` | AI Library | 4004 | ✅ Correct |
| `/diy-evaluator` | DIY Evaluator | 4006 | ✅ Correct |
| `/course-generator` | AI Course | 4007 | ✅ Correct |
| `/scheduler` | DIY Scheduler | 4008 | ✅ Correct |
| `/diy-generator` | AI DIY | 4009 | ✅ Correct |

## Environment Variables

### Frontend (.env.local)
```bash
# Frontend runs on port 3001
NEXT_PUBLIC_APP_URL=http://localhost:3001

# Backend service URLs (if needed)
NEXT_PUBLIC_AI_ADVISOR_URL=http://localhost:4001
NEXT_PUBLIC_FACULTY_URL=http://localhost:4002
NEXT_PUBLIC_RESEARCH_HELPER_URL=http://localhost:4003
NEXT_PUBLIC_AI_LIBRARY_URL=http://localhost:4004
NEXT_PUBLIC_DIY_EVALUATOR_URL=http://localhost:4006
NEXT_PUBLIC_COURSE_GENERATOR_URL=http://localhost:4007
NEXT_PUBLIC_SCHEDULER_URL=http://localhost:4008
NEXT_PUBLIC_DIY_GENERATOR_URL=http://localhost:4009
```

### Backend (.env)
```bash
# Service ports
PORT_AI_ADVISOR=4001
PORT_FACULTY=4002
PORT_RESEARCH_HELPER=4003
PORT_AI_LIBRARY=4004
PORT_AI_PLACEMENT=4005
PORT_DIY_EVALUATOR=4006
PORT_AI_COURSE=4007
PORT_DIY_SCHEDULER=4008
PORT_AI_DIY=4009
```

## Health Check Endpoints

All backend services now include health check endpoints:

- `http://localhost:4001/health` - AI Advisor
- `http://localhost:4002/health` - Faculty
- `http://localhost:4003/health` - Research Helper
- `http://localhost:4004/health` - AI Library
- `http://localhost:4005/health` - AI Placement
- `http://localhost:4006/health` - DIY Evaluator
- `http://localhost:4007/health` - AI Course
- `http://localhost:4008/health` - DIY Scheduler
- `http://localhost:4009/health` - AI DIY

## Starting Services

### Start All Backend Services (except ai-placement)
```bash
cd backend
python start_services.py start-all
```

### Start Specific Services
```bash
cd backend
python start_services.py start ai_advisor faculty research_helper
```

### Start Frontend
```bash
cd frontend
npm run dev
```

## Troubleshooting

### Port Conflicts
If you get "port already in use" errors:
1. Check which process is using the port: `netstat -ano | findstr :4001`
2. Kill the process: `taskkill /PID <process_id> /F`
3. Restart the service

### Service Not Responding
1. Check if service is running: `python start_services.py status`
2. Check health endpoint: `curl http://localhost:4001/health`
3. Check logs for errors
4. Restart the service: `python start_services.py restart ai_advisor`

### Frontend Connection Issues
1. Verify backend services are running
2. Check browser console for CORS errors
3. Verify port numbers match in frontend code
4. Clear browser cache and reload

## Notes

- All services use unique ports to avoid conflicts
- AI Placement service (4005) is excluded by default due to complexity
- Frontend runs on port 3001 to avoid conflicts with other services
- All services include proper CORS configuration
- Health check endpoints are available for monitoring
- Session cleanup is implemented to prevent memory leaks 