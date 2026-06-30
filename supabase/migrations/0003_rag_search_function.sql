-- ============================================================
-- match_book_chunks: שליפת top-K chunks הכי דומים ל-query embedding.
-- שימוש מהקוד: supabase.rpc('match_book_chunks', { query_embedding, match_count, min_score })
-- ============================================================

create or replace function match_book_chunks(
  query_embedding vector(1536),
  match_count int default 6,
  min_score float default 0.3,
  filter_voice_tags text[] default null,
  filter_tool_tags text[] default null
)
returns table (
  id text,
  chapter_key text,
  chunk_index int,
  content text,
  metadata jsonb,
  similarity float
)
language sql stable as $$
  select
    bc.id,
    bc.chapter_key,
    bc.chunk_index,
    bc.content,
    bc.metadata,
    1 - (bc.embedding <=> query_embedding) as similarity
  from book_chunks bc
  where
    (1 - (bc.embedding <=> query_embedding)) >= min_score
    and (
      filter_voice_tags is null
      or bc.metadata->'voiceTags' ?| filter_voice_tags
    )
    and (
      filter_tool_tags is null
      or bc.metadata->'toolTags' ?| filter_tool_tags
    )
  order by bc.embedding <=> query_embedding
  limit match_count;
$$;

-- הרשאה לקרוא לפונקציה ל-anon ו-authenticated
grant execute on function match_book_chunks(vector(1536), int, float, text[], text[])
  to authenticated, anon, service_role;
