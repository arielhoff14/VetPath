ALTER TABLE directory_sources ADD COLUMN fictional boolean NOT NULL DEFAULT false;
ALTER TABLE directory_sources ADD CONSTRAINT fictional_only_in_demo CHECK(NOT fictional OR is_demo);
