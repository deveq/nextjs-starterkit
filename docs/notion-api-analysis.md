# Notion API 데이터베이스 사용 분석

작성일: 2026-10-04
범위: 노션 API로 데이터베이스를 조회·생성·수정하는 방법, 이 프로젝트 적용 방향
상태: 분석 문서 (코드 미작성, 파일 수정 없음)

---

## 1. 핵심 결론

**Notion API 2025-09-03 버전에서 `databases.query`가 제거되었습니다.** 데이터베이스(컨테이너)와 데이터 소스(실제 테이블)가 분리되었고, 조회는 데이터 소스 단위로 해야 합니다.

- 조회 엔드포인트: `POST /v1/data_sources/{data_source_id}/query`
- SDK 메서드: `notion.dataSources.query` (`notion.databases.query`는 존재하지 않음)
- 학습 데이터 기반의 `notion.databases.query({ database_id })` 코드는 현재 SDK에서 동작하지 않음

### API 버전 선택

| 선택 | 내용 |
|---|---|
| **권장: `2025-09-03`** | SDK 5.27.0 기본값. 타입과 런타임 일치. 조회 전용 MVP에 충분 |
| `2026-03-11` | `archived` → `in_trash` 교체, `append block children`의 `after` → `position`, 블록 타입 `transcription` → `meeting_notes`. 읽기 전용 프로젝트에는 실익이 적음 |

어느 쪽이든 `new Client({ notionVersion: "..." })`로 버전을 **명시적으로 고정**해야 SDK 업그레이드 시 조용히 깨지지 않습니다.

---

## 2. 데이터베이스 조회 (query)

### 요청 body

```ts
{
  data_source_id: string
  filter?: { and: [...] } | { or: [...] } | PropertyFilter | TimestampFilter
  sorts?: Array<
    | { property: string; direction: "ascending" | "descending" }
    | { timestamp: "created_time" | "last_edited_time"; direction: ... }
  >
  start_cursor?: string | null
  page_size?: number          // 최대 100
  in_trash?: boolean          // 기본 false
  result_type?: "page" | "data_source"   // 위키 전용
  filter_properties?: string[]           // 반환 속성 축소 (query param)
}
```

### 응답

```ts
{
  object: "list"
  type: "page_or_data_source"
  results: Array<PageObjectResponse | PartialPageObjectResponse
               | DataSourceObjectResponse | PartialDataSourceObjectResponse>
  has_more: boolean
  next_cursor: string | null
  request_status?: { type: "complete" | "incomplete"; incomplete_reason?: "query_result_limit_reached" }
}
```

주의점
- `results`는 partial 객체가 섞인 유니온이므로 `isFullPage()`로 좁혀야 `properties`에 접근 가능
- 쿼리 1회당 누적 **10,000건 상한**이 있으므로 `request_status.type === "incomplete"` 확인 필요

### 타입별 필터 예시

```ts
{ property: "제목",   title: { contains: "쇼핑몰" } }
{ property: "비고",   rich_text: { is_not_empty: true } }
{ property: "단가",   number: { greater_than_or_equal_to: 0 } }
{ property: "단위",   select: { equals: "식" } }
{ property: "태그",   multi_select: { contains: "긴급" } }
{ property: "상태",   status: { equals: "발행" } }
{ property: "발행일", date: { on_or_after: "2026-10-01" } }
{ property: "부가세 적용", checkbox: { equals: true } }
{ property: "견적서", relation: { contains: "<page-id>" } }
{ property: "담당자", people: { contains: "<user-id>" } }
{ property: "합계",   formula: { number: { greater_than: 0 } } }
{ property: "총액",   rollup: { number: { greater_than: 0 } } }
{ timestamp: "last_edited_time", last_edited_time: { past_week: {} } }
```

- 복합 조건은 `{ and: [...] }` / `{ or: [...] }`로 중첩
- 속성 이름은 대소문자와 공백까지 정확히 일치해야 함 (한글 속성명도 그대로 사용)

### 페이지네이션

SDK 헬퍼 사용을 권장합니다.

```ts
import { collectPaginatedAPI, iteratePaginatedAPI } from "@notionhq/client"

// 전량 수집
const pages = await collectPaginatedAPI(notion.dataSources.query, {
  data_source_id: id,
  page_size: 100,
})

// 스트리밍 순회
for await (const page of iteratePaginatedAPI(notion.dataSources.query, { data_source_id: id })) {
  // ...
}
```

직접 구현 시: `has_more`가 `true`인 동안 `next_cursor`를 `start_cursor`로 넘기는 루프.

### 데이터 소스 ID 얻는 법

1. Notion UI: DB 설정 → `Manage data sources` → `Copy data source ID` (**권장**, 환경변수에 저장)
2. API: `GET /v1/databases/{database_id}` 응답의 `data_sources: Array<{ id, name }>`

2번은 요청마다 왕복이 1회 늘어 Rate Limit에 불리하므로 1번을 권장합니다.

---

## 3. 페이지(행) 생성 / 수정 / 삭제

```ts
// 생성: parent는 data_source_id 권장 (database_id도 아직 허용)
await notion.pages.create({
  parent: { type: "data_source_id", data_source_id: ITEM_DS_ID },
  properties: { /* ... */ },
})

// 수정: 전달한 속성만 교체, 생략한 속성은 유지
// 배열형 속성은 append가 아니라 전체 교체
await notion.pages.update({ page_id, properties: { 수량: { number: 2 } } })

// 삭제: 휴지통 이동 (영구 삭제 API 없음)
await notion.pages.update({ page_id, in_trash: true })   // 2026-03-11 정식, 구버전도 호환
// await notion.pages.update({ page_id, archived: true }) // deprecated
```

- `pages.move`로 다른 부모(`page_id` 또는 `data_source_id`)로 이동 가능
- 값 비우기: 배열형(`title`, `rich_text`, `people`, `relation`, `multi_select`, `files`)은 `[]`, nullable형(`number`, `date`, `select`, `url`, `status` 등)은 `null`, `checkbox`는 `false`

---

## 4. 속성 타입별 읽기 / 쓰기 포맷

### 읽기 (응답 shape)

| 타입 | 접근 경로 | 비고 |
|---|---|---|
| title | `p.title[].plain_text` | 배열을 `join("")` |
| rich_text | `p.rich_text[].plain_text` | 배열을 `join("")` |
| number | `p.number` | `number \| null` |
| select | `p.select?.name` | 객체 또는 null |
| multi_select | `p.multi_select[].name` | |
| status | `p.status?.name` | |
| date | `p.date?.start` / `.end` / `.time_zone` | 문자열 그대로 사용 (타임존 변환 금지) |
| checkbox | `p.checkbox` | boolean |
| url / email / phone_number | `p.url` 등 | `string \| null` |
| people | `p.people[].id` | 25명 초과 시 부분 응답 |
| relation | `p.relation[].id`, `p.has_more` | **25개 초과 시 잘림** |
| rollup | `p.rollup.type` 분기 | 읽기 전용 |
| formula | `p.formula.type` 분기 | 읽기 전용 |
| files | `p.files[].external.url` / `.file.url` | `file.url`은 **만료됨** |
| unique_id | `p.unique_id.number`, `.prefix` | 읽기 전용. `Q-12` 형태는 `prefix + "-" + number`로 조립 |
| created_time / last_edited_time | `p.created_time` | ISO 문자열, 읽기 전용 |

읽기 전용 타입: `button`, `created_by`, `created_time`, `last_edited_by`, `last_edited_time`, `formula`, `rollup`, `unique_id`

### 쓰기 (요청 shape)

```ts
{
  제목:   { title: [{ text: { content: "쇼핑몰 리뉴얼" } }] },
  비고:   { rich_text: [{ text: { content: "계약금 50%" } }] },
  단가:   { number: 1500000 },
  단위:   { select: { name: "식" } },
  태그:   { multi_select: [{ name: "긴급" }] },
  상태:   { status: { name: "발행" } },
  발행일: { date: { start: "2026-10-01" } },
  "부가세 적용": { checkbox: true },
  견적서: { relation: [{ id: "<page-id>" }] },
}
```

### 매핑 전략

`PageObjectResponse["properties"][string]`는 `type`으로 구분되는 판별 유니온이므로 `any` 없이 좁힐 수 있습니다. 속성별 추출 함수를 만들고, 필수 속성 누락은 그 자리에서 에러로 처리합니다.

```ts
type Props = PageObjectResponse["properties"]

export function readText(props: Props, name: string): string {
  const p = props[name]
  if (!p) throw new NotionSchemaError(name)
  if (p.type === "title")     return p.title.map((t) => t.plain_text).join("")
  if (p.type === "rich_text") return p.rich_text.map((t) => t.plain_text).join("")
  throw new NotionSchemaError(name)
}

export function readNumber(props: Props, name: string): number | null {
  const p = props[name]
  if (p?.type !== "number") throw new NotionSchemaError(name)
  return p.number
}

export function readDateStart(props: Props, name: string): string | null {
  const p = props[name]
  if (p?.type !== "date") throw new NotionSchemaError(name)
  return p.date?.start ?? null
}
```

Notion 원본 응답 전체를 Zod로 검증하는 것은 과도합니다. SDK가 이미 타입을 제공하므로, **매핑 결과(도메인 객체)를 Zod로 검증**하는 쪽이 비용 대비 효과가 좋습니다.

---

## 5. 이 프로젝트의 현황

- 구현 코드: 없음 (설계 문서만 존재)
- 존재하는 문서: `docs/PRD.md`, `docs/PRD_PROMPT.md`
- 미설치: `@notionhq/client`
- 환경변수 파일 없음 (`.gitignore`에 `.env*` 포함)
- `src/types/`, `src/hooks/` 디렉터리 아직 없음
- `next.config.ts`는 빈 설정 (`cacheComponents` off)

### PRD 보정이 필요한 지점

| PRD 위치 | 현재 기술 | 보정 |
|---|---|---|
| 7.2 노션 연동 방식 | 공식 SDK 또는 REST | **B안(공식 API + 내부 통합 토큰) 권장**. A안(페이지 공개)은 상태 기반 404, 비밀번호 요구사항(F-003, F-009) 구현 불가 |
| 6장 데이터 모델 | 견적서 DB / 품목 DB | 데이터 소스 단위 조회. env는 `DATABASE_ID`가 아니라 `DATA_SOURCE_ID` 저장 |
| 6장 견적번호 | 고유 번호 | `unique_id` 타입 (읽기 전용, `{ number, prefix }`) |
| 7.5 Rate Limit | 평균 초당 3회 | 현행: 일반 180 req/분, 비즈니스 이상 600 req/분. 워크스페이스 단위 쿼터도 존재 |
| 11장 품목 | 전체 조회 후 표시 | relation은 25개까지만 반환되므로 품목 DB를 `relation contains 견적서ID`로 역방향 쿼리 |
| 12장 미확정 2 | 스키마 초안 | `dataSources.retrieve`로 실제 속성명·타입 덤프 후 확정 |

---

## 6. Next.js 16 App Router 적용 방향

### 권장 구조

```
src/lib/notion/client.ts     ← import "server-only" + Client 싱글턴
src/lib/notion/property.ts   ← 속성 추출 함수 (타입 가드)
src/lib/notion/errors.ts     ← APIResponseError → 도메인 에러 매핑
src/lib/notion/quote.ts      ← 견적서 조회 + 품목 역방향 쿼리 + 매핑
src/lib/validations/quote.ts ← Zod (매핑 결과 검증)
src/lib/money.ts             ← 금액 계산 (순수 함수)
src/types/quote.ts           ← Quote, QuoteItem 도메인 타입
src/app/quotes/[id]/page.tsx ← 서버 컴포넌트
```

### 핵심 주의점

1. **`import "server-only"`**: Next.js가 제공하므로 별도 설치 불필요. 토큰을 쓰는 모듈 최상단에 선언
2. **환경변수는 서버 전용**: `NOTION_TOKEN`에 `NEXT_PUBLIC_` 접두사 금지
3. **`params`는 Promise**: `const { id } = await params`
4. **호출 위치**
   - 조회 렌더링: 서버 컴포넌트에서 직접 호출 (Route Handler 경유는 불필요한 왕복)
   - Server Action: 쓰기 작업에만 사용. 공개 엔드포인트이므로 내부에서 재인증·재검증
   - Route Handler: 웹훅 수신 등 외부 연동이 필요할 때만
5. **`any` 금지**: 캐스팅 대신 `isFullPage`, `p.type === "..."` 좁히기
6. **원본 객체를 클라이언트로 전달 금지**: 매핑된 평탄 객체만 props로 전달
7. **캐시**: SDK는 기본적으로 캐시하지 않음. PRD의 60초 캐시는 `unstable_cache(fn, keys, { revalidate: 60, tags: [...] })`로 구현 (`cacheComponents` off 유지)
8. **에러 매핑**

   | 에러 코드 | 처리 |
   |---|---|
   | `object_not_found`, `unauthorized`, `restricted_resource` | `notFound()` (대개 DB가 Integration에 미공유) |
   | `validation_error` | 오류 화면 + 서버 로그 (페이지 ID, 속성명) |
   | `rate_limited`(429), 500, 503, 529 | SDK 자동 재시도 후에도 실패 시 오류 화면 |

   SDK는 429/500/503/529를 기본 2회 재시도하므로 `retry: { maxRetries: 2 }` 설정이면 PRD의 "1~2회 재시도"를 충족합니다. `isNotionClientError(error)`로 `unknown`을 좁혀 사용합니다.

9. **로깅**: 토큰과 에러 원문을 화면에 노출하지 않음. 로그에는 페이지 ID와 에러 코드만 기록

---

## 7. 최소 예시 코드 (제안)

**`src/lib/notion/client.ts`**

```ts
import "server-only"
import { Client } from "@notionhq/client"

const token = process.env.NOTION_TOKEN
if (!token) throw new Error("NOTION_TOKEN 환경 변수가 없습니다")

export const notion = new Client({
  auth: token,
  notionVersion: "2025-09-03",
  retry: { maxRetries: 2 },
})

export const QUOTE_DS_ID = process.env.NOTION_QUOTE_DATA_SOURCE_ID ?? ""
export const ITEM_DS_ID = process.env.NOTION_ITEM_DATA_SOURCE_ID ?? ""
```

**`src/lib/notion/quote.ts`** (핵심 흐름)

```ts
import "server-only"
import { isFullPage, collectPaginatedAPI } from "@notionhq/client"
import { notion, ITEM_DS_ID } from "./client"

export async function fetchQuote(pageId: string) {
  const page = await notion.pages.retrieve({ page_id: pageId })
  if (!isFullPage(page)) throw new NotionSchemaError("page")

  // relation 25개 상한을 피하기 위해 품목은 역방향 쿼리로 전량 확보
  const itemPages = await collectPaginatedAPI(notion.dataSources.query, {
    data_source_id: ITEM_DS_ID,
    filter: { property: "견적서", relation: { contains: pageId } },
    sorts: [{ property: "순서", direction: "ascending" }],
    page_size: 100,
  })

  return mapQuote(page, itemPages.filter(isFullPage))
}
```

---

## 8. 사용자 준비 항목

1. Notion Integration 생성 후 Internal Integration Secret 확보 (`https://www.notion.so/profile/integrations`)
2. 견적서 DB와 품목 DB **모두** Integration에 공유 (relation 대상 DB도 포함)
3. 각 DB에서 `Copy data source ID`로 데이터 소스 ID 2개 확보
4. `.env.local` 작성
   ```
   NOTION_TOKEN=ntn_...
   NOTION_QUOTE_DATA_SOURCE_ID=...
   NOTION_ITEM_DATA_SOURCE_ID=...
   ```
5. `pnpm add @notionhq/client`
6. 실제 DB 속성명·타입 확정 (`dataSources.retrieve` 덤프). 상태 속성이 `status`인지 `select`인지에 따라 필터 문법이 다름
7. PRD 12장 미확정 1(연동 방식)을 B안으로 결정

---

## 9. 확인하지 못한 것

- 실제 Notion 워크스페이스에 접속하지 않았으므로 속성명·타입·데이터 소스 ID는 미확인. 예시 코드의 `"견적서"`, `"순서"` 등은 PRD 초안 기준 가정값
- 패키지를 설치하지 않아 타입 체크와 런타임 검증은 수행하지 않음 (SDK 타입은 5.27.0 배포본 기준으로 확인)

---

## 10. 출처

- [Versioning](https://developers.notion.com/reference/versioning)
- [2025-09-03 업그레이드 가이드](https://developers.notion.com/guides/get-started/upgrade-guide-2025-09-03)
- [2026-03-11 업그레이드 가이드](https://developers.notion.com/guides/get-started/upgrade-guide-2026-03-11)
- [Changelog](https://developers.notion.com/page/changelog)
- [Query a data source](https://developers.notion.com/reference/query-a-data-source)
- [Retrieve a data source](https://developers.notion.com/reference/retrieve-a-data-source)
- [Page property values](https://developers.notion.com/reference/page-property-values)
- [Request limits](https://developers.notion.com/reference/request-limits)
- [notion-sdk-js](https://github.com/makenotion/notion-sdk-js)
