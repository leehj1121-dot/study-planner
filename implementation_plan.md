# Implementation Plan
---

## Phase 0: 프로젝트 기반 설정
> 목표: Supabase 연동, 인증 인프라, 기본 레이아웃 구성

### 0-1. Supabase 클라이언트 설정
- [ ] `@supabase/ssr` 패키지 설치
- [ ] `lib/supabase/client.ts` — 브라우저용 Supabase 클라이언트
- [ ] `lib/supabase/server.ts` — 서버용 Supabase 클라이언트 (Route Handlers, Server Components)
- [ ] `lib/supabase/middleware.ts` — 미들웨어용 세션 갱신 헬퍼
- [ ] `.env.local` 생성 (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)

### 0-2. Supabase DB 스키마 생성
- [ ] `plans` 테이블 생성 (SQL)
- [ ] `subjects` 테이블 생성 (SQL)
- [ ] `tasks` 테이블 생성 (SQL)
- [ ] 인덱스 생성 (`idx_tasks_user_date`, `idx_tasks_plan_id`, `idx_subjects_plan_id`)
- [ ] RLS 정책 설정 (본인 데이터만 접근)
- [ ] Supabase 대시보드에서 Google OAuth Provider 활성화

### 0-3. 인증 인프라
- [ ] `middleware.ts` — 인증 체크 미들웨어 (보호 경로 → `/login` 리다이렉트)
- [ ] `app/auth/callback/route.ts` — OAuth 콜백 핸들러 (code → session 교환)
- [ ] `components/auth-provider.tsx` — 클라이언트 인증 상태 Provider
- [ ] `hooks/use-auth.ts` — 인증 상태 훅 (`user`, `loginWithGoogle`, `logout`)

### 0-4. 공통 레이아웃
- [ ] `app/layout.tsx` 수정 — ThemeProvider, AuthProvider 래핑
- [ ] `components/bottom-nav.tsx` — 하단 탭 네비게이션 (대시보드, 캘린더, 설정)
- [ ] `app/(main)/layout.tsx` — 하단 네비 포함 레이아웃
- [ ] shadcn/ui 컴포넌트 추가 설치: `card`, `checkbox`, `dialog`, `calendar`, `slider`, `progress`, `input`

**완료 기준**: Google 로그인 → 세션 유지 → 보호 경로 접근 가능

---

## Phase 1: 로그인 페이지
> 관련: US-00a | 화면: S-00

### 1-1. 로그인 페이지
- [ ] `app/login/page.tsx` — "Google로 로그인" 버튼 1개
- [ ] 로그인 성공 → `/auth/callback` → 온보딩 여부에 따라 리다이렉트
- [ ] 이미 로그인 상태면 `/dashboard`로 리다이렉트

### 1-2. 루트 리다이렉트
- [ ] `app/page.tsx` — 로그인 여부에 따라 `/login` 또는 `/dashboard`로 리다이렉트

**완료 기준**: Google 로그인/로그아웃 정상 동작, 세션 유지

---

## Phase 2: 온보딩 (3단계)
> 관련: US-01, US-02, US-03, US-05 | 화면: S-01, S-02, S-03

### 2-1. 과목 API
- [ ] `app/api/subjects/route.ts` — `GET` (목록), `POST` (추가)
- [ ] `app/api/subjects/[id]/route.ts` — `PATCH` (수정), `DELETE` (삭제)
- [ ] `app/api/plans/route.ts` — `GET`, `POST` (플랜 생성), `PATCH` (수정)

### 2-2. 과목 입력 페이지 (S-01)
- [ ] `components/subject-input.tsx` — 과목명 입력 + 추가/삭제 리스트
- [ ] `app/onboarding/subjects/page.tsx` — 과목 입력 폼, "다음" 버튼
- [ ] 유효성: 최소 1개 이상 입력 시 "다음" 활성화

### 2-3. 목표 날짜 페이지 (S-02)
- [ ] `app/onboarding/date/page.tsx` — shadcn Calendar로 날짜 선택
- [ ] 오늘 이전 날짜 비활성화
- [ ] 남은 일수 표시
- [ ] "이전" / "다음" 버튼

### 2-4. 가용 시간 & 비중 페이지 (S-03)
- [ ] `components/weight-slider.tsx` — 과목별 비중(%) 슬라이더
- [ ] `app/onboarding/time/page.tsx` — 가용 시간 입력 + 비중 조절
- [ ] 비중 합계 100% 검증
- [ ] "계획 생성" 버튼 → Phase 3 스케줄 생성 API 호출

**완료 기준**: 온보딩 3단계 완료 → plans, subjects 테이블에 데이터 저장

---

## Phase 3: 스케줄 자동 생성
> 관련: US-04 | 핵심 비즈니스 로직

### 3-1. 스케줄 생성 API
- [ ] `app/api/plans/generate/route.ts` — `POST`
  - subjects, targetDate, dailyHours 기반 일별 태스크 생성
  - 과목별 weight에 따라 dailyHours 분배
  - tasks 테이블에 bulk insert
  - plan.is_onboarded = true 업데이트

### 3-2. 온보딩 완료 연동
- [ ] S-03 "계획 생성" 클릭 → `/api/plans/generate` 호출
- [ ] 성공 시 `/dashboard`로 리다이렉트

**완료 기준**: 온보딩 완료 → tasks 테이블에 일별 태스크 데이터 생성됨

---

## Phase 4: 대시보드
> 관련: US-06, US-07, US-08, US-09, US-10, US-11 | 화면: S-04

### 4-1. 태스크/통계 API
- [ ] `app/api/tasks/today/route.ts` — `GET` (오늘 태스크 + 이월 항목)
- [ ] `app/api/tasks/[id]/toggle/route.ts` — `PATCH` (완료 토글)
- [ ] `app/api/stats/progress/route.ts` — `GET` (전체 + 과목별 진행률)
- [ ] `app/api/stats/weekly/route.ts` — `GET` (주간 달성률)

### 4-2. 대시보드 컴포넌트
- [ ] `components/today-task-card.tsx` — 학습 항목 카드 (체크박스 포함)
- [ ] `components/carry-over-list.tsx` — 이월 항목 영역 (시각적 구분)
- [ ] `components/subject-progress.tsx` — 과목별 달성률 바
- [ ] `components/weekly-chart.tsx` — 주간 달성률 차트

### 4-3. 대시보드 페이지
- [ ] `app/(main)/dashboard/page.tsx` — Server Component에서 데이터 fetch
  - 오늘의 학습 카드 (체크박스 토글)
  - 이월 항목 표시
  - 전체 진행률 프로그레스 바
  - 주간 달성률
  - 과목별 달성률

**완료 기준**: 오늘 할 일 표시, 체크 시 완료 처리, 진행률 실시간 업데이트

---

## Phase 5: 캘린더 뷰
> 관련: US-04 | 화면: S-05

### 5-1. 캘린더 API
- [ ] `app/api/tasks/route.ts` — `GET` (쿼리: `?month=` 또는 `?date=`)

### 5-2. 캘린더 컴포넌트
- [ ] `components/calendar-grid.tsx` — 월간 캘린더 그리드 + 날짜별 과목 태그
- [ ] `components/day-detail-panel.tsx` — 날짜 클릭 시 상세 패널

### 5-3. 캘린더 페이지
- [ ] `app/(main)/calendar/page.tsx` — 월간 캘린더 + 날짜별 상세
- [ ] 오늘 날짜 강조
- [ ] 월 이동 (이전/다음)

**완료 기준**: 월간 캘린더에 과목 태그 표시, 날짜 클릭 시 상세 조회

---

## Phase 6: 설정
> 관련: US-00b, US-12, US-13, US-15 | 화면: S-06, S-07

### 6-1. 설정 API
- [ ] `app/api/plans/recalculate/route.ts` — `PUT` (스케줄 재계산)
- [ ] `app/api/plans/reset/route.ts` — `DELETE` (데이터 초기화)

### 6-2. 설정 페이지
- [ ] `app/(main)/settings/page.tsx`
  - 과목 추가/삭제 (subject-input 재사용)
  - 과목별 비중 조절 (weight-slider 재사용)
  - 가용 시간 수정
  - "변경 저장" → `/api/plans/recalculate` → 스케줄 재계산
  - "데이터 초기화" 버튼 → 확인 모달(S-07) → `/api/plans/reset`
  - "로그아웃" 버튼

**완료 기준**: 설정 변경 → 스케줄 재계산, 초기화 → 온보딩으로 리셋, 로그아웃 동작

---

## Phase 7: 마무리
> QA, 반응형, 배포

### 7-1. 반응형 & UI 다듬기
- [ ] 모바일 퍼스트 레이아웃 점검 (~480px)
- [ ] 태블릿 대시보드 2열 배치 (`md:grid-cols-2`)
- [ ] 다크/라이트 모드 확인
- [ ] 로딩 상태 (Skeleton UI)
- [ ] 에러 상태 처리

### 7-2. 배포
- [ ] Vercel 프로젝트 생성 + GitHub 연동
- [ ] 환경 변수 설정 (Vercel Dashboard)
- [ ] Supabase에 프로덕션 OAuth redirect URL 등록
- [ ] 빌드/배포 확인

**완료 기준**: Vercel에 배포 완료, 프로덕션 Google 로그인 정상 동작

---

## 구현 순서 요약

```
Phase 0  기반 설정 (Supabase, 인증, 레이아웃)
  │
Phase 1  로그인 페이지
  │
Phase 2  온보딩 3단계 (과목 → 날짜 → 시간/비중)
  │
Phase 3  스케줄 자동 생성 (핵심 로직)
  │
Phase 4  대시보드 (오늘 할 일, 진행률, 체크)
  │
Phase 5  캘린더 뷰
  │
Phase 6  설정 (수정, 재계산, 초기화, 로그아웃)
  │
Phase 7  반응형, QA, Vercel 배포
```

## 파일 생성 체크리스트

### lib/ (3개)
- [ ] `lib/supabase/client.ts`
- [ ] `lib/supabase/server.ts`
- [ ] `lib/supabase/middleware.ts`

### 미들웨어 (1개)
- [ ] `middleware.ts`

### 페이지 (8개)
- [ ] `app/page.tsx` (수정)
- [ ] `app/login/page.tsx`
- [ ] `app/onboarding/subjects/page.tsx`
- [ ] `app/onboarding/date/page.tsx`
- [ ] `app/onboarding/time/page.tsx`
- [ ] `app/(main)/layout.tsx`
- [ ] `app/(main)/dashboard/page.tsx`
- [ ] `app/(main)/calendar/page.tsx`
- [ ] `app/(main)/settings/page.tsx`

### API Route Handlers (12개)
- [ ] `app/auth/callback/route.ts`
- [ ] `app/api/subjects/route.ts`
- [ ] `app/api/subjects/[id]/route.ts`
- [ ] `app/api/plans/route.ts`
- [ ] `app/api/plans/generate/route.ts`
- [ ] `app/api/plans/recalculate/route.ts`
- [ ] `app/api/plans/reset/route.ts`
- [ ] `app/api/tasks/route.ts`
- [ ] `app/api/tasks/today/route.ts`
- [ ] `app/api/tasks/[id]/toggle/route.ts`
- [ ] `app/api/stats/progress/route.ts`
- [ ] `app/api/stats/weekly/route.ts`

### 컴포넌트 (10개)
- [ ] `components/auth-provider.tsx`
- [ ] `components/bottom-nav.tsx`
- [ ] `components/subject-input.tsx`
- [ ] `components/weight-slider.tsx`
- [ ] `components/today-task-card.tsx`
- [ ] `components/carry-over-list.tsx`
- [ ] `components/subject-progress.tsx`
- [ ] `components/weekly-chart.tsx`
- [ ] `components/calendar-grid.tsx`
- [ ] `components/day-detail-panel.tsx`

### 훅 (1개)
- [ ] `hooks/use-auth.ts`
