ALTER TABLE provider_locations ADD COLUMN receives_requests boolean NOT NULL DEFAULT false;
ALTER TABLE intake_cases ADD COLUMN source text NOT NULL DEFAULT 'owner' CHECK(source IN ('owner','phone','walk_in','handoff'));
ALTER TABLE intake_cases ADD CONSTRAINT intake_state_check CHECK(state IN ('submitted','acknowledged','information_requested','next_step_sent','withdrawn','closed'));
CREATE TABLE owner_case_grants (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), case_id uuid NOT NULL REFERENCES intake_cases(id) ON DELETE CASCADE, token_hash text NOT NULL UNIQUE, expires_at timestamptz NOT NULL, revoked_at timestamptz, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE case_events (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), case_id uuid NOT NULL REFERENCES intake_cases(id), actor_id text NOT NULL, event_type text NOT NULL, old_state text, new_state text, owner_visible_text text, created_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX case_events_case_time_idx ON case_events(case_id,created_at);
CREATE TABLE owner_messages (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), case_id uuid NOT NULL REFERENCES intake_cases(id), message text NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE request_rate_limits (bucket_hash text NOT NULL, window_start timestamptz NOT NULL, requests integer NOT NULL, PRIMARY KEY(bucket_hash,window_start));
