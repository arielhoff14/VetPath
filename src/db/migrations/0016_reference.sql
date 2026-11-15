ALTER TABLE provider_locations ALTER COLUMN address DROP NOT NULL;
ALTER TABLE provider_locations ALTER COLUMN latitude DROP NOT NULL;
ALTER TABLE provider_locations ALTER COLUMN longitude DROP NOT NULL;
ALTER TABLE provider_locations DROP CONSTRAINT provider_locations_care_type_check;
ALTER TABLE provider_locations ADD CONSTRAINT provider_locations_care_type_check CHECK (care_type IN ('emergency','urgent','specialty','general','unknown'));
