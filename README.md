# Study Planner

개인별 학습 목표와 일정에 맞춰 학습 계획을 자동 생성하고 관리하는 웹 애플리케이션.

## 주요 기능

- **Google 로그인** — Supabase Auth OAuth로 간편 로그인
- **학습 계획 자동 생성** — 과목, 목표일, 가용 시간을 입력하면 일별 스케줄 자동 생성
- **진행 관리** — 일별 체크리스트, 전체 진행률, 미완료 항목 자동 이월
- **대시보드** — 오늘의 할 일, 주간/과목별 달성률 시각화
- **캘린더 뷰** — 월간 학습 계획 타임라인

## 기술 스택

| 구분 | 기술 |
|------|------|
| 프레임워크 | Next.js 16 (App Router, Turbopack) |
| 언어 | TypeScript |
| UI | Tailwind CSS v4 + shadcn/ui (Radix) |
| 아이콘 | Lucide React |
| 데이터베이스 | Supabase (PostgreSQL) |
| 인증 | Supabase Auth (Google OAuth) |
| 패키지 매니저 | pnpm |
| 배포 | Vercel |

## 프로젝트 구조

```
├── next-app/             # Next.js 풀스택 앱
│   ├── app/              #   App Router (페이지 + API Route Handlers)
│   ├── components/       #   UI 컴포넌트 (shadcn/ui + 커스텀)
│   ├── lib/              #   Supabase 클라이언트, 유틸리티
│   └── hooks/            #   커스텀 훅
├── supabase/             # Supabase 설정
├── prd.md                # 제품 요구사항 정의서
├── userstories.md        # 유저 스토리
├── screen_list_and_user_flows.md  # 화면 목록 & 유저 플로우
├── frontend_architecture.md       # 프론트엔드 아키텍처
└── backend_architecture.md        # 백엔드 (DB 스키�� + API) 아키텍처
```

## 시작하기

### 사전 준비

- Node.js 18+
- pnpm
- Supabase 프로젝트 (Google OAuth 설정 완료)

### 실행

```bash
cd next-app
pnpm install
cp .env.example .env.local    # 환경 변수 설정
pnpm dev                      # http://localhost:3000
```

### 환경 변수 (`next-app/.env.local`)

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## 문서

| 문서 | 설명 |
|------|------|
| [PRD](prd.md) | 제품 요구사항 정의 |
| [User Stories](userstories.md) | 유저 스토리 및 인수 조건 |
| [Screens & Flows](screen_list_and_user_flows.md) | 화면 목록, 유저 플로우, 네비게이션 맵 |
| [Frontend Architecture](frontend_architecture.md) | 프론트엔드 구조, 라우팅, 인증, 상태 관리 |
| [Backend Architecture](backend_architecture.md) | DB 스키마, API 엔드포인트, 핵심 로직 |
