-- Track when each buyer session last received an ephemeral token,
-- so the token endpoint can enforce a per-session cooldown.
ALTER TABLE buyer_sessions
  ADD COLUMN IF NOT EXISTS last_token_issued_at TIMESTAMPTZ;
