import type { PaymentStatus } from '@centralpay/types';

export interface StateTransitionResult {
  allowed: boolean;
  from: PaymentStatus;
  to: PaymentStatus;
  error?: string;
}

/**
 * Permitted transitions matrix for CentralPay MAX.
 */
const VALID_TRANSITIONS: Record<PaymentStatus, PaymentStatus[]> = {
  CREATED: ['WAITING_PAYMENT', 'PENDING', 'CANCELLED', 'EXPIRED'],
  WAITING_PAYMENT: ['SUBMITTED', 'SMS_DETECTED', 'MATCHING', 'VERIFYING', 'EXPIRED', 'CANCELLED', 'FAILED'],
  PENDING: ['SUBMITTED', 'SMS_DETECTED', 'MATCHING', 'VERIFYING', 'EXPIRED', 'CANCELLED', 'FAILED'],
  SUBMITTED: ['VERIFYING', 'VERIFICATION_PENDING', 'SMS_DETECTED', 'MATCHING', 'FAILED', 'EXPIRED'],
  SMS_DETECTED: ['MATCHING', 'VERIFYING', 'VERIFICATION_PENDING', 'FAILED'],
  MATCHING: ['VERIFYING', 'VERIFIED', 'REVIEW_REQUIRED', 'FAILED'],
  VERIFICATION_PENDING: ['VERIFYING', 'VERIFIED', 'REVIEW_REQUIRED', 'FAILED'],
  VERIFYING: ['PAID', 'VERIFIED', 'COMPLETED', 'REVIEW_REQUIRED', 'REJECTED', 'FAILED'],
  VERIFIED: ['PAID', 'COMPLETED', 'REVIEW_REQUIRED'],
  PAID: ['COMPLETED', 'REFUNDED'],
  COMPLETED: ['REFUNDED', 'REVERSED'],
  REVIEW_REQUIRED: ['COMPLETED', 'REJECTED', 'FAILED', 'VERIFIED'],
  REJECTED: ['WAITING_PAYMENT', 'FAILED'], // Can retry with proper TrxID
  EXPIRED: [], // Terminal state unless administrative force recovery
  CANCELLED: [], // Terminal state
  FAILED: ['WAITING_PAYMENT'], // Can retry
  REVERSED: [], // Terminal state
  REFUNDED: [], // Terminal state
};

export class PaymentStateMachine {
  /**
   * Validates whether moving from currentState to nextState is legally allowed.
   */
  public static canTransition(current: PaymentStatus, next: PaymentStatus): StateTransitionResult {
    if (current === next) {
      return { allowed: true, from: current, to: next };
    }

    const allowedNext = VALID_TRANSITIONS[current] || [];
    if (!allowedNext.includes(next)) {
      return {
        allowed: false,
        from: current,
        to: next,
        error: `Illegal state transition from ${current} to ${next}. Target status is not permitted.`,
      };
    }

    return { allowed: true, from: current, to: next };
  }

  /**
   * Enforces transition rules and throws error if disallowed.
   */
  public static assertValidTransition(current: PaymentStatus, next: PaymentStatus): void {
    const result = this.canTransition(current, next);
    if (!result.allowed) {
      throw new Error(result.error);
    }
  }

  /**
   * Determines if a payment is in a terminal final state where modifications are blocked.
   */
  public static isTerminal(status: PaymentStatus): boolean {
    return status === 'COMPLETED' || status === 'CANCELLED' || status === 'REVERSED' || status === 'REFUNDED';
  }

  /**
   * Determines if a payment is expired or can still receive buyer submissions.
   */
  public static isPayable(status: PaymentStatus, expiresAt: string | Date): boolean {
    if (status !== 'CREATED' && status !== 'WAITING_PAYMENT' && status !== 'PENDING' && status !== 'SUBMITTED') {
      return false;
    }
    const expiryTime = new Date(expiresAt).getTime();
    return Date.now() < expiryTime;
  }
}
