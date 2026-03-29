-- plans에 status 컬럼 추가
-- draft: 온보딩 진행 중 / pending: 관리자 검토 대기 / assigned: 계획 전달됨
ALTER TABLE plans ADD COLUMN status TEXT DEFAULT 'draft'
  CHECK (status IN ('draft', 'pending', 'assigned'));

-- 관리자 메모
ALTER TABLE plans ADD COLUMN admin_note TEXT;

-- 사용자 이메일 빠르게 조회를 위해 (auth.users에서 가져오기 어려우므로)
ALTER TABLE plans ADD COLUMN user_email TEXT;
