# QuizRush ⚡ — Real-Time Multiplayer Tech Trivia

> Compete with friends on live tech questions generated from today's news, powered by Gemini 2.0 Flash + Socket.io.

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite + Tailwind CSS v4 + Framer Motion |
| Backend | Node.js + Express |
| Real-time | Socket.io (WebSockets) |
| Database | Supabase (PostgreSQL) |
| Cache | Redis (ioredis) |
| Auth | Google OAuth via Supabase |
| LLM | Gemini 2.0 Flash |
| Questions | Tech RSS Feeds → Gemini LLM Pipeline |
| Testing | Jest |

---

## Project Structure

```
mini-project/
├── client/          # React frontend
├── server/          # Node.js backend
├── tests/           # Jest test suites
└── supabase/        # SQL schema
```

---

## Setup

### 1. Clone & Install

```bash
git clone <repo>
cd mini-project
npm install:all
```

### 2. Environment Variables

```bash
cp .env.example server/.env
# Fill in your values:
#   SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
#   REDIS_URL
#   GEMINI_API_KEY
#   CLIENT_URL
```

```bash
# Client env (create client/.env)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_SERVER_URL=http://localhost:3001
```

### 3. Database

Run `supabase/schema.sql` in your Supabase SQL Editor.

Enable **Google OAuth** in Supabase → Auth → Providers → Google.

### 4. Redis

```bash
# Mac
brew install redis && brew services start redis

# Or Docker
docker run -d -p 6379:6379 redis:alpine
```

### 5. Run

```bash
npm run dev          # starts both client (5173) and server (3001)
npm run dev:server   # server only
npm run dev:client   # client only
npm test             # jest suite
```

---

## How It Works

1. **RSS → LLM Pipeline**: Every 15 minutes, the server fetches tech news RSS feeds filtered by topic, sends each article to Gemini 2.0 Flash with a structured JSON prompt, and caches the generated quiz questions in Redis.

2. **Room Creation**: Host picks topics (AI/ML, Cloud, etc.), difficulty, and question count. A 6-char room code + shareable link are generated.

3. **Synchronized Questions**: When a game starts, the server locks a question set in Redis under the room key. All players receive questions via Socket.io at the exact same time — guaranteed same questions on all screens.

4. **Scoring**: Correct answers earn 500–1000 pts based on how fast you answered. Scores are pushed live to all players.

5. **Results**: Final leaderboard is persisted to Supabase and shown on the results page with a podium animation.

---

## Socket Events

| Event | Direction | Description |
|---|---|---|
| `room:create` | C→S | Create a new room |
| `room:join` | C→S | Join by code |
| `game:start` | C→S | Host starts the game |
| `game:answer` | C→S | Submit an answer |
| `chat:message` | C→S | Send chat message |
| `game:question` | S→C | New question broadcast |
| `game:reveal` | S→C | Correct answer reveal |
| `game:score_update` | S→C | Live leaderboard update |
| `game:finished` | S→C | Game over with final scores |
