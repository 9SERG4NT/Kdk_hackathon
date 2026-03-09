-- Add assigned_worker column to road_issues
ALTER TABLE road_issues ADD COLUMN IF NOT EXISTS assigned_worker TEXT;

-- Update status values: migrate old "In Progress" to "Work In Progress"
UPDATE road_issues SET status = 'Work In Progress' WHERE status = 'In Progress';

-- Create activity_logs table
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  issue_id UUID NOT NULL REFERENCES road_issues(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  performed_by TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Allow public read/write for activity_logs (same pattern as road_issues)
CREATE POLICY "Allow public read activity_logs" ON activity_logs
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert activity_logs" ON activity_logs
  FOR INSERT WITH CHECK (true);
