# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

Next.js 16, React 19, TypeScript 기반 모던 웹 스타터킷입니다. Tailwind CSS v4, shadcn/ui를 사용한 폴더 구조로 설계되었으며, 빠른 프로토타이핑과 확장성을 목표로 합니다.

## 개발 명령어

### 핵심 명령어

```bash
pnpm dev              # 개발 서버 실행 (localhost:3000)
pnpm build            # 프로덕션 빌드
pnpm start            # 빌드된 앱 실행
pnpm lint             # ESLint 실행
```

### 자주 사용하는 명령어

```bash
# shadcn/ui 컴포넌트 추가
pnpm exec shadcn add <component-name>
# 예: pnpm exec shadcn add button, pnpm exec shadcn add dialog

# TypeScript 타입 체크
pnpm tsc --noEmit

# 특정 파일만 lint
pnpm lint src/app/page.tsx
```

## 프로젝트 구조 및 아키텍처

```
src/
├── app/                       # Next.js App Router (라우팅 & 페이지)
│   ├── layout.tsx             # 루트 레이아웃 (ThemeProvider, Header, Footer, Toaster 포함)
│   ├── page.tsx               # 홈 페이지
│   ├── globals.css            # Tailwind CSS v4 글로벌 스타일
│   └── [route]/               # 동적 라우트
│
├── components/                # React 컴포넌트 모음
│   ├── ui/                    # shadcn/ui 생성 컴포넌트 (button, dialog, card 등)
│   ├── layout/                # 레이아웃 컴포넌트 (header, footer)
│   ├── providers/             # 컨텍스트 프로바이더 (ThemeProvider)
│   ├── theme/                 # 테마 관련 컴포넌트 (ThemeToggle 등)
│   └── examples/              # 스타터킷 예시 (삭제 가능)
│
├── constants/                 # 상수 정의 (SITE_CONFIG, NAV_LINKS 등)
│
├── lib/
│   ├── utils.ts               # cn() 및 기타 유틸리티 함수
│   └── validations/           # Zod 스키마 (폼 유효성 검증)
│
├── store/                     # Zustand 상태 관리 스토어
│   └── [store-name].ts
│
├── types/                     # TypeScript 타입 정의 (필요 시 생성)
│   └── index.ts
│
└── hooks/                     # 커스텀 React Hook (필요 시 생성)
    └── [hook-name].ts
```

### 폴더별 역할

- **app/** : 라우팅과 페이지 렌더링. 서버 컴포넌트가 기본이며, 클라이언트 기능이 필요한 경우만 `'use client'` 추가
- **components/ui/** : `pnpm exec shadcn add` 명령으로 생성된 재사용 가능한 UI 컴포넌트 (수정 금지)
- **components/layout/** : Header, Footer 등 페이지 레이아웃에 사용되는 컴포넌트
- **store/** : Zustand를 이용한 전역 상태 관리 (카운터, 사용자 정보, UI 상태 등)
- **lib/validations/** : React Hook Form + Zod를 이용한 폼 유효성 검증 스키마

## Next.js 16 주의사항

### 1. 비동기 API와 await

Next.js 16의 `params`, `searchParams`, `cookies()`, `headers()` 등은 모두 비동기입니다. 반드시 `await`를 사용하세요:

```typescript
// ✓ 올바른 예
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return <div>{slug}</div>
}

// ✗ 잘못된 예 (await 없음)
export default function Page({ params }: { params: { slug: string } }) {
  return <div>{params.slug}</div>
}
```

### 2. Image 컴포넌트 변경

- `priority` prop → `preload` prop으로 변경됨
- `responsive` prop 및 기타 API 변경 가능성 있음

### 3. middleware 대신 proxy.ts 사용

- `middleware.ts`는 더 이상 권장되지 않음
- 요청 처리가 필요하면 `proxy.ts` 사용

### 4. cacheComponents 설정

- 기본값(off) 유지. 성능 이슈 발생 시에만 활성화

## 기술 스택

| 분야 | 기술 | 버전 |
|------|------|------|
| Framework | Next.js (App Router) | 16 |
| UI Library | React | 19 |
| Language | TypeScript | 5 |
| Styling | Tailwind CSS + PostCSS | v4 |
| UI Components | shadcn/ui (Base UI 기반) | Latest |
| Icons | Lucide React | Latest |
| State Management | Zustand | ^5 |
| Form & Validation | React Hook Form + Zod | Latest |
| Dark Mode | next-themes | 0.4.6 |
| Notifications | Sonner | 2.0.8 |
| Linting | ESLint (Flat Config) | 9 |

## 상태 관리 패턴

### Zustand 스토어 작성

```typescript
// src/store/counter-store.ts
import { create } from "zustand"

interface CounterState {
  count: number
  increment: () => void
  decrement: () => void
}

export const useCounterStore = create<CounterState>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
}))
```

### 컴포넌트에서 사용

```typescript
'use client'

import { useCounterStore } from "@/store/counter-store"

export function Counter() {
  const { count, increment, decrement } = useCounterStore()
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={increment}>+1</button>
      <button onClick={decrement}>-1</button>
    </div>
  )
}
```

## 폼 검증 패턴

### Zod 스키마 정의

```typescript
// src/lib/validations/example.ts
import { z } from "zod"

export const exampleSchema = z.object({
  email: z.string().email("유효한 이메일을 입력하세요"),
  password: z.string().min(8, "비밀번호는 8자 이상이어야 합니다"),
})

export type ExampleInput = z.infer<typeof exampleSchema>
```

### React Hook Form과 함께 사용

```typescript
'use client'

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { exampleSchema, type ExampleInput } from "@/lib/validations/example"

export function ExampleForm() {
  const form = useForm<ExampleInput>({
    resolver: zodResolver(exampleSchema),
  })

  const onSubmit = (data: ExampleInput) => {
    console.log(data)
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <input {...form.register("email")} />
      {form.formState.errors.email && (
        <p>{form.formState.errors.email.message}</p>
      )}
      <button type="submit">Submit</button>
    </form>
  )
}
```

## 코드 스타일 및 컨벤션

### 파일/폴더 명명

- **파일명**: kebab-case (예: `example-form.tsx`, `user-avatar.tsx`)
- **컴포넌트명**: PascalCase (예: `ExampleForm`, `UserAvatar`)
- **폴더명**: kebab-case (예: `form-inputs`, `ui-components`)

### TypeScript 규칙

- **any 타입 금지**: 항상 명확한 타입을 정의하세요
- **Props 인터페이스**: 컴포넌트별로 `ComponentNameProps` 인터페이스 정의
- **타입 안전성**: 모든 함수의 입출력 타입을 명시

```typescript
// ✓ 올바른 예
interface ButtonProps {
  onClick: () => void
  children: React.ReactNode
  variant?: "primary" | "secondary"
}

export function Button({ onClick, children, variant = "primary" }: ButtonProps) {
  return <button onClick={onClick}>{children}</button>
}

// ✗ 잘못된 예 (any 사용)
export function Button(props: any) {
  return <button onClick={props.onClick}>{props.children}</button>
}
```

### 주석 규칙

- **기본**: 주석 없이 명확한 코드 작성
- **예외**: WHY 위주의 주석만 작성 (복잡한 로직, 숨겨진 제약사항, 워크어라운드)
- **언어**: 한글로 작성

```typescript
// ✓ 필요한 주석
// 특정 브라우저의 레이아웃 이슈 workaround (Safari 15.x)
if (isSafari) {
  style.transform = "translateZ(0)"
}

// ✗ 불필요한 주석
// count를 1 증가시킨다
count = count + 1
```

## MCP 서버 설정

현재 Playwright MCP 서버가 활성화되어 있습니다:

```json
{
  "mcpServers": {
    "playwright": {
      "type": "stdio",
      "command": "npx",
      "args": ["@playwright/mcp@latest"]
    }
  }
}
```

Playwright를 이용한 자동화 테스트나 브라우저 상호작용이 필요한 경우 활용하세요.

## 서버/클라이언트 컴포넌트 구분

### 서버 컴포넌트 (기본)

```typescript
// src/app/page.tsx
import { getUser } from "@/lib/get-user"

export default async function Page() {
  const user = await getUser() // 서버에서만 실행
  
  return <div>Welcome {user.name}</div>
}
```

### 클라이언트 컴포넌트

```typescript
'use client' // 반드시 파일 최상단에 위치

import { useState } from "react"

export default function Counter() {
  const [count, setCount] = useState(0)
  
  return <button onClick={() => setCount(count + 1)}>{count}</button>
}
```

## 타입 정의 구조

새로운 타입을 정의할 때는 `src/types/` 폴더에서 관리하세요:

```typescript
// src/types/user.ts
export interface User {
  id: string
  name: string
  email: string
  createdAt: Date
}

export type UserRole = "admin" | "user" | "guest"
```

## 환경 변수

`.env.local` 파일에서 환경 변수를 관리합니다. 클라이언트에서 노출되는 변수는 `NEXT_PUBLIC_` 접두사를 사용하세요:

```
NEXT_PUBLIC_API_URL=https://api.example.com
API_SECRET_KEY=secret
```

## 빌드 및 배포

### 로컬 빌드 테스트

```bash
pnpm build
pnpm start
```

### 타입 체크 후 빌드

```bash
pnpm tsc --noEmit && pnpm build
```

## 참고 자료

- [Next.js 16 공식 문서](https://nextjs.org/docs)
- [shadcn/ui](https://ui.shadcn.com)
- [Tailwind CSS v4](https://tailwindcss.com)
- [Zustand](https://zustand.surge.sh)
- [React Hook Form](https://react-hook-form.com)
- [Zod 검증 라이브러리](https://zod.dev)
