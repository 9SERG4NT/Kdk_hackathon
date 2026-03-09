# Crowdsourced Road Issue Reporting Backend

This backend is deployed on Supabase project `xhiyabkazetvrnbxhxne`.

## What is already created

- Database schema migration: `supabase/migrations/20260309040832_road_issue_backend.sql`
- Seed file placeholder: `supabase/seed.sql`
- Edge functions:
  - `create-issue`
  - `admin-update-issue`
  - `admin-dashboard`

## Database objects

Tables:
- `public.profiles`
- `public.road_issues`
- `public.issue_updates`

Enums:
- `public.user_role`: `user`, `admin`
- `public.issue_status`: `reported`, `in_review`, `resolved`, `rejected`
- `public.issue_severity`: `low`, `medium`, `high`, `critical`

Storage bucket:
- `road-issue-images` (private, max 5 MB, jpeg/png/webp)

RPC functions:
- `is_admin()`
- `admin_issue_dashboard()`
- `nearby_open_issues(p_latitude, p_longitude, p_radius_km)`

View:
- `issue_public_feed`

## Security

- Row Level Security is enabled.
- Any authenticated user can create and view road issues.
- Only admins can update/delete issues and view admin dashboard function outputs.
- Image upload is restricted to `road-issue-images` and user folder prefix `<auth.uid()>/...`.

## Edge function URLs

Base URL:
- `https://xhiyabkazetvrnbxhxne.supabase.co/functions/v1`

Endpoints:
- `POST /create-issue`
- `PATCH /admin-update-issue`
- `GET /admin-dashboard`

## Required headers

Use these headers from frontend requests:

- `Authorization: Bearer <user_access_token>`
- `apikey: <SUPABASE_ANON_KEY>`
- `Content-Type: application/json` (for POST/PATCH)

## Example: create issue request body

```json
{
  "title": "Large pothole near bus stop",
  "description": "Deep pothole causing traffic slowdown and accidents.",
  "severity": "high",
  "latitude": 21.1458,
  "longitude": 79.0882,
  "address": "Wardha Road, Nagpur",
  "imagePath": "<auth.uid()>/issues/pothole-001.jpg"
}
```

## Admin role setup

New users are auto-added to `profiles` with role `user`.
To promote a user to admin, run this SQL in Supabase SQL Editor:

```sql
update public.profiles
set role = 'admin'
where id = '<USER_UUID>';
```

## Frontend integration notes

1. Upload image to storage bucket `road-issue-images` first.
2. Save the uploaded object path as `imagePath`.
3. Call `create-issue` with user access token.
4. Admin panel should use `admin-dashboard` and `admin-update-issue`.
