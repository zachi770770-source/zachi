-- ============================================================
-- מדייטים לאהבה — מיגרציה ראשונית
-- Phase 2: Auth, Memory, RAG, Entitlements
-- ============================================================

-- pgvector ל-RAG (חייב להיות מותקן ב-Supabase project settings → Database → Extensions)
create extension if not exists vector;

-- ============================================================
-- USER PROFILES
-- ============================================================
create table if not exists user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  segment text check (segment in ('dating','new_relationship','long_term','after_breakup','second_chapter')),
  display_name text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- DIAGNOSES
-- ============================================================
create table if not exists diagnoses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  segment text not null,
  scores jsonb not null,
  dominant_voice text not null,
  taken_at timestamptz default now()
);

create index if not exists diagnoses_user_id_idx on diagnoses(user_id, taken_at desc);

-- ============================================================
-- PATTERNS — דפוסים שזוהו לאורך זמן
-- ============================================================
create table if not exists patterns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  pattern_key text not null,
  source text not null check (source in ('journal','coach','diagnosis','tool')),
  evidence text,
  noted_at timestamptz default now()
);

create index if not exists patterns_user_id_idx on patterns(user_id, noted_at desc);

-- ============================================================
-- TOOL USAGE
-- ============================================================
create table if not exists tool_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  tool_slug text not null,
  caught_driver_when text check (caught_driver_when in ('before','during','after') or caught_driver_when is null),
  result_json jsonb,
  used_at timestamptz default now()
);

create index if not exists tool_usage_user_idx on tool_usage(user_id, used_at desc);
create index if not exists tool_usage_tool_idx on tool_usage(tool_slug);

-- ============================================================
-- CONVERSATIONS — שיחות מאמן
-- ============================================================
create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  intent text not null check (intent in ('situation','date','journal','plan','conversation')),
  messages jsonb not null default '[]'::jsonb,
  summary text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists conversations_user_idx on conversations(user_id, updated_at desc);

-- ============================================================
-- MEMORY CARD — סיכום נוכחי של המשתמש לזיכרון המאמן
-- ============================================================
create table if not exists memory_cards (
  user_id uuid primary key references auth.users(id) on delete cascade,
  card_text text not null default '',
  updated_at timestamptz default now()
);

-- ============================================================
-- GOALS — יעדים שבועיים
-- ============================================================
create table if not exists goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  goal_text text not null,
  source text check (source in ('diagnosis','coach','tool')),
  set_at timestamptz default now(),
  done_at timestamptz,
  expires_at timestamptz
);

-- ============================================================
-- ENTITLEMENTS — Free / Premium
-- ============================================================
create table if not exists entitlements (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan text not null default 'free' check (plan in ('free','premium')),
  premium_since timestamptz,
  premium_until timestamptz,
  features jsonb default '{}'::jsonb
);

-- ============================================================
-- BOOK CHUNKS — בסיס ה-RAG
-- ============================================================
create table if not exists book_chunks (
  id text primary key,
  chapter_key text not null,
  chunk_index int not null,
  content text not null,
  embedding vector(1536) not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz default now()
);

create index if not exists book_chunks_chapter_idx on book_chunks(chapter_key);
create index if not exists book_chunks_embedding_idx
  on book_chunks using ivfflat (embedding vector_cosine_ops)
  with (lists = 50);

-- ============================================================
-- SAFETY TRIGGERS — לניטור פנימי בלבד
-- ============================================================
create table if not exists safety_triggers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  trigger_type text not null,
  context_excerpt text,
  triggered_at timestamptz default now()
);

-- ============================================================
-- ANALYTICS EVENTS (אופציונלי — אם לא משתמשים ב-PostHog)
-- ============================================================
create table if not exists analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  event_name text not null,
  properties jsonb,
  occurred_at timestamptz default now()
);

create index if not exists analytics_events_user_idx on analytics_events(user_id, occurred_at desc);
create index if not exists analytics_events_name_idx on analytics_events(event_name);
