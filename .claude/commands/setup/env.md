---
allowed-tools: Bash
description: 환경변수 설정 (local, qa, staging, production)
argument-hint: [environment]
---

# setup:env 커맨드

환경별 `.env` 파일을 인터랙티브하게 설정합니다.

## 사용법

### 기본 (local 환경)
```bash
setup:env
```

### 특정 환경 지정
```bash
setup:env local      # 로컬 개발 환경
setup:env qa         # QA 환경
setup:env staging    # Staging 환경
setup:env production # Production 환경
```

## 기능

- **인터랙티브 입력**: 각 환경변수 값을 프롬프트에서 입력
- **기본값 제공**: 환경별 기본값으로 빠른 설정
- **추가 변수**: 기본 템플릿 외 추가 환경변수 입력 가능
- **파일 생성**: `.env.{environment}` 파일 자동 생성

## 환경별 기본 템플릿

### Local (로컬 개발)
- `NEXT_PUBLIC_API_URL`: `http://localhost:3001`
- `API_SECRET_KEY`: `local-secret-key`

### QA
- `NEXT_PUBLIC_API_URL`: `https://qa-api.example.com`
- `API_SECRET_KEY`: (입력 필요)

### Staging
- `NEXT_PUBLIC_API_URL`: `https://staging-api.example.com`
- `API_SECRET_KEY`: (입력 필요)

### Production
- `NEXT_PUBLIC_API_URL`: `https://api.example.com`
- `API_SECRET_KEY`: (입력 필요)

## 생성되는 파일

- `.env.local` (local 환경)
- `.env.qa` (qa 환경)
- `.env.staging` (staging 환경)
- `.env.production` (production 환경)

이 파일들은 `.gitignore`에 포함되어 있어 버전 관리되지 않습니다.

## 주의사항

1. `NEXT_PUBLIC_` 접두사가 붙은 변수는 클라이언트 번들에 포함되므로 민감한 정보는 금지합니다.
2. 각 환경의 파일을 따로 관리하려면 `.env.local`, `.env.qa` 등으로 구분해 사용하세요.
3. Next.js에서는 `.env.local` 파일을 기본으로 로드합니다.
