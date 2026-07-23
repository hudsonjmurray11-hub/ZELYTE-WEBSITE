-- Run this in the Supabase SQL Editor to ensure the schema is in place.
-- Safe to re-run at any time (all statements are idempotent).

create table if not exists email_signups (
  id         uuid        primary key default gen_random_uuid(),
  email      text        unique not null,
  source     text        default 'homepage',
  created_at timestamptz default now()
);

alter table email_signups enable row level security;

drop policy if exists "public_insert" on email_signups;
create policy "public_insert" on email_signups
  for insert with check (true);

-- Flavor preference captured by the two-step email popup
-- ('crispy-mint' | 'black-cherry' | 'both').
alter table email_signups
  add column if not exists flavor_preference text;
