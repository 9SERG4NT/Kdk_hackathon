# Civic Reporter

Civic Reporter is a Next.js + Supabase web application for reporting civic issues and managing resolution workflows for authorities.

## Overview

The platform provides:

- A landing page with video background and role-based access flow.
- Admin dashboard for analytics and issue management.
- NMC operations dashboard for assignment and resolution actions.
- Map-based issue visualization using Leaflet.
- Activity log tracking for status changes.

## Current Workflow

Issue lifecycle currently uses 3 statuses:

1. `Reported`
2. `Submitted to NMC`
3. `Resolved`

Operational note:

- NMC can assign a worker name while issue is in `Submitted to NMC`.
- Once assigned, UI shows `Worker Assigned (In Process)`.
- NMC then uses `Mark Resolved` to move issue to `Resolved`.

## Roles and Login

This project currently uses hardcoded auth for demo/hackathon use:

- Admin: `admin` / `123`
- NMC: `nmc` / `123`

Role routing:

- Admin -> `/dashboard`
- NMC -> `/nmc`

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- TanStack Query
- Supabase (Database, Storage, Edge Functions)
- Leaflet + react-leaflet
- Recharts

## Routes

- `/` -> Landing page
- `/login` -> Login page
- `/dashboard` -> Admin dashboard
- `/issues` -> Admin issue table and controls
- `/map` -> Geographic issue map
- `/nmc` -> NMC operations panel
- `/admin` -> Redirects to `/dashboard`

## Project Structure

```text
app/
  page.tsx                # Landing page
  login/page.tsx          # Login
  dashboard/page.tsx      # Admin dashboard
  issues/page.tsx         # Admin issue management
  nmc/page.tsx            # NMC operations
  map/page.tsx            # Map view

features/
  dashboard/components/   # Charts and dashboard widgets
  issues/components/      # Tables, forms, timeline
  issues/hooks/           # React Query hooks
  issues/services/        # Supabase API service layer

components/system/
  AppNavbar.tsx
  AuthGuard.tsx
  FirstLoadSplash.tsx
  RouteTransition.tsx

supabase/
  functions/              # Edge functions
  migrations/             # SQL migrations
```

## Environment Variables

Create `.env.local` with:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Running the Project

Install dependencies:

```bash
npm install
```

Start frontend:

```bash
npm run dev
```

Default dev URL:

- `http://localhost:3000` (or configured port such as `3006`)

## Backend Notes (Docker vs Cloud)

This repo supports 2 backend modes:

1. Local Supabase (requires Docker Desktop)
2. Supabase Cloud (no Docker needed)

If Docker is unavailable, frontend can still work against Supabase Cloud as long as `.env.local` points to your cloud project.

## Edge Functions

Current functions in this project:

- `create-issue`
- `admin-update-issue`
- `admin-dashboard`

Deploy example:

```bash
supabase functions deploy create-issue --project-ref <project-ref>
supabase functions deploy admin-update-issue --project-ref <project-ref>
supabase functions deploy admin-dashboard --project-ref <project-ref>
```

## Migration Note

Workflow/activity migration file:

- `supabase/migrations/20260309050000_workflow_and_activity.sql`

Apply migrations to remote DB before relying on activity logs and worker assignment features.
