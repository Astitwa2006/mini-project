# QuizRush ⚡ — Real-Time Multiplayer Tech Trivia

> Compete with friends on live tech questions generated from today's news, powered by Gemini + Socket.io.

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
| LLM | Gemini (model configurable via `GEMINI_MODEL`, see `.env.example`) |
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
npm run install:all
```

Requires **Node.js 20+** (see `engines` in package.json — the app uses the global
`crypto.randomUUID()` API, which needs a modern Node runtime).

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

1. **RSS → LLM Pipeline**: The moment a room is created, the server fetches tech news RSS feeds for the host's chosen topics (in parallel) and batches several articles per Gemini call to generate quiz questions efficiently, caching the pool in Redis (`RSS_REFRESH_INTERVAL_MINUTES`) so later rooms with the same topics reuse it instantly instead of re-generating.

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

---

## Deployment

The server is already wired for a **single-service deployment**: in production
(`NODE_ENV=production`) it serves the built React app as static files and
falls back to `index.html` for client-side routing (see `server/src/index.js`).
That means client and server ship as one process — no separate static host
required, though you can still split them (e.g. client on Vercel, server on
Render) if you prefer, as long as `CLIENT_URL` (server) and `VITE_SERVER_URL`
(client) point at each other's real URLs and Socket.io's CORS check will pass.

### Option A — Docker (any host: Fly.io, Railway, a VPS, etc.)

```bash
docker build -t quizrush .
docker run -p 3001:3001 --env-file server/.env -e REDIS_URL=redis://<your-redis-host>:6379 quizrush
```

Or for local testing of the exact deploy image, with Redis included:

```bash
docker compose up --build
```

### Option B — Platform-as-a-Service (Render, Railway, etc.)

1. Push this repo to a git remote (`git remote add origin <url> && git push -u origin main`).
2. Create a Redis instance (most PaaS providers offer a managed add-on) and note its connection URL.
3. Create a Web Service pointing at this repo with:
   - **Build command:** `npm run install:all && npm run build --workspace=client`
   - **Start command:** `npm start --workspace=server`
4. Set the environment variables below on the service (values, not files — most
   platforms don't read `.env` files from the repo).

### Required environment variables (production)

Same variables as `.env.example` / `server/.env`, with production values:

| Variable | Notes |
|---|---|
| `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | From your Supabase project settings |
| `REDIS_URL` | Your managed Redis connection string |
| `GEMINI_API_KEY` | Google AI Studio key |
| `CLIENT_URL` | Your deployed app's public URL (e.g. `https://quizrush.example.com`) — used for CORS and Socket.io origin checks |
| `PORT` | Usually auto-injected by the platform; the app reads `process.env.PORT` |
| `NODE_ENV` | Set to `production` |

The **client** env vars (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`,
`VITE_SERVER_URL`) are baked in at *build time* by Vite — set them before
running the build command, not just at runtime. If client and server share
one origin (Option A/B above), `VITE_SERVER_URL` can be left empty so the
socket client defaults to `window.location.origin`.

Remember to also enable **Google OAuth** in Supabase → Auth → Providers, and
add your production URL to the provider's authorized redirect URLs.
