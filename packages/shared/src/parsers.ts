export interface ParserRule {
  field: 'amount' | 'transaction_id' | 'reference' | 'sender' | 'date';
  regex: RegExp | string; // Regular expression pattern or string
  groupIndex?: number;
  transform?: (value: string) => string;
}

export interface ParserProfile {
  id: string;
  provider: 'bKash' | 'Nagad' | 'Rocket' | 'Custom';
  name: string;
  senderWhitelist: string[]; // Allowed SMS sender names/numbers (e.g., "bKash", "16216", "NAGAD")
  rules: ParserRule[];
  minConfidenceThreshold: number;
}

export interface ParseResult {
  success: boolean;
  provider: 'bKash' | 'Nagad' | 'Rocket' | 'Custom';
  amount?: number;
  currency: string;
  transactionId?: string;
  referenceCode?: string;
  senderNumber?: string;
  extractedTimestamp?: string;
  confidenceScore: number; // 0 to 100
  errors: string[];
}

/**
 * Default Parser Profiles for Bangladeshi Mobile Financial Services (MFS)
 */
export const DEFAULT_PARSER_PROFILES: ParserProfile[] = [
  {
    id: 'bkash-personal-v1',
    provider: 'bKash',
    name: 'bKash Personal Cash In / Send Money Parser',
    senderWhitelist: ['bkash', 'bKash', '16247'],
    rules: [
      {
        field: 'amount',
        regex: /(?:Tk|BDT|received|amount)\s*([\d,]+(?:\.\d{1,2})?)/i,
        groupIndex: 1,
        transform: (val) => val.replace(/,/g, ''),
      },
      {
        field: 'transaction_id',
        regex: /(?:TrxID|TxnID|TxID|Trx ID)\s*([A-Z0-9]{8,12})/i,
        groupIndex: 1,
      },
      {
        field: 'reference',
        regex: /(?:Ref|Reference|Note)\s*([A-Za-z0-9]+)/i,
        groupIndex: 1,
      },
      {
        field: 'sender',
        regex: /(?:from|by)\s*(01\d{9})/i,
        groupIndex: 1,
      },
    ],
    minConfidenceThreshold: 70,
  },
  {
    id: 'nagad-personal-v1',
    provider: 'Nagad',
    name: 'Nagad Personal Payment / Transfer Parser',
    senderWhitelist: ['nagad', 'Nagad', '16167'],
    rules: [
      {
        field: 'amount',
        regex: /(?:Amount|Tk|BDT)\.?\s*([\d,]+(?:\.\d{1,2})?)/i,
        groupIndex: 1,
        transform: (val) => val.replace(/,/g, ''),
      },
      {
        field: 'transaction_id',
        regex: /(?:TxnID|TrxID|TxID)\s*:?\s*([A-Z0-9]{8,12})/i,
        groupIndex: 1,
      },
      {
        field: 'reference',
        regex: /(?:Ref|Reference)\s*:?\s*([A-Za-z0-9]+)/i,
        groupIndex: 1,
      },
      {
        field: 'sender',
        regex: /(?:From|Sender)\s*:?\s*(01\d{9})/i,
        groupIndex: 1,
      },
    ],
    minConfidenceThreshold: 70,
  },
  {
    id: 'rocket-personal-v1',
    provider: 'Rocket',
    name: 'DBBL Rocket Transfer Parser',
    senderWhitelist: ['16216', 'Rocket', 'DBBL'],
    rules: [
      {
        field: 'amount',
        regex: /(?:Tk|BDT)\s*([\d,]+(?:\.\d{1,2})?)/i,
        groupIndex: 1,
        transform: (val) => val.replace(/,/g, ''),
      },
      {
        field: 'transaction_id',
        regex: /(?:TxnId|TxId|TrxId)\s*:\s*(\d{8,12})/i,
        groupIndex: 1,
      },
      {
        field: 'reference',
        regex: /(?:Ref)\s*:\s*([A-Za-z0-9]+)/i,
        groupIndex: 1,
      },
    ],
    minConfidenceThreshold: 70,
  },
];

/**
 * Extensible SMS Parser Engine
 */
export class SmsParserEngine {
  private profiles: ParserProfile[];

  constructor(customProfiles?: ParserProfile[]) {
    this.profiles = customProfiles && customProfiles.length > 0 ? customProfiles : DEFAULT_PARSER_PROFILES;
  }

  /**
   * Attempts to parse an incoming SMS body using available profiles.
   */
  public parse(sender: string, body: string, preferredProvider?: string): ParseResult {
    const normalizedSender = sender.trim().toLowerCase();

    let candidates = this.profiles.filter((p) =>
      p.senderWhitelist.some((s) => normalizedSender.includes(s.toLowerCase()))
    );

    if (candidates.length === 0 && preferredProvider) {
      candidates = this.profiles.filter((p) => p.provider.toLowerCase() === preferredProvider.toLowerCase());
    }

    if (candidates.length === 0) {
      candidates = this.profiles;
    }

    let bestResult: ParseResult | null = null;
    let maxScore = -1;

    for (const profile of candidates) {
      const result = this.parseWithProfile(body, profile);
      if (result.confidenceScore > maxScore) {
        maxScore = result.confidenceScore;
        bestResult = result;
      }
    }

    if (!bestResult || maxScore < 40) {
      return {
        success: false,
        provider: 'Custom',
        currency: 'BDT',
        confidenceScore: 0,
        errors: ['Unable to extract transaction details with sufficient confidence from SMS.'],
      };
    }

    return bestResult;
  }

  private parseWithProfile(body: string, profile: ParserProfile): ParseResult {
    const errors: string[] = [];
    let amount: number | undefined;
    let transactionId: string | undefined;
    let referenceCode: string | undefined;
    let senderNumber: string | undefined;
    let score = 0;

    for (const rule of profile.rules) {
      const regexObj = typeof rule.regex === 'string' ? new RegExp(rule.regex, 'i') : rule.regex;
      const match = regexObj.exec(body);
      if (match) {
        const rawVal = rule.groupIndex ? match[rule.groupIndex] : match[0];
        const val = rule.transform ? rule.transform(rawVal) : rawVal;

        if (rule.field === 'amount') {
          const parsedAmount = parseFloat(val);
          if (!isNaN(parsedAmount) && parsedAmount > 0) {
            amount = parsedAmount;
            score += 40;
          }
        } else if (rule.field === 'transaction_id') {
          if (val && val.length >= 6) {
            transactionId = val.trim();
            score += 40;
          }
        } else if (rule.field === 'reference') {
          if (val) {
            referenceCode = val.trim();
            score += 10;
          }
        } else if (rule.field === 'sender') {
          if (val) {
            senderNumber = val.trim();
            score += 10;
          }
        }
      }
    }

    const success = amount !== undefined && transactionId !== undefined && score >= profile.minConfidenceThreshold;

    if (!amount) errors.push('Amount extraction failed');
    if (!transactionId) errors.push('Transaction ID extraction failed');

    return {
      success,
      provider: profile.provider,
      amount,
      currency: 'BDT',
      transactionId,
      referenceCode,
      senderNumber,
      confidenceScore: Math.min(score, 100),
      errors,
    };
  }
}
