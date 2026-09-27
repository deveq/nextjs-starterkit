#!/usr/bin/env bash
# Claude Code 훅 → Slack Incoming Webhook 알림
#
# stdin 으로 들어온 훅 페이로드(JSON)를 읽어 이벤트별 Block Kit 카드를 전송한다.
# 훅은 세션을 방해하면 안 되므로 모든 실패는 exit 0 으로 흡수하고,
# stdout 에는 아무것도 출력하지 않는다(UserPromptSubmit 의 stdout 은 모델 컨텍스트로 주입됨).
set -uo pipefail

payload="$(cat)"

[ -n "${SLACK_WEBHOOK_URL:-}" ] || exit 0
command -v jq >/dev/null 2>&1 || exit 0

MENTION="${SLACK_MENTION:-}"
MIN_SECONDS="${SLACK_NOTIFY_MIN_SECONDS:-60}"

pick() { printf '%s' "$payload" | jq -r "$1 // empty" 2>/dev/null; }

event="$(pick '.hook_event_name')"
session_id="$(pick '.session_id')"
transcript="$(pick '.transcript_path')"
cwd="$(pick '.cwd')"
[ -n "$cwd" ] || cwd="$PWD"

state_dir="${TMPDIR:-/tmp}/claude-slack"
state_file="$state_dir/${session_id:-unknown}.start"

# ── 턴 시작 시각만 기록하고 종료 ──────────────────────────────
if [ "$event" = "UserPromptSubmit" ]; then
  mkdir -p "$state_dir" 2>/dev/null && date +%s > "$state_file" 2>/dev/null
  exit 0
fi

# ── 공통 헬퍼 ────────────────────────────────────────────────

# 문자열을 지정 길이로 자른다 (한글 안전하게 jq 로 처리)
clip() {
  printf '%s' "${1:-}" | jq -Rrs --argjson n "${2:-300}" \
    'gsub("\n+";" ") | if length > $n then .[0:$n] + "…" else . end' 2>/dev/null
}

repo_name() { basename "$(git -C "$cwd" rev-parse --show-toplevel 2>/dev/null || printf '%s' "$cwd")"; }
git_branch() { git -C "$cwd" rev-parse --abbrev-ref HEAD 2>/dev/null; }
changed_count() { git -C "$cwd" status --porcelain 2>/dev/null | wc -l | tr -d ' '; }

# "3 files (+82 / -4)" 형태의 변경 요약
change_summary() {
  local stat count ins del files
  stat="$(git -C "$cwd" diff HEAD --shortstat 2>/dev/null)"
  count="$(changed_count)"
  [ "${count:-0}" -eq 0 ] && { printf '없음'; return; }
  files="$(printf '%s' "$stat" | sed -n 's/.*\([0-9][0-9]*\) file.*/\1/p')"
  ins="$(printf '%s' "$stat" | sed -n 's/.*\([0-9][0-9]*\) insertion.*/\1/p')"
  del="$(printf '%s' "$stat" | sed -n 's/.*\([0-9][0-9]*\) deletion.*/\1/p')"
  printf '%s files (+%s / -%s)' "${files:-$count}" "${ins:-0}" "${del:-0}"
}

# 경과 시간을 "2분 12초" 로 포맷 (상태 파일이 없으면 빈 문자열)
elapsed_seconds() {
  [ -f "$state_file" ] || return 0
  local start now
  start="$(cat "$state_file" 2>/dev/null)"
  case "$start" in ''|*[!0-9]*) return 0 ;; esac
  now="$(date +%s)"
  printf '%s' "$((now - start))"
}

format_duration() {
  local s="${1:-}"
  [ -n "$s" ] || return 0
  if [ "$s" -lt 60 ]; then printf '%d초' "$s"; else printf '%d분 %d초' "$((s / 60))" "$((s % 60))"; fi
}

# 트랜스크립트(JSONL)를 역순으로 훑어 가장 최근 tool_use 블록을 찾는다
last_tool_use() {
  [ -f "$transcript" ] || return 0
  tail -r "$transcript" 2>/dev/null | head -n 80 \
    | jq -c 'select(.type=="assistant") | .message.content[]? | select(.type=="tool_use") | {name, input}' 2>/dev/null \
    | head -n 1
}

# 가장 최근 어시스턴트 텍스트 블록
last_assistant_text() {
  [ -f "$transcript" ] || return 0
  tail -r "$transcript" 2>/dev/null | head -n 80 \
    | jq -r 'select(.type=="assistant") | .message.content[]? | select(.type=="text") | .text' 2>/dev/null \
    | head -n 1
}

# 도구 이름을 사람이 읽을 문구로
tool_label() {
  case "${1:-}" in
    Bash)              printf 'Bash 명령 실행' ;;
    Edit|Write)        printf '파일 수정/생성' ;;
    NotebookEdit)      printf '노트북 수정' ;;
    Read|Glob|Grep)    printf '파일 읽기/검색' ;;
    WebFetch|WebSearch) printf '웹 접근' ;;
    mcp__*)            printf 'MCP 도구 호출 (%s)' "$1" ;;
    '')                printf '알 수 없음' ;;
    *)                 printf '%s' "$1" ;;
  esac
}

# tool_input 에서 핵심 인자 하나를 뽑는다
tool_detail() {
  printf '%s' "${1:-}" | jq -r '
    .input as $i
    | ($i.command // $i.file_path // $i.url // $i.path // $i.pattern // $i.query // $i.prompt
       // ($i | to_entries | map("\(.key)=\(.value | tostring)") | join(", ")))
    // empty' 2>/dev/null
}

# ── Block Kit 카드 전송 ──────────────────────────────────────
# 사용법: send_card "<제목>" "<컨텍스트>" 라벨1 값1 라벨2 값2 ...
send_card() {
  local title="$1" ctx="$2"; shift 2
  local body
  body="$(jq -n \
    --arg title "$title" \
    --arg ctx "$ctx" \
    --arg mention "$MENTION" \
    --args '
      [range(0; ($ARGS.positional | length); 2)
        | { label: $ARGS.positional[.], value: $ARGS.positional[. + 1] }
        | select(.value != "")]
      as $fields
      | {
          text: $title,
          blocks: (
            [{ type: "header", text: { type: "plain_text", text: $title, emoji: true } }]
            + (if $mention == "" then [] else
                [{ type: "section", text: { type: "mrkdwn", text: $mention } }] end)
            + ($fields | map({
                type: "section",
                text: { type: "mrkdwn", text: ("*" + .label + "*\n" + .value) }
              }))
            + [{ type: "context", elements: [{ type: "mrkdwn", text: $ctx }] }]
          )
        }' "$@" 2>/dev/null)"
  [ -n "$body" ] || exit 0
  # SLACK_DRY_RUN=1 이면 전송 대신 stderr 로 페이로드만 출력한다 (테스트용)
  if [ -n "${SLACK_DRY_RUN:-}" ]; then
    printf '%s\n' "$body" >&2
    exit 0
  fi
  curl -sS -o /dev/null --max-time 5 -X POST \
    -H 'Content-Type: application/json' \
    --data "$body" "$SLACK_WEBHOOK_URL" 2>/dev/null
  exit 0
}

context_line() {
  local extra="${1:-}"
  local line
  line="$(repo_name) · $(git_branch)  |  $(date '+%H:%M') · 세션 ${session_id:0:7}"
  [ -n "$extra" ] && line="$line · $extra"
  printf '%s' "$line"
}

# ── 이벤트별 분기 ────────────────────────────────────────────
case "$event" in

  Notification)
    ntype="$(pick '.notification_type')"
    message="$(pick '.message')"

    if [ "$ntype" = "permission_prompt" ]; then
      tu="$(last_tool_use)"
      tname="$(printf '%s' "$tu" | jq -r '.name // empty' 2>/dev/null)"
      detail="$(tool_detail "$tu")"
      send_card "🔐 권한 요청 필요" "$(context_line)" \
        "작업" "$(tool_label "$tname")" \
        "내용" "$([ -n "$detail" ] && printf '`%s`' "$(clip "$detail" 400)")" \
        "상황" "$(clip "$(last_assistant_text)" 300)" \
        "알림" "$(clip "$message" 200)"
    fi

    if [ "$ntype" = "idle_prompt" ]; then
      send_card "⏳ 입력 대기 중" "$(context_line)" \
        "알림" "$(clip "$message" 200)" \
        "마지막 응답" "$(clip "$(last_assistant_text)" 300)"
    fi
    ;;

  Stop)
    elapsed="$(elapsed_seconds)"
    changed="$(changed_count)"
    # 짧고 변경도 없는 턴은 노이즈이므로 보내지 않는다
    if [ -n "$elapsed" ] && [ "$elapsed" -lt "$MIN_SECONDS" ] && [ "${changed:-0}" -eq 0 ]; then
      exit 0
    fi
    send_card "✅ 작업 완료" "$(context_line "$(format_duration "$elapsed")")" \
      "요약" "$(clip "$(pick '.last_assistant_message')" 300)" \
      "변경" "$(change_summary)"
    ;;

  SessionEnd)
    case "$(pick '.end_reason')" in
      clear)             reason='컨텍스트 초기화' ;;
      resume)            reason='세션 재개' ;;
      logout)            reason='로그아웃' ;;
      prompt_input_exit) reason='사용자 종료' ;;
      *)                 reason='기타' ;;
    esac
    rm -f "$state_file" 2>/dev/null
    send_card "🔚 세션 종료" "$(context_line)" \
      "사유" "$reason" \
      "변경" "$(change_summary)"
    ;;
esac

exit 0
