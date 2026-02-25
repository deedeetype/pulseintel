-- Migration 003: Automated Scan Schedules
-- Created: 2026-02-25
-- Purpose: Enable users to schedule automatic profile refreshes

-- Scan Schedules Table
CREATE TABLE IF NOT EXISTS scan_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  scan_id UUID NOT NULL REFERENCES scans(id) ON DELETE CASCADE,
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly')),
  day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday, 6=Saturday
  day_of_month INTEGER CHECK (day_of_month BETWEEN 1 AND 31),
  hour INTEGER NOT NULL CHECK (hour BETWEEN 0 AND 23),
  minute INTEGER DEFAULT 0 CHECK (minute BETWEEN 0 AND 59),
  timezone TEXT DEFAULT 'America/New_York',
  enabled BOOLEAN DEFAULT true,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(scan_id) -- One schedule per scan
);

-- Index for efficient scheduled scan queries
CREATE INDEX IF NOT EXISTS idx_scan_schedules_next_run ON scan_schedules(next_run_at) WHERE enabled = true;
CREATE INDEX IF NOT EXISTS idx_scan_schedules_user ON scan_schedules(user_id);

-- RLS Policies
ALTER TABLE scan_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own schedules"
  ON scan_schedules FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can create their own schedules"
  ON scan_schedules FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own schedules"
  ON scan_schedules FOR UPDATE
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own schedules"
  ON scan_schedules FOR DELETE
  USING (auth.uid()::text = user_id);

-- Function to calculate next run time
CREATE OR REPLACE FUNCTION calculate_next_run(
  p_frequency TEXT,
  p_day_of_week INTEGER,
  p_day_of_month INTEGER,
  p_hour INTEGER,
  p_minute INTEGER,
  p_timezone TEXT
) RETURNS TIMESTAMPTZ AS $$
DECLARE
  v_next TIMESTAMPTZ;
  v_now TIMESTAMPTZ;
BEGIN
  v_now := NOW() AT TIME ZONE p_timezone;
  
  IF p_frequency = 'daily' THEN
    v_next := (DATE(v_now) + TIME '00:00:00' + (p_hour || ' hours')::INTERVAL + (p_minute || ' minutes')::INTERVAL) AT TIME ZONE p_timezone;
    IF v_next <= v_now THEN
      v_next := v_next + INTERVAL '1 day';
    END IF;
    
  ELSIF p_frequency = 'weekly' THEN
    v_next := (DATE(v_now) + ((p_day_of_week - EXTRACT(DOW FROM v_now)::INTEGER + 7) % 7)::INTEGER + TIME '00:00:00' + (p_hour || ' hours')::INTERVAL + (p_minute || ' minutes')::INTERVAL) AT TIME ZONE p_timezone;
    IF v_next <= v_now THEN
      v_next := v_next + INTERVAL '7 days';
    END IF;
    
  ELSIF p_frequency = 'monthly' THEN
    v_next := (DATE_TRUNC('month', v_now) + (p_day_of_month - 1 || ' days')::INTERVAL + (p_hour || ' hours')::INTERVAL + (p_minute || ' minutes')::INTERVAL) AT TIME ZONE p_timezone;
    IF v_next <= v_now THEN
      v_next := (DATE_TRUNC('month', v_now) + INTERVAL '1 month' + (p_day_of_month - 1 || ' days')::INTERVAL + (p_hour || ' hours')::INTERVAL + (p_minute || ' minutes')::INTERVAL) AT TIME ZONE p_timezone;
    END IF;
  END IF;
  
  RETURN v_next;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-calculate next_run_at on insert/update
CREATE OR REPLACE FUNCTION update_next_run_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.enabled THEN
    NEW.next_run_at := calculate_next_run(
      NEW.frequency,
      NEW.day_of_week,
      NEW.day_of_month,
      NEW.hour,
      NEW.minute,
      NEW.timezone
    );
  ELSE
    NEW.next_run_at := NULL;
  END IF;
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_next_run_at
  BEFORE INSERT OR UPDATE ON scan_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_next_run_at();

-- Grant access to service role for scheduled function
GRANT ALL ON scan_schedules TO service_role;
