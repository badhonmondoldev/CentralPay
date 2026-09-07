import type { PaymentRequestCreateInput, PaymentRequest } from '@centralpay/types';

export interface CentralPayConfig {
  apiKey: string;
  baseUrl?: string;
}

export interface CreatePaymentResponse {
  paymentId: string;
  paymentUrl: string;
  reference: string;
  status: string;
  expiresAt: string;
}

export class CentralPaySDK {
  private apiKey: string;
  private baseUrl: string;

  constructor(config: CentralPayConfig) {
    if (!config.apiKey) {
      throw new Error('CentralPay SDK requires an API key.');
    }
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'http://localhost:3000';
  }

  public payments = {
    create: async (params: PaymentRequestCreateInput, idempotencyKey?: string): Promise<CreatePaymentResponse> => {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      };

      if (idempotencyKey) {
        headers['Idempotency-Key'] = idempotencyKey;
      }

      const response = await fetch(`${this.baseUrl}/api/v1/payments/create`, {
        method: 'POST',
        headers,
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`CentralPay API Error (${response.status}): ${errorText}`);
      }

      const data = (await response.json()) as {
        success: boolean;
        payment: PaymentRequest;
        paymentUrl: string;
      };

      return {
        paymentId: data.payment.id,
        paymentUrl: data.paymentUrl,
        reference: data.payment.reference,
        status: data.payment.status,
        expiresAt: data.payment.expires_at,
      };
    },

    get: async (paymentId: string): Promise<PaymentRequest> => {
      const response = await fetch(`${this.baseUrl}/api/v1/payments/${paymentId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`CentralPay API Error (${response.status})`);
      }

      const data = (await response.json()) as { payment: PaymentRequest };
      return data.payment;
    },
  };
}

export default CentralPaySDK;
