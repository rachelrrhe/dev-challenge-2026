-- I'm creating a new schema

-- Migration 002: changed restaurant features
-- added dish photo + updated_at for restaurants so photos of restaurant dish can be included.
-- added updated_at to seperate from created_at, to differentiate first visit and latest visit.
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS dish_photo TEXT;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
