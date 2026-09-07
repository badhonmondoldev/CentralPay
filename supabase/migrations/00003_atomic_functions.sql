-- CentralPay MAX Atomic PL/pgSQL Functions
-- Migration 00003_atomic_functions.sql

/**
 * Atomically completes a payment, updates status, creates an immutable ledger entry,
 * and enqueues a webhook event in a single database transaction.
 */
CREATE OR REPLACE FUNCTION public.complete_payment_atomically(
    p_payment_id UUID,
    p_matched_transaction_id UUID,
    p_risk_score INT,
    p_risk_level VARCHAR,
    p_auto_approved BOOLEAN,
    p_review_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_payment RECORD;
    v_app RECORD;
    v_new_status VARCHAR(50);
    v_ledger_id UUID;
    v_webhook_event_id UUID;
    v_webhook_delivery_id UUID;
    v_signature VARCHAR(255);
    v_payload JSONB;
BEGIN
    -- 1. Lock payment row to prevent race conditions
    SELECT * INTO v_payment 
    FROM public.payments 
    WHERE id = p_payment_id 
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Payment ID % not found', p_payment_id;
    END IF;

    -- Check if already completed or processed to enforce idempotency
    IF v_payment.status = 'COMPLETED' THEN
        RETURN jsonb_build_object('success', true, 'already_completed', true, 'payment_id', p_payment_id);
    END IF;

    -- Determine target status based on auto-approval & risk
    IF p_auto_approved AND p_risk_level != 'HIGH' THEN
        v_new_status := 'COMPLETED';
    ELSE
        v_new_status := 'REVIEW_REQUIRED';
    END IF;

    -- 2. Update payment status atomically
    UPDATE public.payments
    SET 
        status = v_new_status,
        risk_score = p_risk_score,
        risk_level = p_risk_level,
        matched_transaction_id = p_matched_transaction_id,
        auto_approved = p_auto_approved,
        review_reason = p_review_reason,
        completed_at = CASE WHEN v_new_status = 'COMPLETED' THEN NOW() ELSE NULL END,
        updated_at = NOW()
    WHERE id = p_payment_id;

    -- Also update corresponding payment_request status
    UPDATE public.payment_requests
    SET 
        status = v_new_status,
        updated_at = NOW()
    WHERE id = v_payment.payment_request_id;

    -- 3. If COMPLETED, generate immutable financial ledger entry & webhook event
    IF v_new_status = 'COMPLETED' THEN
        INSERT INTO public.ledger_entries (
            payment_id,
            app_id,
            amount,
            currency,
            type,
            balance_snapshot,
            description
        ) VALUES (
            p_payment_id,
            v_payment.app_id,
            v_payment.amount,
            v_payment.currency,
            'CREDIT',
            v_payment.amount,
            'Verified payment received via SMS confirmation'
        ) RETURNING id INTO v_ledger_id;

        -- Fetch Application Webhook Configuration
        SELECT * INTO v_app FROM public.apps WHERE id = v_payment.app_id;

        v_payload := jsonb_build_object(
            'event', 'payment.completed',
            'event_id', uuid_generate_v4(),
            'payment_id', p_payment_id,
            'order_id', v_payment.order_id,
            'customer_id', v_payment.customer_id,
            'amount', v_payment.amount,
            'currency', v_payment.currency,
            'reference', v_payment.reference,
            'status', 'COMPLETED',
            'timestamp', NOW()
        );

        -- Enqueue Webhook Event in Outbox Table
        INSERT INTO public.webhook_events (
            app_id,
            payment_id,
            event_type,
            payload
        ) VALUES (
            v_payment.app_id,
            p_payment_id,
            'payment.completed',
            v_payload
        ) RETURNING id INTO v_webhook_event_id;

        -- If app has a configured webhook URL, create a delivery job entry
        IF v_app.webhook_url IS NOT NULL AND LENGTH(v_app.webhook_url) > 0 THEN
            INSERT INTO public.webhook_deliveries (
                webhook_event_id,
                app_id,
                target_url,
                status,
                attempt_count,
                signature
            ) VALUES (
                v_webhook_event_id,
                v_payment.app_id,
                v_app.webhook_url,
                'PENDING',
                0,
                'pending_signature'
            );
        END IF;
    END IF;

    -- Return success payload
    RETURN jsonb_build_object(
        'success', true,
        'status', v_new_status,
        'payment_id', p_payment_id,
        'ledger_id', v_ledger_id,
        'webhook_event_id', v_webhook_event_id
    );
END;
$$;
