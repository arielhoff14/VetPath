ALTER TABLE directory_sources ADD COLUMN sheet_id text;
ALTER TABLE directory_sources ADD COLUMN sheet_range text;
ALTER TABLE directory_sources ADD COLUMN column_mapping jsonb;
ALTER TABLE directory_sources ADD COLUMN poll_interval_seconds integer NOT NULL DEFAULT 60 CHECK(poll_interval_seconds BETWEEN 60 AND 86400);
ALTER TABLE directory_sources ADD COLUMN next_poll_at timestamptz;
ALTER TABLE directory_sources ADD COLUMN configured_by text REFERENCES "user"(id);
ALTER TABLE directory_sources ADD COLUMN last_error text;
CREATE INDEX directory_sources_poll_idx ON directory_sources(next_poll_at) WHERE kind='google_sheets';
CREATE TABLE staff_notifications(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),location_id uuid NOT NULL REFERENCES provider_locations(id),case_id uuid REFERENCES intake_cases(id),kind text NOT NULL,outbox_id uuid NOT NULL UNIQUE REFERENCES outbox_jobs(id),created_at timestamptz NOT NULL DEFAULT now(),read_at timestamptz);
