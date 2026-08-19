-- ============================================================
-- QuizRush — Supabase Database Schema
-- Run this in your Supabase SQL Editor to set up the database
-- ============================================================

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ── Profiles (extends auth.users) ───────────────────────────────
create table public.profiles (
  id            uuid primary key references auth.users on delete cascade,
  username      text,
  avatar_url    text,
  total_score   int  not null default 0,
  games_played  int  not null default 0,
  fav_topics    text[] default '{}',
  created_at    timestamptz not null default now()
);

-- Auto-create profile on new user signup (Google OAuth)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, username, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── Rooms ────────────────────────────────────────────────────────
create table public.rooms (
  id             uuid primary key default gen_random_uuid(),
  code           text unique not null,
  host_id        uuid references public.profiles on delete set null,
  status         text not null default 'waiting'
                   check (status in ('waiting', 'active', 'finished')),
  topics         text[] not null default '{}',
  question_count int  not null default 10,
  difficulty     text not null default 'any'
                   check (difficulty in ('any', 'easy', 'medium', 'hard')),
  max_players    int  not null default 8,
  created_at     timestamptz not null default now()
);

-- ── Game Sessions ────────────────────────────────────────────────
create table public.game_sessions (
  id          uuid primary key default gen_random_uuid(),
  room_id     uuid references public.rooms on delete cascade,
  topics      text[] not null default '{}',
  questions   jsonb,           -- snapshot of all questions used
  started_at  timestamptz not null default now(),
  ended_at    timestamptz
);

-- ── Scores ───────────────────────────────────────────────────────
create table public.scores (
  id            uuid primary key default gen_random_uuid(),
  session_id    uuid references public.game_sessions on delete cascade,
  user_id       uuid references public.profiles on delete cascade,
  score         int  not null default 0,
  rank          int,
  correct_count int  not null default 0,
  created_at    timestamptz not null default now()
);

-- ── Chat Messages ────────────────────────────────────────────────
create table public.chat_messages (
  id          uuid primary key default gen_random_uuid(),
  room_id     uuid references public.rooms on delete cascade,
  user_id     uuid references public.profiles on delete cascade,
  message     text not null,
  created_at  timestamptz not null default now()
);

-- ── RPC: increment total score ───────────────────────────────────
create or replace function public.increment_total_score(uid uuid, delta int)
returns void language sql security definer as $$
  update public.profiles
  set
    total_score  = total_score + delta,
    games_played = games_played + 1
  where id = uid;
$$;

-- ── Row Level Security ───────────────────────────────────────────
alter table public.profiles       enable row level security;
alter table public.rooms          enable row level security;
alter table public.game_sessions  enable row level security;
alter table public.scores         enable row level security;
alter table public.chat_messages  enable row level security;

-- Profiles: users can read all, only update their own
create policy "Profiles are public"        on public.profiles for select using (true);
create policy "Users update own profile"   on public.profiles for update using (auth.uid() = id);

-- Rooms: anyone can read, authenticated users can insert
create policy "Rooms are public"           on public.rooms for select using (true);
create policy "Auth users create rooms"    on public.rooms for insert with check (auth.role() = 'authenticated');

-- Scores: public read
create policy "Scores are public"          on public.scores for select using (true);

-- Chat: public read, authenticated insert
create policy "Chat is public"             on public.chat_messages for select using (true);
create policy "Auth users can chat"        on public.chat_messages for insert with check (auth.role() = 'authenticated');

-- ── Grants ───────────────────────────────────────────────────────
-- Supabase's `anon`/`authenticated`/`service_role` roles normally inherit
-- default privileges on the `public` schema automatically. If you're seeing
-- "permission denied for table X" even though RLS policies look correct
-- (RLS and GRANTs are separate layers — service_role bypasses RLS but
-- still needs a table-level GRANT), run this block once to fix it:
grant usage on schema public to anon, authenticated, service_role;
grant all      on all tables    in schema public to service_role;
grant select, insert, update, delete
  on public.profiles, public.rooms, public.game_sessions, public.scores, public.chat_messages
  to authenticated;
grant select
  on public.profiles, public.rooms, public.scores, public.chat_messages
  to anon;
grant execute on function public.increment_total_score(uuid, int) to service_role;

-- ── Indexes ──────────────────────────────────────────────────────
create index idx_rooms_code           on public.rooms(code);
create index idx_rooms_status         on public.rooms(status);
create index idx_scores_session       on public.scores(session_id);
create index idx_scores_user          on public.scores(user_id);
create index idx_chat_room            on public.chat_messages(room_id);
create index idx_profiles_total_score on public.profiles(total_score desc);
