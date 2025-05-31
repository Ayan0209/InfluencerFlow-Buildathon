-- 002_rls_policies.sql
-- 1. Enable RLS
ALTER TABLE business ENABLE ROW LEVEL SECURITY;
ALTER TABLE influencer ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign ENABLE ROW LEVEL SECURITY;

-- 2. Business policies: a business sees its own row
CREATE POLICY "Business self access" ON business
  FOR ALL
  USING ( auth.uid()::uuid = id );

-- 3. Influencer policies: influencer sees own data
CREATE POLICY "Influencer self access" ON influencer
  FOR ALL
  USING ( auth.uid()::uuid = id );

-- 4. Campaign policies:
-- Only the business owner can INSERT/UPDATE/DELETE
CREATE POLICY "Campaign business owner" ON campaign
  FOR ALL
  USING ( auth.uid()::uuid = business_id );

-- 5. Campaign read by invited influencer
CREATE POLICY "Campaign invited influencer read" ON campaign
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM campaign_influencer
      WHERE campaign_influencer.campaign_id = campaign.id
        AND campaign_influencer.influencer_id = auth.uid()::uuid
    )
  );
