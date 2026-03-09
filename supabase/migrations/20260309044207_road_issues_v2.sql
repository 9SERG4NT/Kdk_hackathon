-- Drop the old complex schema from v1 if it exists
drop view if exists public.issue_public_feed;
drop function if exists public.admin_issue_dashboard();
drop function if exists public.nearby_open_issues(double precision, double precision, double precision);
drop function if exists public.log_issue_status_change() cascade;
drop function if exists public.handle_new_user() cascade;
drop function if exists public.is_admin() cascade;
drop function if exists public.set_updated_at() cascade;
drop table if exists public.issue_updates cascade;
drop table if exists public.road_issues cascade;
drop table if exists public.profiles cascade;
drop type if exists public.user_role;
drop type if exists public.issue_status;
drop type if exists public.issue_severity;

-- Create the simplified road_issues table per spec
create table if not exists public.road_issues (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references auth.users(id) on delete set null,
  title text not null,
  description text not null,
  category text not null default 'Other',
  image_url text,
  latitude float8 not null,
  longitude float8 not null,
  status text not null default 'Reported',
  created_at timestamptz not null default now()
);

create index if not exists idx_road_issues_latitude on public.road_issues (latitude);
create index if not exists idx_road_issues_longitude on public.road_issues (longitude);
create index if not exists idx_road_issues_status on public.road_issues (status);

-- Enable RLS
alter table public.road_issues enable row level security;

-- Admin helper: checks app_metadata set via the Supabase service-role API or Dashboard
create or replace function public.is_admin()
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin',
    false
  );
$$;

-- Public read policy
drop policy if exists "Anyone can read issues" on public.road_issues;
create policy "Anyone can read issues"
on public.road_issues for select
to anon, authenticated
using (true);

-- Authenticated insert policy: reporters must be signed in and own the row
drop policy if exists "Anyone can create issues" on public.road_issues;
drop policy if exists "Authenticated users can create issues" on public.road_issues;
create policy "Authenticated users can create issues"
on public.road_issues for insert
to authenticated
with check (auth.uid() = reporter_id);

-- Admin-only update policy
drop policy if exists "Anyone can update issues" on public.road_issues;
drop policy if exists "Admins can update issues" on public.road_issues;
create policy "Admins can update issues"
on public.road_issues for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Storage bucket for issue images
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'road-issue-images',
  'road-issue-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Public read for storage objects
drop policy if exists "Public read for road images" on storage.objects;
create policy "Public read for road images"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'road-issue-images');

-- Authenticated-only upload for storage objects
drop policy if exists "Public upload for road images" on storage.objects;
create policy "Authenticated upload for road images"
on storage.objects for insert
to authenticated
with check (bucket_id = 'road-issue-images');
