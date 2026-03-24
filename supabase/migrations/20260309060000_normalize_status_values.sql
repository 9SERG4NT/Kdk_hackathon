-- Normalize road_issues.status text values to lowercase snake_case
-- so they match the DbIssueStatus type used in the application.

UPDATE road_issues SET status = 'reported'   WHERE status IN ('Reported', 'New');
UPDATE road_issues SET status = 'in_review'  WHERE status IN ('Submitted to NMC', 'In Progress', 'Work In Progress', 'In Review');
UPDATE road_issues SET status = 'resolved'   WHERE status = 'Resolved';
UPDATE road_issues SET status = 'rejected'   WHERE status = 'Rejected';

-- Update the column default to match the new canonical value
ALTER TABLE road_issues ALTER COLUMN status SET DEFAULT 'reported';
