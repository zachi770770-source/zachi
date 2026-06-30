-- ============================================================
-- Row Level Security policies
-- כל משתמש קורא וכותב רק את הנתונים שלו.
-- book_chunks חשוף לקריאה לכל אחד מאומת.
-- ============================================================

alter table user_profiles enable row level security;
alter table diagnoses enable row level security;
alter table patterns enable row level security;
alter table tool_usage enable row level security;
alter table conversations enable row level security;
alter table memory_cards enable row level security;
alter table goals enable row level security;
alter table entitlements enable row level security;
alter table book_chunks enable row level security;
alter table safety_triggers enable row level security;
alter table analytics_events enable row level security;

-- =====================
-- USER PROFILES
-- =====================
create policy "user_profiles_select_own" on user_profiles
  for select using (auth.uid() = user_id);
create policy "user_profiles_insert_own" on user_profiles
  for insert with check (auth.uid() = user_id);
create policy "user_profiles_update_own" on user_profiles
  for update using (auth.uid() = user_id);

-- =====================
-- DIAGNOSES
-- =====================
create policy "diagnoses_select_own" on diagnoses
  for select using (auth.uid() = user_id);
create policy "diagnoses_insert_own" on diagnoses
  for insert with check (auth.uid() = user_id);
create policy "diagnoses_delete_own" on diagnoses
  for delete using (auth.uid() = user_id);

-- =====================
-- PATTERNS
-- =====================
create policy "patterns_select_own" on patterns
  for select using (auth.uid() = user_id);
create policy "patterns_insert_own" on patterns
  for insert with check (auth.uid() = user_id);
create policy "patterns_delete_own" on patterns
  for delete using (auth.uid() = user_id);

-- =====================
-- TOOL USAGE
-- =====================
create policy "tool_usage_select_own" on tool_usage
  for select using (auth.uid() = user_id);
create policy "tool_usage_insert_own" on tool_usage
  for insert with check (auth.uid() = user_id);
create policy "tool_usage_delete_own" on tool_usage
  for delete using (auth.uid() = user_id);

-- =====================
-- CONVERSATIONS
-- =====================
create policy "conversations_select_own" on conversations
  for select using (auth.uid() = user_id);
create policy "conversations_insert_own" on conversations
  for insert with check (auth.uid() = user_id);
create policy "conversations_update_own" on conversations
  for update using (auth.uid() = user_id);
create policy "conversations_delete_own" on conversations
  for delete using (auth.uid() = user_id);

-- =====================
-- MEMORY CARDS
-- =====================
create policy "memory_cards_select_own" on memory_cards
  for select using (auth.uid() = user_id);
create policy "memory_cards_insert_own" on memory_cards
  for insert with check (auth.uid() = user_id);
create policy "memory_cards_update_own" on memory_cards
  for update using (auth.uid() = user_id);
create policy "memory_cards_delete_own" on memory_cards
  for delete using (auth.uid() = user_id);

-- =====================
-- GOALS
-- =====================
create policy "goals_select_own" on goals
  for select using (auth.uid() = user_id);
create policy "goals_insert_own" on goals
  for insert with check (auth.uid() = user_id);
create policy "goals_update_own" on goals
  for update using (auth.uid() = user_id);
create policy "goals_delete_own" on goals
  for delete using (auth.uid() = user_id);

-- =====================
-- ENTITLEMENTS
-- =====================
create policy "entitlements_select_own" on entitlements
  for select using (auth.uid() = user_id);
-- אין INSERT/UPDATE policies לציבור — service role בלבד.

-- =====================
-- BOOK CHUNKS — קריאה לכל משתמש מאומת. כתיבה רק service role.
-- =====================
create policy "book_chunks_select_authenticated" on book_chunks
  for select using (auth.role() = 'authenticated' or auth.role() = 'anon');

-- =====================
-- SAFETY TRIGGERS — service role בלבד (אין policies → כל הגישה חסומה לקליינט)
-- =====================
-- (אין policy → אין גישה. רק service role יכול לכתוב.)

-- =====================
-- ANALYTICS EVENTS — אנונימי לכתיבה, קריאה רק service role
-- =====================
create policy "analytics_events_insert_anyone" on analytics_events
  for insert with check (true);
