# 🧠 NeuroSpace

> Your AI-powered academic command center for university success.

**NeuroSpace** is a full-stack, AI-augmented academic productivity platform built for university students who are tired of juggling five different apps to manage one semester. It unifies GPA tracking, timetables, assignments, exams, notes, financial goals, and an AI research assistant into a single, secure, cloud-synced workspace — wrapped in a distinctive cyber-terminal interface that makes studying feel less like a chore and more like operating your own command center.

[![React](https://img.shields.io/badge/React-19-149ECA?style=for-the-badge&logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Vercel](https://img.shields.io/badge/Vercel-Deployed-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/)
[![Gemini AI](https://img.shields.io/badge/Gemini-3.5%20Flash%20Lite-8E75B2?style=for-the-badge&logo=googlegemini&logoColor=white)](https://ai.google.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](#-license)

**🔗 Live Demo:** [neurospace-student.vercel.app](https://neurospace-student.vercel.app)
**📦 Repository:** [github.com/davisasteven1-hub/NeuroSpace-](https://github.com/davisasteven1-hub/NeuroSpace-)

---

## 📖 Overview

University life doesn't come with a dashboard. Deadlines live in one app, grades live in a spreadsheet, timetables live on a crumpled printout, and the "study plan" lives entirely in your head — until it doesn't. NeuroSpace was built to fix that by giving every student a single, opinionated, always-synced operating system for their academic life.

At its core, NeuroSpace treats a semester the way an engineer treats a system: as a set of interconnected states that need to be observed, measured, and acted on. Your GPA is a metric. Your assignments are a queue. Your exams are a countdown. Your notes are a searchable knowledge base. And your finances — because being a student is also a financial project — are a milestone tracker with its own roadmap. Every one of these subsystems is backed by Supabase, so nothing lives only on one device, and nothing is lost when a browser tab closes.

What separates NeuroSpace from a typical to-do app is the AI layer sitting on top of all of it. Instead of manually typing every exam date and assignment deadline, a student can drop a course outline PDF, a photo of a timetable, or a CSV of exam dates into the AI Assistant and have NeuroSpace extract, structure, and populate the relevant modules automatically. The assistant doesn't just chat — it reads, understands, and writes back into the system.

The result is a product that looks and feels like a serious SaaS application, not a weekend student project: a dedicated admin system for platform oversight, row-level-security-enforced multi-tenant data isolation, a smart notification engine, and a UI language — the "cognitive operations center" aesthetic — that is consistent across every module, from the dashboard to the financial goals tracker.

---

## 📸 Screenshots

> Replace these placeholders with real screenshots in a `docs/` folder before publishing.

| Dashboard | AI Assistant |
|---|---|
| ![Dashboard](docs/dashboard.png) | ![AI Assistant](docs/ai-assistant.png) |

| GPA System | Timetable |
|---|---|
| ![GPA](docs/gpa.png) | ![Timetable](docs/timetable.png) |

| Smart Notifications | Admin Dashboard |
|---|---|
| ![Notifications](docs/notifications.png) | ![Admin Dashboard](docs/admin-dashboard.png) |

| Financial Goals |
|---|
| ![Financial Goals](docs/financial-goals.png) |

---

## ✨ Core Features

| Module | Description |
|---|---|
| 🏠 **Dashboard** | • Real-time academic overview aggregating GPA, upcoming deadlines, and exams<br>• At-a-glance cards for assignments due this week and exam countdowns<br>• Central launch point into every other module |
| 🎓 **GPA System** | • Semester-by-semester and cumulative GPA/CGPA calculation<br>• "What-if" grade simulator to predict outcomes before results are released<br>• Credit tracking and grade distribution visualizations |
| 📅 **Timetable** | • Weekly class scheduling with course, venue, and instructor metadata<br>• Conflict-aware layout that renders cleanly on mobile and desktop<br>• Can be auto-populated by the AI Assistant from an uploaded timetable image |
| 📝 **Assignments** | • Deadline tracking with priority levels (Low → Critical)<br>• Color-coded status cards and sortable/filterable views<br>• Overdue detection feeding directly into Smart Notifications |
| 📘 **Exams** | • Exam planning with live countdown timers<br>• Venue, time, and course metadata per exam<br>• Automatic "upcoming exam" alerts |
| 🗒️ **Notes** | • Cloud-synced study notes with file attachments<br>• Supabase Storage-backed uploads (PDFs, images, documents)<br>• Searchable and organized by course |
| 🤖 **AI Assistant** | • Gemini-powered academic assistant for Q&A, summarization, and planning<br>• Multi-file uploads (PDF, image, text, CSV) with automatic data extraction<br>• Can write extracted data directly into Timetable, Exams, and Assignments |
| 🔔 **Smart Notifications** | • Automatic deadline alerts for exams and assignments<br>• Desktop dropdown and mobile bottom-sheet variants<br>• Unread badge counts with mark-all-as-read support |
| 🗓️ **Academic Calendar** | • Unified calendar view of exams, assignments, and academic events<br>• Month and list views optimized for small screens |
| 💰 **Financial Goals** | • ₦2.3M milestone-based savings/investment tracker<br>• Phase-based checkpoints with automatic "current mission" detection<br>• Streaks, celebration modals, and full CRUD on custom goals |
| 🛡️ **Admin System** | • Secure, isolated administrator portal at `/admin`<br>• Server-side verification against a dedicated `admin_users` table<br>• Full visibility into platform users without exposing service-role credentials to the client |

---

## 🤖 AI Assistant — Deep Dive

The AI Assistant is the intelligence layer of NeuroSpace, not a bolted-on chatbot. It is designed to close the gap between "I have a PDF of my course outline" and "my timetable is already filled in."

**Capabilities:**

- 🧠 Powered by **Gemini 3.5 Flash Lite** — chosen for its balance of speed, cost, and strong document-understanding performance for academic use cases.
- 📄 **PDF uploads** — course outlines, exam schedules, and syllabi can be parsed directly.
- 🖼️ **Image uploads** — photographs or screenshots of printed/whiteboard timetables and schedules.
- 📃 **Text file uploads** — plain notes or exported schedules.
- 📊 **CSV uploads** — structured exam or assignment data imported in bulk.
- 🔍 **Academic data extraction** — the assistant identifies course codes, dates, times, venues, and instructors from unstructured input.
- ✍️ **Auto-population** — extracted data can be pushed directly into the Timetable, Exams, and Assignments modules with user confirmation.
- 💾 **Conversation persistence** — every chat and message is stored in Supabase (`ai_chats`, `ai_messages`) so history survives across sessions and devices.
- 🛟 **Inline file fallback** — if Supabase Storage upload fails for any reason, the assistant falls back to sending the file inline in the request so the conversation never breaks.
- 📱 **Cross-platform** — a dedicated mobile chat drawer (`MobileAIChatDrawer`) mirrors full desktop functionality on small screens.

**Simplified request flow:**

```text
User
  ↓
React Frontend  (AIComposer / AIFileDropzone / MobileAIChatDrawer)
  ↓
/api/chat  (Vercel Serverless Function)
  ↓
Gemini 3.5 Flash Lite  (document understanding + generation)
  ↓
Supabase AI Storage  (ai_chats, ai_messages, ai_document_text, note-files bucket)
  ↓
React Frontend  (rendered response + optional auto-populate action)
```

The Gemini API key never touches the client — every AI request is proxied through a serverless function so the key stays server-side at all times (see [Security Considerations](#-security-considerations)).

---

## 🏗️ Technology Stack

| Layer | Technology |
|---|---|
| Frontend Framework | React 19 |
| Build Tool | Vite 6 |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS |
| Animation | Framer Motion |
| Icons | Lucide React |
| Routing | React Router v7 |
| Backend | Vercel Serverless Functions |
| Database | Supabase (PostgreSQL) |
| Authentication | Supabase Auth (PKCE flow) |
| File Storage | Supabase Storage |
| AI Provider | Google Gemini (3.5 Flash Lite) |
| Hosting / CI-CD | Vercel |

---

## 🗂️ Project Architecture

```text
NeuroSpace-
├── api/                        # Vercel serverless functions (admin + chat routes)
│   └── admin/
│       ├── check.ts
│       ├── users.ts
│       └── users/[id].ts
├── data/                       # Local JSON fixtures used in development
├── docs/                       # Screenshots and documentation assets
├── src/
│   ├── components/             # Reusable UI components, grouped by domain
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── financial/
│   │   ├── notifications/
│   │   └── Notes/
│   ├── pages/                  # Route-level views (Dashboard, GPA, Timetable, ...)
│   │   ├── admin/
│   │   └── auth/
│   ├── layout/                 # Sidebar, Header, and admin layout shells
│   ├── hooks/                  # Data-fetching and storage-sync hooks
│   ├── services/                # Supabase/API access layer, one per domain
│   ├── context/                # React context providers (Auth, Notifications)
│   ├── constants/               # Table names and shared constants
│   ├── utils/                   # Pure calculation and formatting helpers
│   └── types/                   # Shared TypeScript interfaces and Database types
├── supabase/                    # SQL migrations, one file per feature domain
├── public/                      # Static assets
└── vercel.json                  # Vercel routing and build configuration
```

**Folder responsibilities:**

- **`api/`** — Server-only code. Handles admin verification and chat proxying so secrets never reach the browser.
- **`src/components/`** — Presentational and domain components, organized so each feature (financial, notifications, dashboard) owns its own subfolder.
- **`src/pages/`** — One file per route, composed from hooks + services + components.
- **`src/hooks/`** — Encapsulate loading state, Supabase subscriptions, and local/cloud sync logic so pages stay declarative.
- **`src/services/`** — The only layer allowed to talk to `supabase-js` directly for a given domain; keeps data-access logic testable and centralized.
- **`src/context/`** — Cross-cutting state: authenticated user/session and the smart notifications provider.
- **`src/types/`** — Includes the generated-style `Database` interface that types every Supabase table, keeping the entire data layer end-to-end type-safe.
- **`supabase/`** — Every schema change lives as an explicit, re-runnable `.sql` file, making the database fully reproducible from source control.

---

## 🚀 Installation Guide

### Prerequisites

- Node.js `18+`
- npm `9+`
- A free [Supabase](https://supabase.com/) project
- A [Google AI Studio](https://ai.google.dev/) API key for Gemini

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/davisasteven1-hub/NeuroSpace-.git
cd NeuroSpace-

# 2. Install dependencies
npm install

# 3. Configure environment variables (see below)
cp .env.example .env

# 4. Run the development server
npm run dev
```

The app will be available at:

```text
http://localhost:5173
```

---

## 🔐 Environment Variables

| Variable | Required | Description |
|---|---|---|
| `VITE_SUPABASE_URL` | ✅ Yes | Supabase project URL, exposed to the client |
| `VITE_SUPABASE_ANON_KEY` | ✅ Yes | Supabase public anonymous key, exposed to the client |
| `VITE_APP_URL` | ✅ Yes | Frontend base URL, used for building auth redirect links |
| `SUPABASE_URL` | ✅ Yes | Server-side Supabase URL, used inside `/api` functions |
| `SUPABASE_ANON_KEY` | ✅ Yes | Server-side anonymous key, used for non-privileged server calls |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ Yes | Service role key, used only in server functions (admin verification) — **never shipped to the client** |
| `GEMINI_API_KEY` | ✅ Yes | Google Gemini API key, used only inside `/api/chat` |
| `GEMINI_MODEL` | ⭕ Optional | Overrides the default model; defaults to Gemini 3.5 Flash Lite |

### `.env.example`

```bash
# Client-side (safe to expose — Vite bundles these into the browser build)
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_APP_URL=http://localhost:5173

# Server-side only (used inside /api serverless functions)
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AI
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-3.5-flash-lite
```

> ⚠️ **Never commit `.env` to version control.** `SUPABASE_SERVICE_ROLE_KEY` and `GEMINI_API_KEY` grant elevated or billable access and must stay server-side only.

---

## 🗄️ Supabase Setup

NeuroSpace's entire schema is defined as version-controlled SQL migrations under `supabase/`. Run each file once, in order, inside the Supabase SQL editor (or via the Supabase CLI).

| Migration File | What it does |
|---|---|
| `supabase/storage.sql` | Creates the `avatars` and `note-files` storage buckets and their access policies, so profile pictures and note attachments are only readable/writable by their owning user. |
| `supabase/assignments.sql` | Creates the assignment persistence table and its access policies used by the Assignments module. |
| `supabase/ai.sql` | Creates `ai_chats`, `ai_messages`, and `ai_document_text` — the tables backing AI Assistant conversation history and parsed-document storage — with full row-level security keyed to `auth.uid()`. |
| `supabase/admin-system.sql` | Creates the `admin_users` table used to gate access to `/admin/*` routes and the admin API. |
| `supabase/financial-goals.sql` | Creates `financial_goal_groups`, `financial_goals`, and `financial_goal_settings` — the relational schema behind the Financial Goals module — with RLS policies and `updated_at` triggers. |

### What's enforced

- **Authentication** — every table (outside of public reference data) requires an authenticated Supabase session.
- **Storage** — the `note-files` bucket is private; signed access is scoped per user via storage policies.
- **Row Level Security (RLS)** — enabled on every user-data table. Policies universally follow the pattern `auth.uid() = user_id`, so PostgREST rejects any query that isn't scoped to the requesting user, at the database level — not just in application code.

---

## 🔑 Authentication Flow

NeuroSpace uses **Supabase Auth** with the **PKCE flow** for secure, SPA-friendly authentication.

1. **Signup** — a new user registers with email + password (`Signup.tsx`); a `display_name` is captured and stored in `user_metadata`.
2. **Email verification** — Supabase sends a confirmation email; the account remains unauthenticated for protected routes until verified.
3. **Login** — `Login.tsx` authenticates against Supabase Auth and establishes a persisted session (`persistSession: true`, `autoRefreshToken: true`).
4. **Session restoration** — on app load, `AuthContext` calls `supabase.auth.getSession()` and rehydrates the user without requiring a fresh login.
5. **Password reset** — `ForgotPassword.tsx` triggers a reset email; `ResetPassword.tsx` completes the flow using the recovery token.
6. **Auth callback handling** — `AuthCallback.tsx` parses Supabase's redirect (magic link, recovery, or email-change callback), classifies success/error states, and routes the user accordingly.
7. **Protected routes** — `ProtectedRoute` wraps the entire authenticated application shell; unauthenticated users are redirected to `/login`.
8. **First-login initialization** — on first successful session, `initializeUserData()` seeds default rows for GPA, timetable, exams, and assignments so every module renders a sensible empty state instead of erroring.

**Production redirect URL used for all auth callbacks:**

```text
https://neurospace-student.vercel.app/auth/callback
```

---

## 🛡️ Admin System

NeuroSpace ships with a fully separated administrator experience, isolated from the student-facing application both in routing and in data access.

- **`/admin/login`** — a dedicated login screen, entirely separate from the student `/login` page.
- **`/admin/dashboard`** — the administrator's home view: platform-wide user visibility and management tools.
- **`admin_users` table** — the single source of truth for who is an administrator. A row's existence, keyed by `user_id`, is what grants elevated access — nothing is hardcoded in the frontend.
- **Server-side admin verification** — the client never determines its own admin status. Every privileged check happens inside `/api/admin/check`, which queries Supabase using the service-role key on the server and returns only a boolean/role result to the client.
- **Service-role protected API routes** — `/api/admin/users` and `/api/admin/users/[id]` use the Supabase **service role key**, which only exists in the serverless runtime, to read/manage user data that RLS would otherwise block for a normal client.
- **`AdminGuard`** — a route wrapper that calls the verification endpoint before rendering any admin page, and redirects non-admins back to `/admin/login`.

**Why ordinary users can't reach admin pages:** even if a regular user manually navigates to `/admin/dashboard`, `AdminGuard` blocks rendering until `/api/admin/check` confirms admin status server-side. That check ultimately reduces to:

```sql
select exists (
  select 1 from admin_users where admin_users.user_id = auth.uid()
);
```

Because this decision is made server-side against a table normal users have no write access to, there is no client-side flag, role string, or JWT claim a user could tamper with to escalate privileges.

---

## 🔔 Smart Notification System

The `SmartNotificationsProvider` context continuously watches Assignments and Exams data and produces a unified, prioritized alert feed.

- **Bell icon in the header** — always visible, with a live unread badge count.
- **Desktop dropdown** — a compact panel anchored under the bell for quick triage.
- **Mobile bottom-sheet modal** — a full-width, swipe-friendly sheet replacing the dropdown below the `lg` breakpoint.
- **Upcoming exam detection** — exams within a configurable window are surfaced automatically, most urgent first.
- **Assignment reminders** — deadlines approaching within days are flagged before they become urgent.
- **Overdue assignment alerts** — anything past its due date and incomplete is escalated visually.
- **Unread badge count** — tracked per notification and cleared individually or in bulk.
- **Mark-all-as-read** — a single action to clear the entire feed once reviewed.

**Example feed:**

```text
🔴 CSC214 Exam — Tomorrow
🟠 PHY102 Assignment — 2 days
🔵 MTH201 Quiz — Friday
```

Color coding follows the same `panic` / `caution` / `safe` token system used across the rest of the UI, so urgency is instantly recognizable without reading the copy.

---

## 💰 Financial Goals Module

The Financial Goals module extends NeuroSpace beyond academics into a student's real-world financial life, tracking a **₦2.3 million** savings/investment roadmap modeled on a Stanbic Money Market Fund plan.

- **Milestone groups (phases)** — the roadmap is broken into four phases (*Quarter Complete*, *The Millionaire Build*, *Serious Investor Zone*, *Countdown to ₦2.3 Million*), each a collapsible section with its own completion percentage.
- **Progress tracking** — two progress metrics are tracked simultaneously: `completedGoals / totalGoals` (checkpoint progress) and `currentBalance / targetBalance` (financial progress).
- **Completion checkboxes** — every checkpoint can be marked complete/incomplete, instantly recoloring its card and timestamping the achievement.
- **Supabase persistence** — backed by three relational tables (`financial_goal_groups`, `financial_goals`, `financial_goal_settings`), all protected by row-level security scoped to `auth.uid()`.
- **Automatic next-goal detection** — the "Current Mission" banner always points to the lowest-amount, not-yet-completed checkpoint, recalculated live as goals are marked complete.
- **Responsive mobile layout** — checkpoint cards, phase headers, and progress bars use fluid, `min-w-0`/`break-words` layouts that never overflow, from 320px screens up.

**Example milestones:**

```text
₦575,000    → 25.0%   (Phase 1 checkpoint)
₦1,000,000  → 43.5%   (Major Milestone 🏆)
₦1,500,000  → 65.2%   (Major Milestone 🏆)
₦2,000,000  → 87.0%   (Major Milestone 🏆)
₦2,300,000  → 100%    (Freedom Target 🏆)
```

Crossing a major milestone triggers a cyber-styled celebration modal, reinforcing the same "operations center" identity used throughout the app.

---

## 📱 Responsive Design

NeuroSpace is built **mobile-first**. Every layout is authored for the smallest realistic device first, then progressively enhanced with Tailwind's responsive prefixes (`sm:`, `lg:`) rather than the other way around.

Explicitly tested and optimized breakpoints:

- **320px** — smallest common Android devices
- **360px** — the most common Android width
- **375px** — iPhone SE / compact iPhones
- **390px** — modern iPhone standard width
- **Tablets** (`sm`–`md`) — two-column layouts activate
- **Desktop** (`lg`+) — full sidebar, multi-column dashboards

**Specific fixes shipped for small-screen reliability:**

- 🗓️ **Calendar overflow** — the Academic Calendar switches to a scrollable, non-wrapping list rendering on narrow screens instead of clipping day cells.
- 📊 **Dashboard overflow** — summary cards use `min-w-0` and `break-words` throughout so long course names or currency values never force horizontal scroll.
- 🔔 **Notification modal scrolling** — the mobile notification sheet uses an internal scroll container capped to viewport height, so long alert lists never push action buttons off-screen.

Every route-level container also applies `overflow-x-hidden` at the shell level (`App.tsx`) as a last line of defense against accidental horizontal scroll from any individual component.

---

## 📡 API Documentation

All server logic lives in Vercel Serverless Functions under `/api`, keeping privileged keys off the client entirely.

| Endpoint | Purpose |
|---|---|
| `POST /api/chat` | Proxies AI conversations to Gemini, persists messages to Supabase, and returns the assistant's response. |
| `POST /api/import` | Accepts an uploaded document (PDF/image/CSV/text), extracts structured academic data via Gemini, and returns a normalized payload the client can commit to Timetable/Exams/Assignments. |
| `GET /api/admin/check` | Verifies whether the current authenticated user is present in `admin_users`; returns an admin/role flag only. |
| `GET /api/admin/session` | Returns lightweight session/role metadata for the currently authenticated admin. |
| `GET /api/admin/users` | Returns a paginated list of platform users for the admin dashboard (service-role access). |
| `GET /api/admin/users/:id` | Returns detailed profile and activity data for a single user (service-role access). |

### Example — `POST /api/chat`

**Request:**

```json
{
  "chatId": "b2b6b6b0-1234-4a90-9c3e-000000000000",
  "message": "Summarize this exam timetable and add the dates to my Exams page.",
  "attachments": [
    { "type": "pdf", "storagePath": "note-files/user123/timetable.pdf" }
  ]
}
```

**Response:**

```json
{
  "reply": "I found 3 exams in this document: CSC214 (Nov 12), MTH201 (Nov 15), PHY102 (Nov 18). Want me to add them to your Exams page?",
  "extracted": {
    "exams": [
      { "courseCode": "CSC214", "date": "2026-11-12", "venue": "Hall A" },
      { "courseCode": "MTH201", "date": "2026-11-15", "venue": "Hall B" },
      { "courseCode": "PHY102", "date": "2026-11-18", "venue": "Hall C" }
    ]
  }
}
```

### Example — `GET /api/admin/check`

**Response:**

```json
{
  "isAdmin": true,
  "role": "owner"
}
```

---

## 📦 Build & Deployment

### Local production build

```bash
npm run build
```

This runs a full TypeScript type-check followed by a Vite production build, emitting static assets into `dist/`.

### Deploying on Vercel

1. Import the repository into a new Vercel project.
2. Configure the build settings:

   | Setting | Value |
   |---|---|
   | Framework Preset | **Vite** |
   | Build Command | `npm run build` |
   | Output Directory | `dist` |
   | Install Command | `npm install` |

3. Add every environment variable from the [Environment Variables](#-environment-variables) table to the Vercel project settings (Production **and** Preview environments).
4. Deploy. Vercel will automatically route `/api/*` requests to the serverless functions in the `api/` folder.

### ✅ Vercel environment variable checklist

- [ ] `VITE_SUPABASE_URL`
- [ ] `VITE_SUPABASE_ANON_KEY`
- [ ] `VITE_APP_URL`
- [ ] `SUPABASE_URL`
- [ ] `SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `GEMINI_API_KEY`
- [ ] `GEMINI_MODEL` *(optional)*

---

## 🛠️ Troubleshooting

| Symptom | Likely Cause | Fix |
|---|---|---|
| `vite: command not found` | Dependencies weren't installed, or a global `vite` install is being invoked instead of the local one. | Run `npm install` in the project root, then use `npm run dev` (never a bare `vite` command) so npm resolves the local binary. |
| Supabase queries return empty data / `403`/`RLS` errors | Row Level Security is blocking the query because the request isn't authenticated, or `user_id` wasn't included on insert. | Confirm the user is signed in before querying; ensure every insert explicitly sets `user_id: user.id`; re-check the relevant `supabase/*.sql` policy was actually run. |
| AI uploads fail silently | The `note-files` storage bucket policy rejects the upload, or the file exceeds Gemini's accepted size/type. | Re-run `supabase/storage.sql`; confirm the bucket is `note-files` and private; check file size/type against Gemini's supported formats — the app will fall back to inline file sending if storage upload fails. |
| `GEMINI_MODEL` / Gemini errors (invalid model, quota) | Incorrect model string, missing/invalid `GEMINI_API_KEY`, or API quota exhausted. | Verify `GEMINI_API_KEY` is set in the **server** environment (not `VITE_`-prefixed); confirm the model name matches Gemini's current API identifiers; check Google AI Studio quota. |
| Refreshing a deep link (e.g. `/gpa`) on Vercel returns a 404 | Vercel doesn't know this is a client-side SPA route. | Ensure `vercel.json` includes a rewrite rule sending all non-`/api` paths to `index.html`. |
| Password reset link redirects to the wrong URL or shows an expired-link error | `VITE_APP_URL` doesn't match the deployed domain, or the Supabase Auth redirect URL allowlist wasn't updated. | Set `VITE_APP_URL` to the exact production URL; add `https://neurospace-student.vercel.app/auth/callback` to Supabase Auth → URL Configuration → Redirect URLs. |
| Admin login succeeds but the dashboard redirects back to `/admin/login` | The authenticated user isn't present in `admin_users`, so `/api/admin/check` returns `false`. | Insert the user's `id` (from `auth.users`) into `admin_users` directly via the Supabase SQL editor. |
| File uploads fail with a storage permission error | Storage bucket policies don't grant the current user access, or the bucket doesn't exist yet. | Re-run `supabase/storage.sql`; confirm the bucket names (`avatars`, `note-files`) match exactly what `STORAGE_BUCKETS` in `src/lib/supabase.ts` expects. |

---

## ⚡ Performance Considerations

- **Lazy loading** — heavier, less-frequently-visited routes (Admin, AI Assistant attachments) are structured to be split independently from the core student shell.
- **Code splitting** — Vite's default Rollup output automatically chunks vendor code (React, Supabase client, Framer Motion) away from route-specific bundles.
- **Serverless function usage** — AI and admin logic run as short-lived, independently-scaled Vercel functions rather than a persistent backend, keeping cold-start and cost overhead minimal for a student-scale app.
- **Supabase query optimization** — queries are scoped with explicit `.eq('user_id', ...)` filters (reinforced, not replaced, by RLS) and select only the columns each view needs rather than `select('*')` in hot paths.
- **Mobile performance** — animations are limited to opacity/transform (GPU-friendly) via Framer Motion, and list-heavy views (notifications, goal checkpoints) avoid re-rendering unaffected siblings by keying on stable IDs.
- **Notification rendering efficiency** — the notification engine derives its feed with `useMemo`, so it only recomputes when the underlying assignments/exams data actually changes, not on every render.

---

## 🔒 Security Considerations

- **Row Level Security (RLS) everywhere** — every user-data table enforces `auth.uid() = user_id` at the database layer, so even a compromised or buggy client can never read or write another user's data.
- **Service-role key isolation** — `SUPABASE_SERVICE_ROLE_KEY` exists **only** inside Vercel serverless functions and is never bundled into client-side JavaScript.
- **Authenticated-only storage access** — the `note-files` bucket is private; files are only reachable through authenticated, user-scoped requests.
- **Protected admin APIs** — all elevated operations (`/api/admin/*`) re-verify the requester's admin status server-side on every call; there is no persistent "admin mode" trusted from the client.
- **No hardcoded secrets** — every credential is sourced from environment variables, both locally (`.env`, git-ignored) and in production (Vercel project settings).
- **Server-side AI key handling** — `GEMINI_API_KEY` is used exclusively inside `/api/chat` and `/api/import`; the browser never sees or calls the Gemini API directly.

---

## 🗺️ Roadmap

- [ ] OCR for handwritten notes
- [ ] Push notifications (web + mobile)
- [ ] Offline support with background sync
- [ ] Study analytics and productivity insights
- [ ] Collaborative study groups
- [ ] External calendar synchronization (Google Calendar / Outlook)
- [ ] AI-powered GPA prediction based on historical performance
- [ ] Native mobile app version

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome. NeuroSpace follows a standard feature-branch workflow:

```bash
# 1. Create a feature branch
git checkout -b feature/my-feature

# 2. Make your changes, then commit
git commit -m "Add my feature"

# 3. Push and open a pull request
git push origin feature/my-feature
```

### Coding standards

- ✅ **TypeScript strict mode** — no `any` where a real type is knowable; prefer explicit interfaces in `src/types/`.
- ✅ **Tailwind utility-first styling** — avoid ad-hoc CSS files; compose utility classes, following the existing `safe` / `caution` / `panic` / `void` / `surface` design tokens.
- ✅ **Functional React components** — hooks over classes, colocated state, and side effects isolated into `src/hooks/`.
- ✅ **Responsive-first design** — every new component must be verified at 320px before shipping, not just at desktop width.

Please open an issue before starting work on a large feature so the direction can be discussed first.

---

## 📄 License

This project is licensed under the **MIT License**.

```text
MIT License

Copyright (c) 2026 David Ayomide Stephen

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 👤 Author

**David Ayomide Stephen**
Computer Science Student, Air Force Institute of Technology (AFIT)

🔗 GitHub: [@davisasteven1-hub](https://github.com/davisasteven1-hub)

> I built NeuroSpace because I was tired of watching classmates — and myself — lose marks and momentum to disorganization rather than a lack of ability. Every module in this app exists to remove one specific piece of friction between a student and their goals: not knowing a deadline, not knowing a GPA, not knowing where a savings target stands. My goal is to keep building tools that make being an organized, intentional student the default, not the exception.

---

<p align="center">
  <strong>◎ NEURO_SPACE</strong> — Cognitive Operations Center<br>
  <sub>Built for students, by a student.</sub>
</p>