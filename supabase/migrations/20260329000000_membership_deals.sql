-- Membership Plans
CREATE TABLE membership_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  interval TEXT NOT NULL DEFAULT 'year',
  features JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  stripe_price_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Memberships
CREATE TABLE user_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES membership_plans(id),
  status TEXT DEFAULT 'active',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Business Deals/Discounts
CREATE TABLE business_deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  discount_percent INTEGER NOT NULL CHECK (discount_percent >= 5 AND discount_percent <= 50),
  code TEXT,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Affiliate Accounts
CREATE TABLE affiliates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code TEXT UNIQUE NOT NULL,
  commission_rate DECIMAL(5,2) DEFAULT 30.00,
  total_earnings DECIMAL(10,2) DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Affiliate Referrals
CREATE TABLE affiliate_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID REFERENCES affiliates(id),
  referred_user_id UUID REFERENCES auth.users(id),
  referred_business_id UUID REFERENCES businesses(id),
  membership_tier TEXT,
  commission_amount DECIMAL(10,2),
  commission_paid BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE membership_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_referrals ENABLE ROW LEVEL SECURITY;

-- Policies for membership_plans
CREATE POLICY "Anyone can view active plans" ON membership_plans FOR SELECT USING (is_active = true);

-- Policies for user_memberships
CREATE POLICY "Users can view own membership" ON user_memberships FOR SELECT USING (auth.uid() = user_id);

-- Policies for business_deals
CREATE POLICY "Anyone can view active deals" ON business_deals FOR SELECT USING (is_active = true);
CREATE POLICY "Authenticated users can manage deals" ON business_deals FOR ALL USING (auth.uid() IS NOT NULL);

-- Policies for affiliates
CREATE POLICY "Users can view own affiliate" ON affiliates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Anyone can view by referral code" ON affiliates FOR SELECT USING (true);

-- Policies for affiliate_referrals
CREATE POLICY "Affiliates can view own referrals" ON affiliate_referrals FOR SELECT USING (
  EXISTS (SELECT 1 FROM affiliates WHERE id = affiliate_referrals.affiliate_id AND user_id = auth.uid())
);

-- Indexes
CREATE INDEX idx_user_memberships_user ON user_memberships(user_id);
CREATE INDEX idx_user_memberships_status ON user_memberships(status);
CREATE INDEX idx_business_deals_business ON business_deals(business_id);
CREATE INDEX idx_business_deals_active ON business_deals(is_active);
CREATE INDEX idx_affiliates_referral_code ON affiliates(referral_code);
CREATE INDEX idx_affiliate_referrals_affiliate ON affiliate_referrals(affiliate_id);

-- Insert default membership plans
INSERT INTO membership_plans (name, description, price, features) VALUES
('Basic', 'Access to all business deals and discounts', 99.99, '["Access to exclusive deals", "5-50% discounts at participating businesses", "Priority customer support"]'),
('Premium', 'Basic + early access to new deals', 149.99, '["All Basic features", "Early access to new deals", "Featured deals", "Deal notifications"]'),
('Pro', 'Premium + affiliate earnings', 199.99, '["All Premium features", "30% affiliate commission", "Unlimited referrals", "Business listing included"]');
