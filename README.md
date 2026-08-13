# Duolingo Clone Monorepo

Welcome to the Duolingo Clone codebase. This repository is structured as a monorepo containing a Next.js frontend and a FastAPI backend with a SQLite database.

---

## Tech Stack

* **Frontend**: Next.js 14+ (App Router), React, TypeScript, Tailwind CSS, Nunito font asset loading.
* **Backend**: FastAPI, SQLAlchemy (ORM), Pydantic v2 (Validation schemas).
* **Database**: SQLite (local file stored at `backend/app/duolingo.db`).
* **Deployment/Process Managers**: uvicorn, Vercel config, Procfile & render.yaml configurations.

---

## Setup Instructions

### Backend Setup
1. **Navigate to backend directory**:
   ```bash
   cd backend
   ```
2. **Create and activate a virtual environment**:
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   ```
3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```
4. **Seed the database** (this will drop existing tables and create fresh tables/exercises):
   ```bash
   python -m app.seed
   ```
5. **Run the server** (starts on port 8000 by default):
   ```bash
   .venv/bin/uvicorn app.main:app --reload
   ```

### Frontend Setup
1. **Navigate to frontend directory**:
   ```bash
   cd frontend
   ```
2. **Install npm dependencies**:
   ```bash
   npm install
   ```
3. **Configure environment variables**:
   Create a `.env.local` file in the `frontend/` directory:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```
4. **Run the development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Architecture Overview

This project uses a standard decoupled client-server architecture. The Next.js frontend handles stateful view rendering and user inputs, querying the FastAPI server over HTTP/REST JSON endpoints. FastAPI handles business logic, state checking (such as validating user answers and decrementing hearts), and persists data through SQLAlchemy into a local SQLite database.

```text
+-----------------------+              HTTP JSON               +----------------------+
|                       |  ==================================>  |                      |
|   Frontend (Next.js)  |                                       |   Backend (FastAPI)  |
|                       |  <==================================  |                      |
+-----------------------+         CORS allowed on 3000          +----------------------+
                                                                           ||
                                                                      SQLAlchemy ORM
                                                                           ||
                                                                           \/
                                                                +----------------------+
                                                                |                      |
                                                                |   SQLite Database    |
                                                                |    (duolingo.db)     |
                                                                |                      |
                                                                +----------------------+
```

---

## Database Schema

The database consists of the following 8 tables defined using SQLAlchemy:

### 1. `users`
* `id` (Integer, Primary Key): Unique user ID.
* `username` (String, Unique, Indexed): User account name.
* `total_xp` (Integer, default 0): Accumulated user XP.
* `streak_count` (Integer, default 0): Consecutive daily active streak.
* `hearts` (Integer, default 5): Hearts pool.
* `last_heart_lost_at` (DateTime, Nullable): Timestamp of the last lost heart (for regen math).
* `last_active_date` (Date, Nullable): Tracking date for daily streaks.
* `daily_xp_goal` (Integer, default 20): User's daily target XP.
* `xp_today` (Integer, default 0): Daily accumulated XP.
* `created_at` (DateTime, default utcnow): Join date.

### 2. `courses`
* `id` (Integer, Primary Key): Course ID.
* `name` (String): Course name (e.g. "Spanish").
* `language_code` (String): Language abbreviation (e.g. "es").

### 3. `units`
* `id` (Integer, Primary Key): Unit ID.
* `course_id` (Integer, ForeignKey to `courses.id`): Parent course.
* `title` (String): Unit banner title.
* `order_index` (Integer): Order placement in the path.

### 4. `skills`
* `id` (Integer, Primary Key): Skill node ID.
* `unit_id` (Integer, ForeignKey to `units.id`): Parent unit.
* `title` (String): Skill node title (e.g. "Greetings").
* `order_index` (Integer): Order index in the unit path.
* `icon` (String, Nullable): Icon design selector.

### 5. `lessons`
* `id` (Integer, Primary Key): Lesson ID.
* `skill_id` (Integer, ForeignKey to `skills.id`): Parent skill node.
* `order_index` (Integer): Order within the skill.

### 6. `exercises`
* `id` (Integer, Primary Key): Exercise ID.
* `lesson_id` (Integer, ForeignKey to `lessons.id`): Parent lesson.
* `order_index` (Integer): Sort order within lesson.
* `type` (Enum: `multiple_choice`, `translate`, `type_answer`): Exercise format type.
* `prompt` (String): The question prompt bubble text.
* `correct_answer` (String): The answer value to compare server-side.
* `options` (JSON, Nullable): Word choice options/choices bank array.

### 7. `user_skill_progress`
* `id` (Integer, Primary Key): Progress ID.
* `user_id` (Integer, ForeignKey to `users.id`): Active user.
* `skill_id` (Integer, ForeignKey to `skills.id`): Associated skill.
* `crowns` (Integer, default 0): Earned crowns count.
* `status` (Enum: `locked`, `available`, `completed`): User access state.
* `lessons_completed` (Integer, default 0): Completed lesson segments count.

### 8. `user_lesson_completion`
* `id` (Integer, Primary Key): Completion ID.
* `user_id` (Integer, ForeignKey to `users.id`): Active user.
* `lesson_id` (Integer, ForeignKey to `lessons.id`): Completed lesson.
* `completed_at` (DateTime, default utcnow): Time of completion.
* `xp_earned` (Integer): XP gained from completion.

---

## API Overview

| Method | Path | Purpose |
| :--- | :--- | :--- |
| `GET` | `/health` | Check backend server status. |
| `GET` | `/api/user/me` | Fetch user profile state, including heart regeneration checking. |
| `POST` | `/api/user/refill-hearts` | Instantly sets user hearts to 5. |
| `GET` | `/api/path` | Returns course curriculum units and nested skills annotated with progress status. |
| `GET` | `/api/skills/{skill_id}/progress` | Returns lesson completed counts and the next lesson ID to play. |
| `GET` | `/api/lessons/{lesson_id}` | Fetches lesson exercises without exposing correct answers. |
| `POST` | `/api/lessons/{lesson_id}/exercises/{exercise_id}/check` | Trims, compares submitted answer, and manages user heart deductions. |
| `POST` | `/api/lessons/{lesson_id}/complete` | Saves lesson progress, logs XP and crowns, unlocks downstream skills, updates streak. |
| `POST` | `/api/user/advance-day` | Dev helper to roll back date by 1 day (testing daily streak progression). |
| `GET` | `/api/leaderboard` | Returns sorted user standings ranked by XP. |
| `GET` | `/api/user/profile` | Fetches default user profile details and crowns totals. |

---

## Assumptions

1. **Single User Scoping**: Authentication and multi-user login flows are bypassed. The codebase operates relative to a single hardcoded default user (`user_id = 1`) seeded with `username = "learner"`.
2. **Heart Regeneration Timer**: Regenerates 1 heart every 30 minutes. If the user completes correct exercises when full, the timer remains idle.
3. **Mocked Gems**: Gem balances are mocked to return a constant value of `500` for layout purposes.
4. **Streak Advancement Helper**: The `/api/user/advance-day` endpoint exists purely for developers to roll back time, simulating daily transitions to verify that streaks increment on subsequent days or reset after missed days.
5. **No Answer Leaks**: Client fetch payloads for exercises exclude `correct_answer`. Answer checks are run securely server-side.

---

## Deployment Steps

This project is configured to read the backend URL dynamically from environment variables on compilation.

### Backend Deployment (Render / Railway)
1. **Procfile & render.yaml**: The repository contains `backend/Procfile` and `backend/render.yaml` configured to auto-run:
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port $PORT
   ```
2. **Deploying to Render**:
   * Create a new Web Service pointing to your GitHub repository.
   * Set **Root Directory** to `backend`.
   * Set **Runtime** to `Python`.
   * Render will automatically discover and run the configuration specified in your `render.yaml`.
3. **Note the Deployed URL** (e.g., `https://duolingo-backend.onrender.com`).

### Frontend Deployment (Vercel)
1. **Deploying to Vercel**:
   * Set up Vercel integration with your GitHub repository.
   * Configure the root directory to `frontend`.
   * Under **Environment Variables**, add:
     * Key: `NEXT_PUBLIC_API_URL`
     * Value: Your deployed backend URL (e.g. `https://duolingo-backend.onrender.com`)
2. Deploy the application. Next.js will read this env var at compile time, directing all routing fetches to the live backend.
