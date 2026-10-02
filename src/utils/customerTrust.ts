import { SavedCustomerProfile, TrustDecision } from '../types';

// Directory-based trust tiering. Phone number is the ID.
// repeat_verified: 2+ successes, no recent fail -> COD allowed
// low_history: 0-1 success -> small advance required
// new_unknown: no record -> prepaid full (late-night rule)

export function decideTrust(
  profile: SavedCustomerProfile | null | undefined,
  grandTotal: number
): TrustDecision {
  if (!profile) {
    return {
      tier: 'new_unknown',
      allowCOD: false,
      requireAdvance: Math.min(grandTotal, 150),
      requirePrepaidFull: grandTotal > 500,
      maxCODAmount: 0,
      reason: 'New number: OTP verified but no history. Prepaid / advance only.',
    };
  }
  if (profile.blacklisted || (profile.failCount ?? 0) >= 2) {
    return {
      tier: 'new_unknown',
      allowCOD: false,
      requireAdvance: grandTotal,
      requirePrepaidFull: true,
      maxCODAmount: 0,
      reason: 'Blocked history: prepaid full + manual staff accept.',
    };
  }
  const successes = profile.successCount ?? profile.totalOrders ?? 0;
  if (successes >= 2 && (profile.failCount ?? 0) === 0) {
    return {
      tier: 'repeat_verified',
      allowCOD: grandTotal <= 1500,
      requireAdvance: 0,
      requirePrepaidFull: false,
      maxCODAmount: 1500,
      reason: 'Repeat verified: COD allowed, direct KOT.',
    };
  }
  return {
    tier: 'low_history',
    allowCOD: grandTotal <= 500,
    requireAdvance: Math.min(100, grandTotal),
    requirePrepaidFull: false,
    maxCODAmount: 500,
    reason: 'Low history: Rs 50-100 advance, rest COD. Auto-cancel in 10 min if unpaid.',
  };
}

export function normalizePhone(phone: string): string {
  return phone.replace(/\s+/g, '');
}
