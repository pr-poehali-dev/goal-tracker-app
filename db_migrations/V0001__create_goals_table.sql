CREATE TABLE IF NOT EXISTS t_p18332806_goal_tracker_app.goals (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  period VARCHAR(10) NOT NULL CHECK (period IN ('day', 'month', 'year')),
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_goals_period ON t_p18332806_goal_tracker_app.goals(period);
CREATE INDEX idx_goals_completed ON t_p18332806_goal_tracker_app.goals(completed);
