-- ============================================
-- plans: 사용자별 학습 계획 (1:1 with auth.users)
-- ============================================

CREATE TABLE IF NOT EXISTS plans (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  target_date  DATE NOT NULL,
  daily_hours  NUMERIC(4,1) NOT NULL,
  is_onboarded BOOLEAN DEFAULT false,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- RLS
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own plans"
  ON plans FOR ALL USING (auth.uid() = user_id);
