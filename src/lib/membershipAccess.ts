// RTM Membership Access Control — Single source of truth
// This file is identical in all three repos:
//   launchpad-canada-ai/src/lib/membershipAccess.ts
//   stellar-business-os/src/lib/membershipAccess.ts
//   rtm-community-network/src/lib/membershipAccess.ts
// When you update one copy, update all three.

export type MembershipStatus =
  | 'pending_verification'
  | 'profile_incomplete'
  | 'grant_intake_started'
  | 'payment_pending'
  | 'active'
  | 'expired'
  | 'suspended';

export type GatedFeature =
  | 'browse_grants'
  | 'view_grant_detail'
  | 'grant_matching'
  | 'save_shortlist'
  | 'start_intake'
  | 'ai_readiness'
  | 'upload_documents'
  | 'submit_intake'
  | 'ai_draft'
  | 'contact_advisor'
  | 'member_pricing'
  | 'deals';

const FREE_FEATURES: GatedFeature[] = [
  'browse_grants',
  'view_grant_detail',
];

const INTAKE_FEATURES: GatedFeature[] = [
  ...FREE_FEATURES,
  'grant_matching',
  'save_shortlist',
  'start_intake',
  'ai_readiness',
];

export function canAccess(status: MembershipStatus | string, feature: GatedFeature): boolean {
  if (status === 'suspended') return false;
  if (status === 'active') return true;
  if (status === 'grant_intake_started' || status === 'payment_pending')
    return INTAKE_FEATURES.includes(feature);
  if (status === 'profile_incomplete')
    return FREE_FEATURES.includes(feature);
  // pending_verification or unknown
  return false;
}

export function shouldShowPaymentPrompt(
  status: MembershipStatus | string,
  feature: GatedFeature,
): boolean {
  return (
    !canAccess(status, feature) &&
    status !== 'suspended' &&
    status !== 'pending_verification'
  );
}

/** Human-readable label for the membership status — used in UI banners. */
export function statusLabel(status: MembershipStatus | string): string {
  const labels: Record<string, string> = {
    pending_verification: 'Awaiting email verification',
    profile_incomplete: 'Free — complete your profile',
    grant_intake_started: 'Free — profile complete',
    payment_pending: 'Membership activation in progress',
    active: 'Active member',
    expired: 'Membership expired',
    suspended: 'Account suspended',
  };
  return labels[status] ?? 'Unknown';
}
