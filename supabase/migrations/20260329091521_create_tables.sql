-- 사용자별 학습 계획
CREATE TABLE plans (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  target_date DATE NOT NULL,
  daily_hours NUMERIC(4,1) NOT NULL,
  is_onboarded BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- 과목
CREATE TABLE subjects (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id     UUID REFERENCES plans(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name        VARCHAR(100) NOT NULL,
  weight      INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- 일별 태스크
CREATE TABLE tasks (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id     UUID REFERENCES plans(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id  UUID REFERENCES subjects(id) ON DELETE CASCADE,
  date        DATE NOT NULL,
  duration    NUMERIC(4,1) NOT NULL,
  completed   BOOLEAN DEFAULT false,
  carry_over  BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- 인덱스
CREATE INDEX idx_tasks_user_date ON tasks(user_id, date);
CREATE INDEX idx_tasks_plan_id ON tasks(plan_id);
CREATE INDEX idx_subjects_plan_id ON subjects(plan_id);

-- RLS 활성화
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- 본인 데이터만 접근
CREATE POLICY "Users can manage own plans"
  ON plans FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own subjects"
  ON subjects FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own tasks"
  ON tasks FOR ALL USING (auth.uid() = user_id);
