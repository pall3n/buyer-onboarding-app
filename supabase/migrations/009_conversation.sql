-- 009_conversation.sql
-- Conversation turns for buyer sessions

CREATE TABLE IF NOT EXISTS conversation_turns (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  UUID NOT NULL REFERENCES buyer_sessions(id) ON DELETE CASCADE,
  role        TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content     TEXT NOT NULL,
  turn_index  INTEGER NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS conversation_turns_session_idx
  ON conversation_turns (session_id, turn_index);

ALTER TABLE conversation_turns ENABLE ROW LEVEL SECURITY;
-- No agent read policy — buyer-owned; accessed via admin client only
