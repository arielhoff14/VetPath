CREATE TABLE environment_identity (singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton), environment text NOT NULL CHECK(environment IN ('demo','pilot')), created_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX membership_user_location_idx ON memberships(user_id,location_id) WHERE active;
CREATE INDEX outbox_pending_idx ON outbox_jobs(created_at) WHERE delivered_at IS NULL;
CREATE INDEX intake_location_created_idx ON intake_cases(location_id,created_at DESC);
ALTER TABLE availability_assertions ADD CONSTRAINT valid_availability_period CHECK(expires_at > observed_at AND expires_at <= observed_at + interval '4 hours');
