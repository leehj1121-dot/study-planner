# Frontend Architecture
---

## 1. 기술 스택

| 구분 | 선택 | 이유 |
|------|------|------|
| 프레임워크 | Next.js 16 (App Router) | 풀스택, 파일 기반 라우팅, RSC 지원 |
| 빌드 | Turbopack (`next dev --turbopack`) | 빠른 개발 서버 |
| 언어 | TypeScript | 타입 안전성 |
| UI 라이브러리 | shadcn/ui (Radix) | 접근성, 커스터마이징 용이 |
| 스타일링 | Tailwind CSS v4 | 유틸리티 퍼스트, shadcn과 통합 |
| 아이콘 | Lucide React | shadcn 기본 아이콘 |
| 테마 | next-themes | 다크/라이트 모드 |
| 인증 | Supabase Auth (Google OAuth) | 프론트에서 직접 처리 |
| 패키지 매니저 | pnpm | 빠른 설치, 디스크 효율 |
| 배포 | Vercel | Next.js 네이티브 지원 |

---

## 2. 프로젝트 구조

```
next-app/
├── app/                          # App Router
│   ├── layout.tsx                    # 루트 레이아웃 (ThemeProvider, AuthProvider)
│   ├── page.tsx                      # / → 리다이렉트 (로그인 or 대시보드)
│   ├── globals.css                   # Tailwind 전역 스타일
│   │
│   ├── login/
│   │   └── page.tsx                  # S-00: Google 로그인
│   │
│   ├── onboarding/
│   │   ├── subjects/
│   │   │   └── page.tsx              # S-01: 과목 입력
│   │   ├── date/
│   │   │   └── page.tsx              # S-02: 목표 날짜
│   │   └── time/
│   │       └── page.tsx              # S-03: 가용 시간 & 비중
│   │
│   ├── (main)/                       # 그룹 라우트 (하단 네비 공유 레이아웃)
│   │   ├── layout.tsx                # MainLayout + BottomNav
│   │   ├── dashboard/
│   │   │   └── page.tsx              # S-04: 대시보드
│   │   ├── calendar/
│   │   │   └── page.tsx              # S-05: 캘린더 뷰
│   │   └── settings/
│   │       └── page.tsx              # S-06: 설정
│   │
│   ├── auth/
│   │   └── callback/
│   │       └── route.ts              # Supabase OAuth 콜백 처리
│   │
│   └── api/                          # Route Handlers (API Routes)
│       ├── subjects/
│       │   └── route.ts              # GET, POST
│       ├── subjects/[id]/
│       │   └── route.ts              # PATCH, DELETE
│       ├── plans/
│       │   ├── route.ts              # GET, POST, PATCH
│       │   ├── generate/
│       │   │   └── route.ts          # POST: 스케줄 생성
│       │   ├── recalculate/
│       │   │   └── route.ts          # PUT: 스케줄 재계산
│       │   └── reset/
│       │       └── route.ts          # DELETE: 초기화
│       ├── tasks/
│       │   ├── route.ts              # GET: 월별/날짜별 조회
│       │   ├── today/
│       │   │   └── route.ts          # GET: 오늘 태스크 + 이월
│       │   └── [id]/
│       │       └── toggle/
│       │           └── route.ts      # PATCH: 완료 토글
│       └── stats/
│           ├── progress/
│           │   └── route.ts          # GET: 전체/과목별 진행률
│           └── weekly/
│               └── route.ts          # GET: 주간 달성률
│
├── components/
│   ├── ui/                           # shadcn/ui 컴포넌트
│   │   ├── button.tsx
│   │   ├── progress.tsx
│   │   ├── dialog.tsx                # 모달 (S-07)
│   │   ├── calendar.tsx
│   │   ├── slider.tsx
│   │   ├── checkbox.tsx
│   │   ├── card.tsx
│   │   └── ...
│   ├── theme-provider.tsx            # next-themes Provider
│   ├── auth-provider.tsx             # Supabase Auth 상태 Provider
│   ├── bottom-nav.tsx                # 하단 탭 네비게이션
│   ├── today-task-card.tsx           # 오늘의 학습 카드
│   ├── carry-over-list.tsx           # 이월 항목 영역
│   ├── weekly-chart.tsx              # 주간 달성률
│   ├── subject-progress.tsx          # 과목별 달성률
│   ├── calendar-grid.tsx             # 월간 캘린더 그리드
│   ├── day-detail-panel.tsx          # 날짜 클릭 시 상세 패널
│   ├── subject-input.tsx             # 과목 입력 + 리스트
│   └── weight-slider.tsx             # 과목별 비중 슬라이더
│
├── lib/
│   ├── utils.ts                      # cn() 등 유틸리티
│   └── supabase/
│       ├── client.ts                 # 브라우저용 Supabase 클라이언트
│       ├── server.ts                 # 서버용 Supabase 클라이언트 (Route Handlers)
│       └── middleware.ts             # Supabase Auth 미들웨어 헬퍼
│
├── hooks/
│   ├── use-auth.ts                   # 인증 상태 훅
│   └── use-schedule.ts              # 스케줄/이월 로직 훅
│
├── middleware.ts                     # Next.js 미들웨어 (인증 체크, 리다이렉트)
├── components.json                   # shadcn/ui 설정
├── next.config.mjs
├── postcss.config.mjs
├── tsconfig.json
└── package.json
```

---

## 3. 라우팅 구조 (App Router)

| 경로 | 파일 | 화면 | 인증 필요 |
|------|------|------|-----------|
| `/` | `app/page.tsx` | 리다이렉트 | - |
| `/login` | `app/login/page.tsx` | S-00: Google 로그인 | X |
| `/onboarding/subjects` | `app/onboarding/subjects/page.tsx` | S-01: 과목 입력 | O |
| `/onboarding/date` | `app/onboarding/date/page.tsx` | S-02: 목표 날짜 | O |
| `/onboarding/time` | `app/onboarding/time/page.tsx` | S-03: 시간 & 비중 | O |
| `/dashboard` | `app/(main)/dashboard/page.tsx` | S-04: 대시보드 | O |
| `/calendar` | `app/(main)/calendar/page.tsx` | S-05: 캘린더 | O |
| `/settings` | `app/(main)/settings/page.tsx` | S-06: 설정 | O |
| `/auth/callback` | `app/auth/callback/route.ts` | OAuth 콜백 | - |

### 미들웨어 리다이렉트 로직 (`middleware.ts`)

```
요청 진입
    │
    ├── 미로그인 + 보호된 경로 → /login
    ├── 로그인 + /login 접근 → /dashboard
    └── / 접근 → 로그인 여부에 따라 /login 또는 /dashboard
```

### 그룹 라우트 `(main)`

`app/(main)/layout.tsx`에서 `BottomNav`를 포함. URL에 `(main)`은 노출되지 않음.
- `/dashboard`, `/calendar`, `/settings` → 하단 네비 표시
- `/login`, `/onboarding/*` → 하단 네비 없음

---

## 4. 인증 흐름 (Supabase Auth Only)

```
[/login 페이지]
    │ "Google로 로그인" 버튼 클릭
    ▼
supabase.auth.signInWithOAuth({ provider: 'google' })
    │
    ▼
Google OAuth 동의 화면
    │
    ▼
/auth/callback (route.ts)
    │ code ↔ session 교환
    ▼
미들웨어가 세션 확인 → /dashboard 또는 /onboarding/subjects 리다이렉트
```

### lib/supabase/client.ts (브라우저용)

```ts
import { createBrowserClient } from '@supabase/ssr';

export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
```

### lib/supabase/server.ts (서버용 — Route Handlers, Server Components)

```ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const createClient = async () => {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: (cookies) => cookies.forEach(c => cookieStore.set(c)) } }
  );
};
```

### 인증 관련 함수 (auth-provider.tsx)

```ts
const loginWithGoogle = () =>
  supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${origin}/auth/callback` },
  });

const logout = () => supabase.auth.signOut();
```

---

## 5. API 구조 (Route Handlers)

NestJS 대신 **Next.js Route Handlers**로 API 처리. 서버 사이드에서 Supabase service role로 DB 접근.

### API 엔드포인트

| 화면 | 메서드 | 경로 | 설명 |
|------|--------|------|------|
| S-01 | `POST` | `/api/subjects` | 과목 추가 |
| S-01 | `DELETE` | `/api/subjects/[id]` | 과목 삭제 |
| S-02 | `PATCH` | `/api/plans` | 목표일 저장 |
| S-03 | `POST` | `/api/plans/generate` | 스케줄 자동 생성 |
| S-04 | `GET` | `/api/tasks/today` | 오늘 태스크 + 이월 |
| S-04 | `PATCH` | `/api/tasks/[id]/toggle` | 완료 토글 |
| S-04 | `GET` | `/api/stats/progress` | 전체/과목별 진행률 |
| S-04 | `GET` | `/api/stats/weekly` | 주간 달성률 |
| S-05 | `GET` | `/api/tasks?month=2026-04` | 월별 태스크 |
| S-06 | `PUT` | `/api/plans/recalculate` | 스케줄 재계산 |
| S-07 | `DELETE` | `/api/plans/reset` | 데이터 초기화 |

### Route Handler 인증 패턴

```ts
// app/api/subjects/route.ts
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { data } = await supabase
    .from('subjects')
    .select('*')
    .eq('user_id', user.id);

  return Response.json(data);
}
```

---

## 6. 상태 관리

### Server Components (RSC)

대시보드, 캘린더 등 데이터 조회 페이지는 **Server Component**에서 직접 Supabase 조회 가능.

```tsx
// app/(main)/dashboard/page.tsx
export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: tasks } = await supabase.from('tasks').select('*').eq('date', today);
  return <DashboardClient tasks={tasks} />;
}
```

### Client Components

체크박스 토글, 슬라이더 조작 등 인터랙션이 필요한 부분만 `"use client"`.

```
Server Component (데이터 fetch)
    │
    └──▶ Client Component (인터랙션)
         │
         └──▶ fetch('/api/tasks/[id]/toggle') → revalidate
```

---

## 7. 컴포넌트-화면 매핑

```
/login
 └── "Google로 로그인" Button → supabase.auth.signInWithOAuth()

/onboarding/subjects (S-01)
 └── subject-input.tsx
 └── Button ("다음")

/onboarding/date (S-02)
 └── ui/calendar.tsx (shadcn)
 └── Button ("이전" / "다음")

/onboarding/time (S-03)
 └── weight-slider.tsx (x 과목 수)
 └── Button ("계획 생성") → POST /api/plans/generate

/dashboard (S-04)
 ├── carry-over-list.tsx
 ├── today-task-card.tsx (ui/checkbox + ui/card)
 ├── ui/progress.tsx (전체)
 ├── weekly-chart.tsx
 └── subject-progress.tsx

/calendar (S-05)
 ├── calendar-grid.tsx
 └── day-detail-panel.tsx

/settings (S-06)
 ├── subject-input.tsx
 ├── weight-slider.tsx
 ├── Button ("변경 저장") → PUT /api/plans/recalculate
 ├── Button ("데이터 초기화")
 ├── Button ("로그아웃")
 └── ui/dialog.tsx (S-07 초기화 확인 모달)

(main)/layout.tsx
 └── bottom-nav.tsx
```

---

## 8. 환경 변수

```env
# next-app/.env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...       # 서버 전용
```

> `NEXT_PUBLIC_` 접두사 = 브라우저 노출 가능. `SUPABASE_SERVICE_ROLE_KEY`는 서버에서만 사용.

---

## 9. 반응형 기준

| 구간 | 너비 | 대응 |
|------|------|------|
| 모바일 | ~480px | 기본 레이아웃 (1열) |
| 태블릿 | 481~768px | 대시보드 카드 2열 (`md:grid-cols-2`) |
| 데스크톱 | 769px~ | 하단 네비 유지 (MVP) |

MVP에서는 **모바일 퍼스트**로 구현. Tailwind 반응형 유틸리티 활용.
