-- Migration 036: Fix ambiguous "item" column reference in checklist trigger
-- Root cause: PL/pgSQL variable named "item" conflicts with column named "item"
-- in checklist_progress, causing "column reference item is ambiguous" on event creation.
-- Fix: rename the loop variable to "v_item".

CREATE OR REPLACE FUNCTION seed_checklist_from_plan()
RETURNS TRIGGER AS $$
DECLARE
  cat    JSONB;
  v_item TEXT;
BEGIN
  IF NEW.ai_plan IS NOT NULL AND NEW.ai_plan->'checklist' IS NOT NULL THEN
    FOR cat IN SELECT * FROM jsonb_array_elements(NEW.ai_plan->'checklist') LOOP
      FOR v_item IN SELECT * FROM jsonb_array_elements_text(cat->'items') LOOP
        INSERT INTO checklist_progress (event_id, category, item, completed)
        VALUES (NEW.id, cat->>'category', v_item, FALSE)
        ON CONFLICT (event_id, category, item) DO NOTHING;
      END LOOP;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
