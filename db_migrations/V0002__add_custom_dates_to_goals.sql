ALTER TABLE t_p18332806_goal_tracker_app.goals 
ADD COLUMN start_date DATE,
ADD COLUMN end_date DATE,
ADD COLUMN period_type VARCHAR(20) DEFAULT 'preset' CHECK (period_type IN ('preset', 'custom'));

UPDATE t_p18332806_goal_tracker_app.goals SET period_type = 'preset' WHERE period_type IS NULL;

CREATE INDEX idx_goals_dates ON t_p18332806_goal_tracker_app.goals(start_date, end_date);
