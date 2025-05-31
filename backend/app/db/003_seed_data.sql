-- 003_seed_data.sql
-- Insert two businesses (use fixed UUIDs for testing)
INSERT INTO business (id, name, email, password_hash, description, website_url, industry, social_links, location)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'TestBrand', 'brand@test.com', 'hashed_pw', 'Test brand desc', 'https://testbrand.com', 'Fashion', '{"instagram":"@test","facebook":"fb.com/test"}', '{"city":"Mumbai","state":"Maharashtra","country":"India"}'),
  ('22222222-2222-2222-2222-222222222222', 'DemoCorp', 'demo@corp.com', 'hashed_pw', 'Demo corp desc', 'https://democorp.com', 'Tech', '{"twitter":"@democorp"}', '{"city":"Bangalore","state":"Karnataka","country":"India"}');

-- Insert two influencers
INSERT INTO influencer (id, name, username, email, password_hash, bio, profile_picture_url, location, social_media, categories, rate_per_post, availability)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Alice Patel', 'alicepatel', 'alice@test.com', 'hashed_pw', 'Fashion influencer based in Mumbai', 'https://pics.com/alice.jpg', '{"city":"Mumbai","state":"Maharashtra","country":"India"}', '{"instagram":{"handle":"@alice","followers":50000,"engagement_rate":4.5,"url":"https://insta.com/alice"}}', ARRAY['Fashion','Lifestyle'], 200.00, 'Available'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Bob Kumar',   'bobkumar',   'bob@test.com',   'hashed_pw', 'Tech reviewer on YouTube', 'https://pics.com/bob.jpg',   '{"city":"Bangalore","state":"Karnataka","country":"India"}', '{"youtube":{"handle":"BobTech","subscribers":100000,"avg_views":20000,"url":"https://youtube.com/bobtech"}}', ARRAY['Tech','Gadgets'], 300.00, 'Busy');

-- Insert one campaign by TestBrand inviting Alice
INSERT INTO campaign (id, title, description, business_id, campaign_type, deliverables, budget, payment_status, proposed_dates, status, platform_targets, categories, metrics)
VALUES
  ('33333333-3333-3333-3333-333333333333', 'Spring Fashion Launch', 'Invite Alice to promote Spring collection', '11111111-1111-1111-1111-111111111111', 'Sponsored Post', ARRAY['Instagram Post','Reel'], 1000, 'Pending', '[2025-06-01,2025-06-15)', 'Open', ARRAY['Instagram'], ARRAY['Fashion'], '{"impressions":0,"likes":0,"comments":0,"shares":0,"link_clicks":0,"reach":0}');

-- Link the campaign to Alice
INSERT INTO campaign_influencer (campaign_id, influencer_id)
VALUES 
  ('33333333-3333-3333-3333-333333333333', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');
