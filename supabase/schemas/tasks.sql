-- ============================================
-- tasks: 일별 학습 태스크 (N:1 with plans, subjects)
-- ============================================

CREATE TABLE IF NOT EXISTS tasks (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id    UUID REFERENCES plans(id) ON DELETE CASCADE,
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  date       DATE NOT NULL,
  duration   NUMERIC(4,1) NOT NULL,   -- 시간 단위
  completed  BOOLEAN DEFAULT false,
  carry_over BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tasks_user_date ON tasks(user_id, date);
CREATE INDEX IF NOT EXISTS idx_tasks_plan_id ON tasks(plan_id);

-- RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own tasks"
  ON tasks FOR ALL USING (auth.uid() = user_id);
