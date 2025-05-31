-- 001_create_core_tables.sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE business (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text,
  password_hash text NOT NULL,
  description text,
  website_url text,
  industry text,
  social_links jsonb,
  location jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE influencer (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  username text UNIQUE NOT NULL,
  email text NOT NULL,
  phone text,
  password_hash text NOT NULL,
  bio text,
  profile_picture_url text,
  location jsonb,
  social_media jsonb,
  categories text[],
  rate_per_post numeric,
  availability text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE campaign (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  description text,
  business_id uuid REFERENCES business(id) ON DELETE CASCADE,
  campaign_type text,
  deliverables text[],
  budget numeric,
  payment_status text,
  proposed_dates daterange,
  status text,
  platform_targets text[],
  categories text[],
  metrics jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE campaign_influencer (
  campaign_id uuid REFERENCES campaign(id) ON DELETE CASCADE,
  influencer_id uuid REFERENCES influencer(id) ON DELETE CASCADE,
  PRIMARY KEY (campaign_id, influencer_id)
);
