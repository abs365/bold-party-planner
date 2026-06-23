-- Migration 058: financial_events -- add Connect event types
-- Drop and recreate constraint with all existing + new values.
-- This is the only way to modify a CHECK constraint in PostgreSQL.

ALTER TABLE financial_events
  DROP CONSTRAINT IF EXISTS financial_events_event_type_check;

ALTER TABLE financial_events
  ADD CONSTRAINT financial_events_event_type_check
  CHECK (event_type IN (
    -- existing (Phase 040)
    'PAYMENT_RECEIVED',
    'BOOKING_CONFIRMED',
    'REFUND_REQUESTED',
    'REFUND_COMPLETED',
    'PAYOUT_CREATED',
    'PAYOUT_SCHEDULED',
    'PAYOUT_COMPLETED',
    'PAYOUT_FAILED',
    'CHARGEBACK_RECEIVED',
    'CHARGEBACK_RESOLVED',
    'PAYMENT_FAILED',
    'WEBHOOK_RECEIVED',
    'WEBHOOK_REJECTED',
    'RECONCILIATION_RUN',
    'LEDGER_CREATED',
    'LEDGER_UPDATED',
    -- Phase 70B (Connect account lifecycle)
    'CONNECT_ACCOUNT_CREATED',
    'CONNECT_ACCOUNT_UPDATED',
    'CONNECT_ACCOUNT_ACTIVATED',
    'CONNECT_ACCOUNT_RESTRICTED',
    'CONNECT_ACCOUNT_DISABLED',
    'REQUIREMENT_UPDATED'
  ));
