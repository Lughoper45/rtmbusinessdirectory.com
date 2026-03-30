ALTER TABLE membership_plans ADD COLUMN IF NOT EXISTS stripe_price_id TEXT;

UPDATE membership_plans SET stripe_price_id = 'price_basic_year' WHERE name = 'Basic';
UPDATE membership_plans SET stripe_price_id = 'price_premium_year' WHERE name = 'Premium';
UPDATE membership_plans SET stripe_price_id = 'price_pro_year' WHERE name = 'Pro';
