-- Migration 047: Add unique constraint on quote_responses.quote_id
-- Required for the upsert in /api/quotes/[id] (action: "respond") to work.
-- The original 003_phase3.sql created quote_responses without this constraint.
-- Safe to apply: existing data has no duplicate quote_ids (confirmed 2026-06-10).

ALTER TABLE quote_responses
  ADD CONSTRAINT quote_responses_quote_id_key UNIQUE (quote_id);
