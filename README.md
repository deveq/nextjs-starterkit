# Next.js 16 모던 웹 스타터킷

Next.js 16, React 19, TypeScript, Tailwind CSS, shadcn/ui 기반의 모던 웹 스타터킷입니다. 빠르게 새로운 웹 프로젝트를 시작할 수 있도록 설계되었습니다.

## 기술스택

- **Framework**: Next.js 16 (App Router)
- **UI Framework**: React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui (Base UI 기반)
- **Icons**: Lucide React
- **State Management**: Zustand
- **Form Management**: React Hook Form + Zod
- **Dark Mode**: next-themes
- **Notifications**: Sonner
- **Linting**: ESLint (Flat Config)

## 빠른 시작

### 설치

```bash
pnpm install
```

### 개발 서버 실행

```bash
pnpm dev
```

`http://localhost:3000`을 브라우저에서 열어 결과를 확인하세요.

### 빌드 및 실행

```bash
pnpm build
pnpm start
```

### Lint 실행

```bash
pnpm lint
```

## 폴더 구조

```
src/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # 루트 레이아웃 (Header, Footer, ThemeProvider)
│   ├── page.tsx                  # 홈 페이지
│   ├── globals.css               # 전역 스타일 (Tailwind CSS v4)
│   └── favicon.ico
├── components/
│   ├── ui/                       # shadcn/ui 컴포넌트
│   ├── layout/                   # 레이아웃 컴포넌트 (Header, Footer)
│   ├── theme/                    # 테마 관련 컴포넌트
│   ├── providers/                # 컨텍스트 프로바이더
│   └── examples/                 # 예시 컴포넌트 (삭제 가능)
├── constants/                    # 상수 정의
├── lib/
│   ├── utils.ts                  # 유틸리티 함수
│   └── validations/              # Zod 스키마
├── store/                        # Zustand 스토어
├── types/                        # TypeScript 타입 (필요 시 생성)
├── hooks/                        # 커스텀 훅 (필요 시 생성)
└── public/                       # 정적 자산

```

## 주요 기능

### 1. 다크모드 토글
Header의 아이콘 버튼으로 라이트/다크/시스템 테마를 선택할 수 있습니다.

### 2. Zustand 상태 관리
`src/components/examples/counter-example.tsx`에서 Zustand 사용 예시를 확인할 수 있습니다.

### 3. React Hook Form + Zod 폼 검증
`src/components/examples/example-form.tsx`에서 폼 유효성 검증 예시를 확인할 수 있습니다.

## 새로운 shadcn 컴포넌트 추가

```bash
pnpm exec shadcn add <component-name>
```

예: `pnpm exec shadcn add button`, `pnpm exec shadcn add dialog`

## 컨벤션

- **파일명**: kebab-case (예: `example-form.tsx`)
- **컴포넌트명**: PascalCase (예: `CounterExample`)
- **스타일**: Tailwind CSS + shadcn/ui
- **타입**: TypeScript (`any` 타입 금지)
- **코드 주석**: 필요한 경우만 한글로 작성 (WHY 위주)

## Next.js 16 주의사항

- `params`, `searchParams`, `cookies()`, `headers()` 등 비동기 API는 항상 `await` 필수
- `middleware.ts` 대신 `proxy.ts` 사용
- `cacheComponents`는 기본값(off) 유지
- `Image` 컴포넌트의 `priority` prop은 deprecated → `preload` prop 사용

## 예시 코드 삭제

`src/components/examples/` 폴더는 스타터킷 예시입니다. 실제 프로젝트를 시작할 때는 이 폴더를 삭제할 수 있습니다:

```bash
rm -rf src/components/examples
```

## 참고 자료

- [Next.js 공식 문서](https://nextjs.org/docs)
- [shadcn/ui](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com)
- [Zustand](https://zustand.surge.sh)
- [React Hook Form](https://react-hook-form.com)
