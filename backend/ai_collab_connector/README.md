# 🤝 AI Collab Connector

## Project Overview

AI Collab Connector is an intelligent agent designed to help users form ideal project teams by analyzing interests, skills, availability, and preferred domains. It features:
- Smart profile matching
- Skill-based matchmaking
- Task distribution
- Team chat
- XP rewards for collaboration

The platform enables users to quickly find collaborators, create teams, and communicate effectively to complete projects faster and better.

---

## Features
- **Profile Management:** Users can set up their skills, interests, and experience level.
- **Collaborator Matching:** AI recommends the best teammates for your project.
- **Team Creation:** Instantly form teams and assign roles.
- **Task Generation:** Auto-generate and distribute project tasks.
- **Team Chat:** Collaborate in real-time with your team.
- **XP & Rewards:** Earn XP for completing projects and collaborating.

---

## Setup Instructions

### Prerequisites
- Python 3.8+
- Flask
- Google Generative AI API key (for advanced AI features)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd hackronx/backend/ai_collab_connector
   ```

2. **Create and activate a virtual environment**
   ```bash
   python -m venv venv
   source venv/Scripts/activate  # On Windows
   # or
   source venv/bin/activate      # On Mac/Linux
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables**
   Create a `.env` file with:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   OPENROUTER_API_KEY=your_openrouter_api_key_here
   PORT=4011
   ```

5. **Start the service**
   ```bash
   python app.py
   ```

The service will be available at `http://localhost:4011`

---

## API Endpoints (Summary)
- `POST /api/create-profile` — Create or update user profile
- `POST /api/find-collaborators` — Find optimal teammates
- `POST /api/create-team` — Create a new team
- `POST /api/generate-tasks` — Generate task distribution
- `GET /api/team/<team_id>/tasks` — Get all tasks for a team
- `GET/POST /api/team/<team_id>/chat` — Team chat
- `POST /api/team/<team_id>/complete` — Complete a project and award XP

---

## Screenshots

> _Add screenshots of the UI or API responses here_

---

## License
MIT

## 🧠 What It Does

The AI Collab Connector analyzes:

- **Interests** - What users are passionate about
- **Skill sets** - Technical and soft skills
- **Learning stage** - Beginner/intermediate/advanced
- **Availability** - Time zones and schedules
- **Preferred project domain** - Hardware, coding, research, etc.

It then automatically suggests collaborators who complement their profile and goals.

## ⚙️ How It Works

### 1. Profile Matching
When a user wants to start a new project, they can enable the "Find a Collaborator" option.

AI analyzes:
- Completed projects
- Skill graph
- Personality traits (optional, based on community behavior)
- Time zone/availability
- Preferred working style (fast build, deep research, design-oriented)

### 2. Complementary Skill Matchmaking
Matches users with peers who:
- Know tools the user doesn't
- Are experienced in adjacent domains (e.g., a user with ML skills gets paired with someone good at UI/UX)
- Want to work on similar themes (e.g., climate tech, edtech)

### 3. Smart Task Distribution
Once a team is formed:
- The AI generates a project roadmap
- Breaks it into tasks based on each member's strength
- Assigns initial tasks, deadlines, and integration checkpoints

**Example:**
```
🧑 User A: Python + Data Science
👩 User B: Figma + Web Dev

AI Split:
• User A builds the ML model + writes backend APIs
• User B designs UI/UX + integrates front-end
```

### 4. Built-in Chat & Status Sync
Collaborators get a shared dashboard:
- Progress tracker
- Task status board (like Trello)
- Shared AI assistant for queries and idea generation
- Real-time updates and chat

### 5. Team Performance & XP Boost
Teams that complete projects get:
- Bonus XP
- "Collab Achiever" badges
- Featured on the leaderboard and community wall
- Auto-generated team certificate mentioning all members

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Flask
- Google Generative AI API key

### Installation

1. **Clone the repository**
   ```bash
   cd hackronx/backend/ai_collab_connector
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Set up environment variables**
   Create a `.env` file with:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   OPENROUTER_API_KEY=your_openrouter_api_key_here
   PORT=4010
   ```

4. **Start the service**
   ```bash
   python start.py
   ```

The service will be available at `http://localhost:4010`

## 📡 API Endpoints

### Health Check
```
GET /api/health
```
Returns service status and configuration.

### User Profile Management
```
POST /api/create-profile
```
Create or update user profile with skills, interests, and preferences.

### Collaboration Matching
```
POST /api/find-collaborators
```
Find optimal teammates based on project requirements and user profiles.

### Team Management
```
POST /api/create-team
```
Create a new team with selected collaborators.

```
POST /api/generate-tasks
```
Generate optimal task distribution for team members.

### Task Management
```
GET /api/team/{team_id}/tasks
```
Get all tasks for a specific team.

### Team Communication
```
GET /api/team/{team_id}/chat
```
Get chat messages for a team.

```
POST /api/team/{team_id}/chat
```
Send a chat message to team.

### Project Completion
```
POST /api/team/{team_id}/complete
```
Mark team project as complete and award XP.

### Leaderboard
```
GET /api/leaderboard
```
Get collaboration leaderboard with XP rankings.

## 🗄️ Database Schema

The service uses SQLite with the following tables:

- **user_profiles** - User information, skills, preferences
- **collab_requests** - Collaboration requests and requirements
- **teams** - Team information and status
- **team_members** - Team membership and roles
- **tasks** - Task assignments and progress
- **chat_messages** - Team communication
- **team_achievements** - XP and achievement tracking

## 🧲 Why It's Unique & Engaging

✅ **Helps students overcome hesitation to collaborate**
- AI-driven matching removes the awkwardness of finding partners

✅ **Ensures balanced skill synergy**
- AI decides the best pairs based on complementary skills

✅ **Removes "who will do what" confusion**
- Automatic task distribution based on strengths

✅ **Mimics real-world product teams**
- Professional workflow with clear roles and responsibilities

✅ **Encourages learning through peer mentoring**
- Pairing different experience levels for mutual growth

✅ **Boosts motivation with rewards and visibility**
- XP system, badges, and leaderboards

## 💡 Future Upgrades

- **Collab Rating System** - Peer feedback for team members
- **Team Rematches** - For hackathons or long-term builds
- **GitHub/Notion Integration** - Seamless project syncing
- **Video Chat Integration** - Built-in communication tools
- **Project Templates** - Pre-built collaboration workflows
- **Mentor Matching** - Connect with experienced developers

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `GEMINI_API_KEY` | Google Generative AI API key | Required |
| `OPENROUTER_API_KEY` | OpenRouter API key for additional AI features | Optional |
| `PORT` | Service port | 4010 |
| `FLASK_ENV` | Flask environment | development |

### API Configuration

The service supports CORS for frontend integration and includes comprehensive error handling and logging.

## 🧪 Testing

Test the service endpoints:

```bash
# Health check
curl http://localhost:4010/api/health

# Create a user profile
curl -X POST http://localhost:4010/api/create-profile \
  -H "Content-Type: application/json" \
  -d '{
    "clerk_id": "user_123",
    "username": "testuser",
    "email": "test@example.com",
    "skills": ["Python", "React"],
    "interests": ["AI", "Web Development"],
    "experience_level": "intermediate"
  }'
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is part of the HackronX platform and follows the same licensing terms.

## 🆘 Support

For issues and questions:
1. Check the API documentation
2. Review the logs for error details
3. Create an issue in the repository
4. Contact the development team

---

**Built with ❤️ for the HackronX community** 