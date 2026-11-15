CREATE TABLE organizations (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE provider_locations (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid REFERENCES organizations(id), external_id text UNIQUE,
 name text NOT NULL, care_type text NOT NULL CHECK (care_type IN ('emergency','urgent','specialty','general')),
 address text NOT NULL, phone text, latitude double precision NOT NULL CHECK(latitude BETWEEN -90 AND 90), longitude double precision NOT NULL CHECK(longitude BETWEEN -180 AND 180),
 species text[] NOT NULL DEFAULT '{}', services text[] NOT NULL DEFAULT '{}', source_label text NOT NULL, source_url text,
 demo boolean NOT NULL DEFAULT false, updated_at timestamptz NOT NULL DEFAULT now(), version integer NOT NULL DEFAULT 1
);
CREATE TABLE availability_assertions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), location_id uuid NOT NULL REFERENCES provider_locations(id),
 state text NOT NULL CHECK (state IN ('accepting','restricted','not_accepting','unknown')), restriction text,
 observed_at timestamptz NOT NULL DEFAULT now(), expires_at timestamptz NOT NULL, author_id text NOT NULL, version integer NOT NULL DEFAULT 1
);
CREATE INDEX availability_location_observed_idx ON availability_assertions(location_id, observed_at DESC);
CREATE TABLE memberships (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id text NOT NULL, location_id uuid NOT NULL REFERENCES provider_locations(id), role text NOT NULL CHECK (role IN ('reception','clinician','manager')), active boolean NOT NULL DEFAULT true, UNIQUE(user_id,location_id,role));
CREATE TABLE intake_cases (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), location_id uuid NOT NULL REFERENCES provider_locations(id), owner_observations text NOT NULL, state text NOT NULL DEFAULT 'submitted', created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), version integer NOT NULL DEFAULT 1);
CREATE TABLE clinical_assessments (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), case_id uuid NOT NULL REFERENCES intake_cases(id), author_id text NOT NULL, assessment text NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE audit_events (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), actor_id text NOT NULL, action text NOT NULL, object_type text NOT NULL, object_id uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE outbox_jobs (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), topic text NOT NULL, payload jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), delivered_at timestamptz, attempts integer NOT NULL DEFAULT 0);
