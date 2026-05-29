-- Migration: membership_status enum rework
-- Supabase project: kajwpmyloxaqeciyndwf
-- Purpose: Replace binary pending_payment/active model with a graduated
--          free-tier funnel that removes the payment gate at signup.
-- Safety: All existing 'active' members are untouched. All 'pending_payment'
--         users are mapped to 'profile_incomplete' (free tier, not blocked).
-- Run on STAGING first, verify all three apps start, then run on PRODUCTION.

-- ─────────────────────────────────────────────────────────────────────────────
-- Step 1: Create new enum type alongside the existing one
-- ─────────────────────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE membership_status_v2 AS ENUM (
    'pending_verification',
    'profile_incomplete',
    'grant_intake_started',
    'payment_pending',
    'active',
    'expired',
    'suspended'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL; -- already exists, safe to continue
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Step 2: Migrate existing data in profiles table
-- Maps every existing status to the nearest equivalent in the new model.
-- 'pending_payment' → 'profile_incomplete'  (free tier, not blocked)
-- 'active'          → 'active'              (unchanged)
-- 'expired'         → 'expired'             (unchanged)
-- anything else     → 'profile_incomplete'  (safe default)
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE profiles
  ALTER COLUMN membership_status TYPE membership_status_v2
  USING CASE membership_status::text
    WHEN 'pending_payment' THEN 'profile_incomplete'::membership_status_v2
    WHEN 'active'          THEN 'active'::membership_status_v2
    WHEN 'expired'         THEN 'expired'::membership_status_v2
    WHEN 'suspended'       THEN 'suspended'::membership_status_v2
    ELSE 'profile_incomplete'::membership_status_v2
  END;

-- ─────────────────────────────────────────────────────────────────────────────
-- Step 3: Add profile completion score column
-- Tracks how far through the 6-question grant profile builder the user is.
-- 0 = not started, 50 = grant_intake_started threshold, 100 = fully complete.
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS profile_completion_pct INTEGER
  DEFAULT 0
  CHECK (profile_completion_pct BETWEEN 0 AND 100);

-- ─────────────────────────────────────────────────────────────────────────────
-- Step 4: Add intake_started_at timestamp
-- Records when the user first crossed the 50% threshold.
-- Used for the 48-hour re-engagement email trigger.
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS intake_started_at TIMESTAMPTZ;

-- ─────────────────────────────────────────────────────────────────────────────
-- Step 5: Backfill existing active members with 100% completion
-- These users already paid — they should not be shown the profile builder.
-- ─────────────────────────────────────────────────────────────────────────────
UPDATE profiles
  SET profile_completion_pct = 100
  WHERE membership_status = 'active';

-- ─────────────────────────────────────────────────────────────────────────────
-- Step 6: Update the handle_new_user trigger function
-- Ensures new accounts created via Supabase auth (Google OAuth, magic link, etc.)
-- start with profile_incomplete instead of pending_payment.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _display_name text;
  _referral_code text;
BEGIN
  _display_name := COALESCE(
    NULLIF(trim(new.raw_user_meta_data->>'display_name'), ''),
    NULLIF(trim(new.raw_user_meta_data->>'full_name'), ''),
    NULLIF(trim(new.raw_user_meta_data->>'name'), ''),
    split_part(new.email, '@', 1)
  );

  -- Generate a unique 8-character referral code
  LOOP
    _referral_code := upper(substring(md5(random()::text) from 1 for 8));
    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM profiles WHERE referral_code = _referral_code
    );
  END LOOP;

  INSERT INTO profiles (
    id,
    email,
    display_name,
    referral_code,
    membership_status,
    profile_completion_pct
  ) VALUES (
    new.id,
    new.email,
    _display_name,
    _referral_code,
    'profile_incomplete',   -- ← was 'pending_payment', now free tier
    0
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN new;
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Step 7: Drop the old enum type (only after column migration is complete)
-- ─────────────────────────────────────────────────────────────────────────────
DO $$ BEGIN
  -- Rename old type if it still exists with the original name
  -- (Postgres may have named it differently depending on how it was created)
  ALTER TYPE membership_status RENAME TO membership_status_old;
EXCEPTION
  WHEN undefined_object THEN NULL;
  WHEN duplicate_object THEN NULL;
END $$;

-- Rename new type to the canonical name used everywhere in the codebase
DO $$ BEGIN
  ALTER TYPE membership_status_v2 RENAME TO membership_status;
EXCEPTION
  WHEN undefined_object THEN NULL;
  WHEN duplicate_object THEN NULL;
END $$;

-- Drop the old type (safe — column already migrated)
DO $$ BEGIN
  DROP TYPE IF EXISTS membership_status_old;
EXCEPTION
  WHEN others THEN NULL;
END $$;
