import type { PaymentRequest, ParsedTransaction, PaymentSource } from '@centralpay/types';
import type { ParseResult } from './parsers.js';

export interface MatchScoreDetails {
  totalScore: number;
  amountMatched: boolean;
  txIdMatched: boolean;
  referenceMatched: boolean;
  sourceMatched: boolean;
  timeWindowMatched: boolean;
  metadataMatched: boolean;
  scoreBreakdown: {
    amountScore: number;
    txIdScore: number;
    referenceScore: number;
    sourceScore: number;
    timeScore: number;
    metadataScore: number;
  };
  recommendation: 'AUTO_APPROVE' | 'REVIEW' | 'HOLD' | 'REJECT';
}

export function evaluateMatchScore(
  request: PaymentRequest,
  transaction: ParsedTransaction | ParseResult,
  source?: PaymentSource
): MatchScoreDetails {
  let amountScore = 0;
  let txIdScore = 0;
  let referenceScore = 0;
  let sourceScore = 0;
  let timeScore = 0;
  let metadataScore = 0;

  // Normalize property access between database ParsedTransaction and ParseResult
  const txAmount = 'amount' in transaction && transaction.amount !== undefined ? transaction.amount : 0;
  const txId = 'transaction_id' in transaction ? transaction.transaction_id : ('transactionId' in transaction ? transaction.transactionId : undefined);
  const refCode = 'reference_code' in transaction ? transaction.reference_code : ('referenceCode' in transaction ? transaction.referenceCode : undefined);
  const confidenceScore = 'confidence_score' in transaction ? transaction.confidence_score : ('confidenceScore' in transaction ? transaction.confidenceScore : 0);
  const timestampStr = 'timestamp' in transaction && transaction.timestamp ? transaction.timestamp : new Date().toISOString();

  // 1. Amount Match (Weight: 30)
  const amountMatched = Math.abs(request.amount - txAmount) < 0.01;
  if (amountMatched) {
    amountScore = 30;
  }

  // 2. Transaction ID Valid (Weight: 25)
  const txIdMatched = Boolean(txId && txId.length >= 6);
  if (txIdMatched) {
    txIdScore = 25;
  }

  // 3. Reference Match (Weight: 25)
  let referenceMatched = false;
  if (
    refCode &&
    request.reference &&
    refCode.trim().toLowerCase().includes(request.reference.trim().toLowerCase())
  ) {
    referenceMatched = true;
    referenceScore = 25;
  }

  // 4. Trusted Payment Source Match (Weight: 10)
  let sourceMatched = false;
  if (source && source.is_active) {
    sourceMatched = true;
    sourceScore = 10;
  }

  // 5. Time Window Match (Weight: 5)
  let timeWindowMatched = false;
  const requestCreated = new Date(request.created_at).getTime();
  const requestExpires = new Date(request.expires_at).getTime();
  const txTime = new Date(timestampStr).getTime();

  if (txTime >= requestCreated - 5 * 60 * 1000 && txTime <= requestExpires + 15 * 60 * 1000) {
    timeWindowMatched = true;
    timeScore = 5;
  }

  // 6. Metadata / Confidence Match (Weight: 5)
  let metadataMatched = false;
  if (confidenceScore >= 80) {
    metadataMatched = true;
    metadataScore = 5;
  }

  const totalScore = amountScore + txIdScore + referenceScore + sourceScore + timeScore + metadataScore;

  let recommendation: 'AUTO_APPROVE' | 'REVIEW' | 'HOLD' | 'REJECT' = 'REJECT';
  if (totalScore >= 90) {
    recommendation = 'AUTO_APPROVE';
  } else if (totalScore >= 80) {
    recommendation = 'REVIEW';
  } else if (totalScore >= 60) {
    recommendation = 'HOLD';
  }

  return {
    totalScore,
    amountMatched,
    txIdMatched,
    referenceMatched,
    sourceMatched,
    timeWindowMatched,
    metadataMatched,
    scoreBreakdown: {
      amountScore,
      txIdScore,
      referenceScore,
      sourceScore,
      timeScore,
      metadataScore,
    },
    recommendation,
  };
}
