# Backend Architecture
---

> NestJS 별도 서버 없음. **Next.js Route Handlers**로 API 처리, **Supabase**로 DB/인증 처리.

## 1. 기술 스택

| 구분 | 선택 | 이유 |
|------|------|------|
| API | Next.js Route Handlers | 별도 서버 불필요, Vercel 배포 통합 |
| 데이터베이스 | Supabase (PostgreSQL) | 호스팅 DB, RLS, 인증 내장 |
| DB 접근 | Supabase JS Client (`@supabase/ssr`) | 서버/클라이언트 통합 SDK |
| 인증 | Supabase Auth (Google OAuth) | 프론트에서 직접 처리, 서버는 세션 검증만 |
| 배포 | Vercel | Next.js 네이티브, API + FE 단일 배포 |

---

## 2. Supabase 데이터베이스 스키마

### 2.1 테이블 구조

```sql
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
  weight      INTEGER DEFAULT 0,  -- 비중 (%)
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- 일별 태스크 (스케줄 생성 시 bulk insert)
CREATE TABLE tasks (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id     UUID REFERENCES plans(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id  UUID REFERENCES subjects(id) ON DELETE CASCADE,
  date        DATE NOT NULL,
  duration    NUMERIC(4,1) NOT NULL,  -- 시간 단위
  completed   BOOLEAN DEFAULT false,
  carry_over  BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- 인덱스
CREATE INDEX idx_tasks_user_date ON tasks(user_id, date);
CREATE INDEX idx_tasks_plan_id ON tasks(plan_id);
CREATE INDEX idx_subjects_plan_id ON subjects(plan_id);
```

### 2.2 Row Level Security (RLS)

```sql
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own plans"
  ON plans FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own subjects"
  ON subjects FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own tasks"
  ON tasks FOR ALL USING (auth.uid() = user_id);
```

### 2.3 ERD

```
auth.users (Supabase 내장)
    │
    │ 1:1
    ▼
┌──────────┐
│  plans   │
│──────────│
│  id (PK) │
│  user_id │──→ auth.users
│  target_date    │
│  daily_hours    │
│  is_onboarded   │
└────┬─────┘
     │ 1:N
     ▼
┌──────────┐
│ subjects │
│──────────│
│  id (PK) │
│  plan_id │──→ plans
│  name           │
│  weight         │
└────┬─────┘
     │ 1:N
     ▼
┌──────────┐
│  tasks   │
│──────────│
│  id (PK) │
│  plan_id │──→ plans
│  subject_id │──→ subjects
│  date           │
│  duration       │
│  completed      │
│  carry_over     │
└──────────┘
```

---

## 3. API 엔드포인트 (Route Handlers)

모든 Route Handler에서 `supabase.auth.getUser()`로 인증 검증.

### 3.1 과목 (`/api/subjects`)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| `GET` | `/api/subjects` | 내 과목 목록 조회 |
| `POST` | `/api/subjects` | 과목 추가 |
| `PATCH` | `/api/subjects/[id]` | 과목 수정 (이름, 비중) |
| `DELETE` | `/api/subjects/[id]` | 과목 삭제 |

### 3.2 학습 계획 (`/api/plans`)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| `GET` | `/api/plans` | 내 플랜 조회 |
| `POST` | `/api/plans` | 플랜 생성 (온보딩 시) |
| `PATCH` | `/api/plans` | 플랜 수정 (목표일, 가용시간) |
| `POST` | `/api/plans/generate` | 스케줄 자동 생성 |
| `PUT` | `/api/plans/recalculate` | 설정 변경 후 스케줄 재계산 |
| `DELETE` | `/api/plans/reset` | 전체 데이터 초기화 |

### 3.3 태스크 (`/api/tasks`)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| `GET` | `/api/tasks/today` | 오늘 태스크 + 이월 항목 |
| `GET` | `/api/tasks?month=2026-04` | 월별 태스크 (캘린더용) |
| `GET` | `/api/tasks?date=2026-04-15` | 특정 날짜 태스크 |
| `PATCH` | `/api/tasks/[id]/toggle` | 완료 상태 토글 |

### 3.4 통계 (`/api/stats`)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| `GET` | `/api/stats/progress` | 전체 진행률 + 과목별 달성률 |
| `GET` | `/api/stats/weekly` | 주간 달성률 |

---

## 4. 인증 구조 (Supabase Auth Only)

서버에 Auth 모듈 없음. Next.js 미들웨어 + Route Handler에서 세션 검증만 수행.

```
[프론트엔드]                                [서버]
Supabase Auth SDK                           Next.js
─────────────────                           ──────
signInWithOAuth({ provider: 'google' })
    │
    ▼
Google OAuth → /auth/callback (route.ts)
    │ code ↔ session 교환
    ▼
쿠키에 세션 저장 (Supabase SSR)

API 요청 시:
middleware.ts → 쿠키에서 세션 확인
    │
    ├── 유효 → Route Handler 실행
    │          └── supabase.auth.getUser() → user_id 추출
    │
    └── 무효 → /login 리다이렉트
```

---

## 5. 핵심 로직

### 5.1 스케줄 생성 (`/api/plans/generate`)

```
POST /api/plans/generate 호출 시:

1. 해당 유저의 subjects, plan(targetDate, dailyHours) 조회
2. 오늘 ~ targetDate 사이 모든 날짜 생성
3. 각 날짜마다:
   - 과목별 weight에 따라 dailyHours 분배
   - 예: 6시간, 수학 50% → 3h / 영어 30% → 1.8h / 코딩 20% → 1.2h
4. tasks 테이블에 bulk insert
5. plan.is_onboarded = true 업데이트
```

### 5.2 미완료 이월 (`/api/tasks/today`)

```
GET /api/tasks/today 호출 시:

1. 오늘 날짜의 태스크 조회
2. 오늘 이전 날짜 중 completed=false인 태스크 조회
3. 이월 태스크에 carry_over=true 설정
4. [이월 태스크] + [오늘 태스크] 합쳐서 반환
```

### 5.3 스케줄 재계산 (`/api/plans/recalculate`)

```
PUT /api/plans/recalculate 호출 시:

1. 오늘 이후의 미완료 태스크 전부 삭제
2. 변경된 subjects/dailyHours로 새 태스크 생성
3. 오늘 이전의 완료 기록은 유지
```

---

## 6. 환경 변수

```env
# next-app/.env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...       # 브라우저 + 서버
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...            # 서버 전용 (RLS 우회 필요 시)
```
