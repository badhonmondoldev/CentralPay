import type { RiskLevel } from '@centralpay/types';

export interface RiskInputContext {
  isDuplicateTxId: boolean;
  isDuplicateSms: boolean;
  isExpiredPayment: boolean;
  isAmountMismatch: boolean;
  isMissingReference: boolean;
  isDeviceRevokedOrOffline: boolean;
  isSafeModeEnabled: boolean;
  repeatAttemptCount: number;
}

export interface RiskEvaluationResult {
  riskScore: number; // 0 (Zero Risk) to 100 (Max Fraud Risk)
  riskLevel: RiskLevel;
  requiresManualReview: boolean;
  flags: string[];
}

export function evaluateRisk(context: RiskInputContext): RiskEvaluationResult {
  let riskScore = 0;
  const flags: string[] = [];

  // Critical Flags (+50 to +100 risk)
  if (context.isDuplicateTxId) {
    riskScore += 100;
    flags.push('CRITICAL: Duplicate Transaction ID detected');
  }

  if (context.isDuplicateSms) {
    riskScore += 100;
    flags.push('CRITICAL: Duplicate SMS Fingerprint detected');
  }

  if (context.isDeviceRevokedOrOffline) {
    riskScore += 80;
    flags.push('HIGH: Event received from revoked or unverified device');
  }

  if (context.isExpiredPayment) {
    riskScore += 60;
    flags.push('HIGH: Transaction matches expired payment request');
  }

  // Moderate Flags (+20 to +40 risk)
  if (context.isAmountMismatch) {
    riskScore += 40;
    flags.push('MEDIUM: Amount mismatch between detected SMS and request');
  }

  if (context.repeatAttemptCount > 3) {
    riskScore += 30;
    flags.push(`MEDIUM: Abnormal repeated attempts (${context.repeatAttemptCount})`);
  }

  if (context.isMissingReference) {
    riskScore += 15;
    flags.push('LOW: Missing explicit payment reference in SMS body');
  }

  // Emergency SAFE MODE Override
  if (context.isSafeModeEnabled) {
    flags.push('SYSTEM: Emergency Safe Mode Enabled - Forcing Manual Review');
  }

  // Cap risk score at 100
  riskScore = Math.min(riskScore, 100);

  let riskLevel: RiskLevel = 'LOW';
  if (riskScore >= 60) {
    riskLevel = 'HIGH';
  } else if (riskScore >= 25) {
    riskLevel = 'MEDIUM';
  }

  // Require manual review if High/Medium risk or Safe Mode is active
  const requiresManualReview = riskLevel !== 'LOW' || context.isSafeModeEnabled;

  return {
    riskScore,
    riskLevel,
    requiresManualReview,
    flags,
  };
}
