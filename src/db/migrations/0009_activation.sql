ALTER TABLE partnerships ADD COLUMN profile_reviewed boolean NOT NULL DEFAULT false;
ALTER TABLE partnerships ADD COLUMN source_labels_reviewed boolean NOT NULL DEFAULT false;
ALTER TABLE partnerships ADD COLUMN operational_contact text;
ALTER TABLE intake_cases ADD COLUMN analytics_session uuid;
ALTER TABLE intake_cases ADD COLUMN analytics_search uuid;
