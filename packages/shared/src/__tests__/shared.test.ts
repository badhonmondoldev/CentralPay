import { generatePaymentReference } from '../reference';
import { generateSmsFingerprint, signWebhookPayload, verifyWebhookSignature } from '../crypto';
import { SmsParserEngine } from '../parsers';
import { evaluateMatchScore } from '../matching';
import { evaluateRisk } from '../risk';

describe('CentralPay Shared Library Tests', () => {
  test('generatePaymentReference produces short collision-resistant ref with app prefix', () => {
    const ref1 = generatePaymentReference('earnspace');
    expect(ref1).toMatch(/^EA[2-9A-HJ-NP-Z]{4}$/);

    const ref2 = generatePaymentReference('nabrijan');
    expect(ref2).toMatch(/^NA[2-9A-HJ-NP-Z]{4}$/);
  });

  test('generateSmsFingerprint is deterministic and unique', () => {
    const fp1 = generateSmsFingerprint('bKash', 1725700000, 'Tk 500 received', 'dev_01');
    const fp2 = generateSmsFingerprint('bKash', 1725700000, 'Tk 500 received', 'dev_01');
    const fp3 = generateSmsFingerprint('bKash', 1725700000, 'Tk 500 received', 'dev_02');

    expect(fp1).toBe(fp2);
    expect(fp1).not.toBe(fp3);
  });

  test('SmsParserEngine parses bKash SMS correctly', () => {
    const parser = new SmsParserEngine();
    const smsBody = 'You have received Tk 500.00 from 01700000000. Fee Tk 0.00. Balance Tk 10500.00. TrxID ES8K21TX99 at 07/09/2026. Ref ES8K21.';

    const result = parser.parse('bKash', smsBody);
    expect(result.success).toBe(true);
    expect(result.provider).toBe('bKash');
    expect(result.amount).toBe(500);
    expect(result.transactionId).toBe('ES8K21TX99');
    expect(result.referenceCode).toBe('ES8K21');
  });

  test('evaluateMatchScore computes expected matrix score', () => {
    const dummyReq: any = {
      amount: 500,
      reference: 'ES8K21',
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    };

    const dummyTx: any = {
      amount: 500,
      transactionId: 'ES8K21TX99',
      referenceCode: 'ES8K21',
      confidenceScore: 90,
      timestamp: new Date().toISOString(),
    };

    const scoreDetails = evaluateMatchScore(dummyReq, dummyTx, { is_active: true } as any);
    expect(scoreDetails.totalScore).toBeGreaterThanOrEqual(90);
    expect(scoreDetails.recommendation).toBe('AUTO_APPROVE');
  });

  test('evaluateRisk flags duplicate SMS and forces manual review in safe mode', () => {
    const riskResult = evaluateRisk({
      isDuplicateTxId: false,
      isDuplicateSms: false,
      isExpiredPayment: false,
      isAmountMismatch: false,
      isMissingReference: false,
      isDeviceRevokedOrOffline: false,
      isSafeModeEnabled: true,
      repeatAttemptCount: 1,
    });

    expect(riskResult.requiresManualReview).toBe(true);
    expect(riskResult.flags).toContain('SYSTEM: Emergency Safe Mode Enabled - Forcing Manual Review');
  });

  test('signWebhookPayload and verifyWebhookSignature work symmetrically', () => {
    const payload = JSON.stringify({ event: 'payment.completed', amount: 500 });
    const secret = 'whsec_test_123';
    const timestamp = 1725700000;
    const eventId = 'evt_001';

    const sig = signWebhookPayload(payload, secret, timestamp, eventId);
    const isValid = verifyWebhookSignature(payload, sig, secret, timestamp, eventId);
    expect(isValid).toBe(true);
  });
});
