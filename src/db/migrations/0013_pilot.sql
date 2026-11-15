ALTER TABLE pilot_agreements ADD COLUMN agreed_price_cents integer CHECK(agreed_price_cents>=0);
ALTER TABLE pilot_agreements ADD COLUMN conversion_note text;
CREATE TABLE pilot_extensions(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),agreement_id uuid NOT NULL REFERENCES pilot_agreements(id),previous_end_date date NOT NULL,new_end_date date NOT NULL,reason text NOT NULL,actor_id text NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),CHECK(new_end_date>previous_end_date));
