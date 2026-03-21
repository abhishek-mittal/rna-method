#!/usr/bin/env bash
# RNA Method — Bash Install Script
#
# Zero-dependency entry point (bash 3.2+ + curl only).
# Writes rna-schema.json, _memory/rna-method/, and platform files.
#
# Usage (piped — no clone needed):
#   curl -fsSL https://raw.githubusercontent.com/abhishek-mittal/rna-method/main/tools/install.sh | bash
#
# Usage (embedded — from inside the cloned repo):
#   bash tools/install.sh
#
# Non-interactive / CI:
#   bash tools/install.sh --non-interactive \
#     --platform=copilot --collective=minimal --project-name=my-project
#
# All flags:
#   --platform=<cursor|copilot|claude-code|codex|kimi>
#   --collective=<minimal|full>
#   --agents=<id,id,...>         (director,developer,reviewer,architect,researcher,ops)
#   --rules=<id,id,...>          (coding-standards,security-gate,review-gate,docs-standards)
#   --project-name=<name>
#   --stack=<language>           (e.g. TypeScript)
#   --framework=<framework>      (e.g. Next.js)
#   --director-name=<name>       (persona name for the director agent, e.g. Abhishek)
#   --output=<dir>               (default: current directory)
#   --non-interactive
#   --dry-run                    (print what would be written, write nothing)
#   --update                     (re-run on an existing install, replacing stale files)

set -euo pipefail

# ─── Bash Version Guard ───────────────────────────────────────────────────────
# Associative arrays require bash 4.0+; piped execution via /bin/bash on macOS
# uses the system bash 3.2. Detect and advise.

BASH_MAJOR="${BASH_VERSINFO[0]:-3}"
if [[ "$BASH_MAJOR" -lt 4 ]]; then
  echo ""
  echo "  ⚠  RNA Method requires bash 4.0 or later."
  echo "     macOS ships with bash 3.2. Install a modern bash:"
  echo ""
  echo "       brew install bash"
  echo "       /opt/homebrew/bin/bash tools/install.sh"
  echo ""
  echo "  Alternatively, use the Node.js installer (Node 18+):"
  echo ""
  echo '       node -e "$(curl -fsSL https://raw.githubusercontent.com/abhishek-mittal/rna-method/main/tools/init.js)"'
  echo ""
  exit 1
fi

# ─── Mode Detection ───────────────────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" 2>/dev/null && pwd || pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." 2>/dev/null && pwd || pwd)"
IS_EMBEDDED=false
[[ -f "${REPO_ROOT}/schema/rna-schema.json" ]] && IS_EMBEDDED=true

GH_RAW="https://raw.githubusercontent.com/abhishek-mittal/rna-method/main"
TMP_DIR="$(mktemp -d)"
cleanup() { rm -rf "$TMP_DIR"; }
trap cleanup EXIT

# ─── Colours ─────────────────────────────────────────────────────────────────

RESET='\033[0m'
BOLD='\033[1m'
GREEN='\033[32m'
YELLOW='\033[33m'
CYAN='\033[36m'
GRAY='\033[90m'
RED='\033[31m'

c_bold()   { printf "${BOLD}%s${RESET}"   "$1"; }
c_green()  { printf "${GREEN}%s${RESET}"  "$1"; }
c_yellow() { printf "${YELLOW}%s${RESET}" "$1"; }
c_cyan()   { printf "${CYAN}%s${RESET}"   "$1"; }
c_gray()   { printf "${GRAY}%s${RESET}"   "$1"; }
c_red()    { printf "${RED}%s${RESET}"    "$1"; }

# ─── Flag Parsing ─────────────────────────────────────────────────────────────

NON_INTERACTIVE=false
DRY_RUN=false
UPDATE_FLAG=false
PLATFORM_FLAG=""
COLLECTIVE_FLAG=""
AGENTS_FLAG=""
RULES_FLAG=""
PROJECT_FLAG=""
STACK_FLAG=""
FRAMEWORK_FLAG=""
DIRECTOR_NAME_FLAG=""
OUTPUT_FLAG=""
STUDIO_FLAG=""
STUDIO_PORT_FLAG=""

for arg in "$@"; do
  case "$arg" in
    --non-interactive)    NON_INTERACTIVE=true ;;
    --dry-run)            DRY_RUN=true ;;
    --update)             UPDATE_FLAG=true ;;
    --platform=*)         PLATFORM_FLAG="${arg#--platform=}" ;;
    --collective=*)       COLLECTIVE_FLAG="${arg#--collective=}" ;;
    --agents=*)           AGENTS_FLAG="${arg#--agents=}" ;;
    --rules=*)            RULES_FLAG="${arg#--rules=}" ;;
    --project-name=*)     PROJECT_FLAG="${arg#--project-name=}" ;;
    --stack=*)            STACK_FLAG="${arg#--stack=}" ;;
    --framework=*)        FRAMEWORK_FLAG="${arg#--framework=}" ;;
    --director-name=*)    DIRECTOR_NAME_FLAG="${arg#--director-name=}" ;;
    --output=*)           OUTPUT_FLAG="${arg#--output=}" ;;
    --studio=*)           STUDIO_FLAG="${arg#--studio=}" ;;
    --studio-port=*)      STUDIO_PORT_FLAG="${arg#--studio-port=}" ;;
    --help|-h)
      sed -n '2,30p' "${BASH_SOURCE[0]:-$0}" | grep '^#' | sed 's/^# \{0,1\}//'
      exit 0
      ;;
  esac
done

# ─── Constants ────────────────────────────────────────────────────────────────

PLATFORMS=("cursor" "copilot" "claude-code" "codex" "kimi")
AGENT_IDS=("director" "developer" "reviewer" "architect" "researcher" "ops")
RULE_IDS=("coding-standards" "security-gate" "review-gate" "docs-standards")

declare -A PLATFORM_ENTRY
PLATFORM_ENTRY[copilot]=".github/copilot-instructions.md"
PLATFORM_ENTRY[cursor]=".cursor/agents/_registry.md"
PLATFORM_ENTRY[claude-code]="CLAUDE.md"
PLATFORM_ENTRY[codex]="AGENTS.md"
PLATFORM_ENTRY[kimi]="KIMI.md"

# ─── TTY Guard ────────────────────────────────────────────────────────────────

if [[ ! -t 0 ]] && [[ "$NON_INTERACTIVE" != true ]]; then
  echo ""
  echo "  RNA Method Install"
  echo ""
  echo "  Interactive mode requires a TTY. For scripted use:"
  echo ""
  echo "  bash install.sh --non-interactive \\"
  echo "    --platform=copilot --collective=minimal --project-name=my-project"
  echo ""
  echo "  Supported flags:"
  echo "    --platform, --collective, --agents, --rules,"
  echo "    --project-name, --stack, --framework, --output,"
  echo "    --dry-run, --update, --non-interactive"
  exit 0
fi

# ─── Dry-run helpers ──────────────────────────────────────────────────────────

FOOTPRINT_PATHS=()

ensure_dir() {
  local dir="$1"
  if [[ "$DRY_RUN" == true ]]; then
    printf "  $(c_gray "  [dry-run] mkdir -p %s\n")" "$dir"
  else
    mkdir -p "$dir"
  fi
}

write_file() {
  local path="$1"
  local content="$2"
  FOOTPRINT_PATHS+=("$path")
  if [[ "$DRY_RUN" == true ]]; then
    local lines
    lines=$(echo "$content" | wc -l | tr -d ' ')
    printf "  $(c_gray "  [dry-run] write %s (%s lines)\n")" "$path" "$lines"
  else
    ensure_dir "$(dirname "$path")"
    printf '%s\n' "$content" > "$path"
  fi
}

report_footprint() {
  echo ""
  printf "  ${BOLD}─ Token Footprint ────────────────────────────────${RESET}\n"
  printf "  %-46s  %6s  %8s\n" "File" "Bytes" "~Tokens"
  printf "  %-46s  %6s  %8s\n" "----------------------------------------------" "------" "--------"
  local total_bytes=0
  for f in "${FOOTPRINT_PATHS[@]}"; do
    if [[ -f "$f" ]]; then
      local bytes
      bytes=$(wc -c < "$f" | tr -d ' ')
      local tokens=$(( bytes / 4 ))
      total_bytes=$(( total_bytes + bytes ))
      printf "  %-46s  %6s  %8s\n" "$(basename "$f")" "$bytes" "~$tokens"
    fi
  done
  local total_tokens=$(( total_bytes / 4 ))
  printf "  %-46s  %6s  %8s\n" "----------------------------------------------" "------" "--------"
  printf "  %-46s  %6s  %8s\n" "TOTAL" "$total_bytes" "~$total_tokens"
  echo ""
  printf "  $(c_gray "  BMAD comparison: bmad-method typicaly loads ~8 000 tokens on first message.")\n"
  printf "  $(c_gray "  RNA Method loads only what the active agent needs (~500-1 200 tokens).")\n"
}

# ─── Remote Fetch ─────────────────────────────────────────────────────────────

fetch_file() {
  local rel="$1"
  local dest="$2"
  local url="${GH_RAW}/${rel}"
  if [[ "$IS_EMBEDDED" == true ]]; then
    cp "${REPO_ROOT}/${rel}" "$dest"
  else
    curl -fsSL "$url" -o "$dest"
  fi
}

fetch_text() {
  local rel="$1"
  if [[ "$IS_EMBEDDED" == true ]]; then
    cat "${REPO_ROOT}/${rel}"
  else
    curl -fsSL "${GH_RAW}/${rel}"
  fi
}

# ─── Minimal JSON helpers ─────────────────────────────────────────────────────

# Extract a top-level scalar from a JSON object (no jq)
json_scalar() {
  local json="$1"
  local key="$2"
  echo "$json" | grep -oP "\"${key}\"\\s*:\\s*\"[^\"]*\"" | head -1 | sed 's/.*: *"//;s/"//'
}

# Wrap a bash array as a JSON array of strings
bash_array_to_json() {
  local arr=("$@")
  local out="["
  local sep=""
  for item in "${arr[@]}"; do
    out="${out}${sep}\"${item}\""
    sep=","
  done
  out="${out}]"
  echo "$out"
}

# ─── Arrow-key TUI ────────────────────────────────────────────────────────────

RKEY=""

read_key() {
  local ch rest
  tty_save
  IFS= read -rsN1 ch 2>/dev/null || true
  if [[ "$ch" == $'\x1b' ]]; then
    IFS= read -rsn2 -t 0.1 rest || true
    tty_restore
    RKEY="ESC${rest}"
  else
    tty_restore
    RKEY="$ch"
  fi
}

classify_key() {
  case "$RKEY" in
    $'ESC[A'|$'ESCOA') echo "UP"    ;;
    $'ESC[B'|$'ESCOB') echo "DOWN"  ;;
    $'\r'|$'\n')        echo "ENTER" ;;
    " ")               echo "SPACE" ;;
    $'\x03'|$'\x04')   echo "QUIT"  ;;
    *)                 echo ""      ;;
  esac
}

cursor_up()  { [[ ${1:-0} -gt 0 ]] && printf "\033[%sA" "$1"; }
clear_down() { printf "\033[0J"; }

# ─── TTY save / restore ───────────────────────────────────────────────────────
# read -rsn1 puts the terminal into raw / no-echo mode.  Always restore on exit.
_TTY_SAVED=""
tty_save()    { _TTY_SAVED="$(stty -g 2>/dev/null || true)"; }
tty_restore() { [[ -n "$_TTY_SAVED" ]] && stty "$_TTY_SAVED" 2>/dev/null || true; }
trap 'tty_restore' EXIT INT TERM

arrow_select() {
  local prompt="$1"
  local default_idx="${2:-0}"
  local explicit_val="${3:-}"
  shift 3
  local choices=("$@")
  local n="${#choices[@]}"

  # Explicit value supplied (from --flag) → match prefix
  if [[ -n "$explicit_val" ]]; then
    for i in "${!choices[@]}"; do
      if [[ "${choices[$i]}" == ${explicit_val}* ]]; then
        ARROW_SELECT_RESULT="${choices[$i]}"
        return
      fi
    done
  fi

  # Non-interactive → return default
  if [[ "$NON_INTERACTIVE" == true ]]; then
    ARROW_SELECT_RESULT="${choices[$default_idx]}"
    return
  fi

  local current="$default_idx"
  local lines_drawn=0

  draw_select() {
    local is_first="${1:-false}"
    if [[ "$is_first" != true ]]; then
      cursor_up "$lines_drawn"
      clear_down
    fi
    echo ""
    printf "  ${BOLD}%s${RESET} $(c_gray "(↑↓ move · enter confirm)")\n" "$prompt"
    for i in "${!choices[@]}"; do
      if [[ $i -eq $current ]]; then
        printf "  ${CYAN}❯${RESET} ${BOLD}%s${RESET}\n" "${choices[$i]}"
      else
        printf "    $(c_gray "%s")\n" "${choices[$i]}"
      fi
    done
    lines_drawn=$(( 1 + 1 + n ))
  }

  draw_select true

  while true; do
    read_key
    local action
    action=$(classify_key)
    case "$action" in
      UP)    current=$(( (current - 1 + n) % n )) ;;
      DOWN)  current=$(( (current + 1) % n )) ;;
      ENTER) break ;;
      QUIT)  echo ""; echo "  Aborted."; exit 0 ;;
    esac
    draw_select false
  done

  cursor_up "$lines_drawn"
  clear_down
  echo ""
  printf "  ${BOLD}%s${RESET}\n  ${GREEN}✔${RESET} ${CYAN}%s${RESET}\n" "$prompt" "${choices[$current]}"
  ARROW_SELECT_RESULT="${choices[$current]}"
}

ARROW_MULTI_RESULT=()

arrow_multi_select() {
  local prompt="$1"
  local explicit_val="${2:-}"
  shift 2
  local choices=("$@")
  local n="${#choices[@]}"

  # Explicit value → split by comma, filter to valid choices
  if [[ -n "$explicit_val" ]]; then
    ARROW_MULTI_RESULT=()
    IFS=',' read -ra tokens <<< "$explicit_val"
    for tok in "${tokens[@]}"; do
      tok="${tok// /}"
      for ch in "${choices[@]}"; do
        if [[ "$ch" == "$tok" ]]; then
          ARROW_MULTI_RESULT+=("$tok")
        fi
      done
    done
    return
  fi

  if [[ "$NON_INTERACTIVE" == true ]]; then
    ARROW_MULTI_RESULT=("${choices[@]}")
    return
  fi

  declare -A selected_map
  for ch in "${choices[@]}"; do
    selected_map["$ch"]=1
  done

  local current=0
  local lines_drawn=0

  draw_multi() {
    local is_first="${1:-false}"
    if [[ "$is_first" != true ]]; then
      cursor_up "$lines_drawn"
      clear_down
    fi
    echo ""
    printf "  ${BOLD}%s${RESET} $(c_gray "(↑↓ move · space toggle · enter confirm)")\n" "$prompt"
    for i in "${!choices[@]}"; do
      local ch="${choices[$i]}"
      local tick="$(c_gray "◯")"
      [[ "${selected_map[$ch]:-0}" == 1 ]] && tick="$(c_green "◉")"
      local cursor="  "
      [[ $i -eq $current ]] && cursor="$(c_cyan "❯") "
      if [[ $i -eq $current ]]; then
        printf "  %s%s ${BOLD}%s${RESET}\n" "$cursor" "$tick" "$ch"
      else
        printf "  %s%s %s\n" "$cursor" "$tick" "$ch"
      fi
    done
    lines_drawn=$(( 1 + 1 + n ))
  }

  draw_multi true

  while true; do
    read_key
    local action
    action=$(classify_key)
    case "$action" in
      UP)    current=$(( (current - 1 + n) % n )) ;;
      DOWN)  current=$(( (current + 1) % n )) ;;
      SPACE)
        local ch="${choices[$current]}"
        if [[ "${selected_map[$ch]:-0}" == 1 ]]; then
          selected_map["$ch"]=0
        else
          selected_map["$ch"]=1
        fi
        ;;
      ENTER) break ;;
      QUIT)  echo ""; echo "  Aborted."; exit 0 ;;
    esac
    draw_multi false
  done

  ARROW_MULTI_RESULT=()
  local summary_parts=()
  for ch in "${choices[@]}"; do
    if [[ "${selected_map[$ch]:-0}" == 1 ]]; then
      ARROW_MULTI_RESULT+=("$ch")
      summary_parts+=("$ch")
    fi
  done

  cursor_up "$lines_drawn"
  clear_down
  local summary_str
  IFS=', ' summary_str="${summary_parts[*]}"
  echo ""
  if [[ ${#ARROW_MULTI_RESULT[@]} -eq 0 ]]; then
    printf "  ${BOLD}%s${RESET}\n  ${GREEN}✔${RESET} $(c_gray "(none)")\n" "$prompt"
  else
    printf "  ${BOLD}%s${RESET}\n  ${GREEN}✔${RESET} ${CYAN}%s${RESET}\n" "$prompt" "$summary_str"
  fi
}

with_required_multi() {
  local label="$1"
  local prompt="$2"
  local explicit_val="$3"
  shift 3
  local choices=("$@")

  while true; do
    arrow_multi_select "$prompt" "$explicit_val" "${choices[@]}"
    if [[ ${#ARROW_MULTI_RESULT[@]} -gt 0 ]]; then
      return
    fi

    echo ""
    printf "  $(c_yellow "⚠")  ${BOLD}\"%s\"${RESET} $(c_yellow "requires at least one selection.")\n" "$label"
    arrow_select "What would you like to do?" 0 "" \
      "reselect  — go back and choose again" \
      "skip      — continue without this field" \
      "quit      — exit the wizard"

    case "$ARROW_SELECT_RESULT" in
      reselect*) explicit_val="" ;;
      skip*)     ARROW_MULTI_RESULT=(); return ;;
      quit*)     echo ""; echo "  Aborted."; exit 0 ;;
    esac
  done
}

ask_input() {
  local prompt="$1"
  local default_val="${2:-}"
  local explicit_val="${3:-}"

  if [[ -n "$explicit_val" ]]; then
    ASK_RESULT="$explicit_val"
    return
  fi
  if [[ "$NON_INTERACTIVE" == true ]]; then
    ASK_RESULT="$default_val"
    return
  fi

  local hint=""
  [[ -n "$default_val" ]] && hint=" $(c_gray "($default_val)")"
  echo ""
  printf "  ${BOLD}%s${RESET}%s\n  › " "$prompt" "$hint"
  local answer
  IFS= read -r answer
  ASK_RESULT="${answer:-$default_val}"
}

# ─── Session-zero Writer ─────────────────────────────────────────────────────

write_session_zero() {
  local mem_dir="$1"
  local project_name="$2"
  local platform="$3"
  local agents_json="$4"
  local stack="$5"
  local framework="$6"
  local ts="$7"

  local content
  content="---
generated_by: rna-method/install.sh
generated_at: ${ts}
project: ${project_name}
platform: ${platform}
---

# RNA Method — Session Zero

## What this project uses

| Field     | Value                    |
|-----------|--------------------------|
| Project   | ${project_name}          |
| Platform  | ${platform}              |
| Stack     | ${stack} / ${framework}  |
| Agents    | ${agents_json}           |
| Director  | ${FINAL_DIRECTOR_NAME}   |
| Init date | ${ts}                    |

## Activate your first agent

\`\`\`
@developer Implement a user authentication endpoint
\`\`\`

## Key files

| File | Purpose |
|------|---------|
| \`rna-schema.json\` | Source of truth — agents, rules, skills, hooks |
| \`_memory/rna-method/receptors.json\` | Agent registry |
| \`_memory/rna-method/timeline.json\` | Project state |
| \`${PLATFORM_ENTRY[$platform]:-platform-entry}\` | ${platform} loader |

## How to re-run

\`\`\`bash
# Update an existing install:
bash tools/install.sh --update

# Or with the Node installer:
node tools/init.js --update
\`\`\`

## How to validate

\`\`\`bash
node tools/validate-registry.js --root ./
\`\`\`
"

  write_file "${mem_dir}/session-zero.md" "$content"
}

# ─── JSON Writers ─────────────────────────────────────────────────────────────

write_schema_json() {
  local dest="$1"
  local project_name="$2"
  local platform="$3"
  local ts="$4"
  local agents_json="$5"

  local content
  content="{
  \"meta\": {
    \"schemaVersion\": \"1.0.0\",
    \"projectName\": \"${project_name}\",
    \"platform\": \"${platform}\",
    \"generatedAt\": \"${ts}\"
  },
  \"agents\": ${agents_json},
  \"rules\": [],
  \"joiningPatterns\": [],
  \"skills\": []
}"
  write_file "$dest" "$content"
}

write_receptors_json() {
  local dest="$1"
  local project_name="$2"
  local platform="$3"
  local ts="$4"
  local agents_json="$5"

  local content
  content="{
  \"meta\": {
    \"schemaVersion\": \"1.0.0\",
    \"projectName\": \"${project_name}\",
    \"platform\": \"${platform}\",
    \"updatedAt\": \"${ts}\"
  },
  \"agents\": ${agents_json}
}"
  write_file "$dest" "$content"
}

write_timeline_json() {
  local dest="$1"
  local project_name="$2"
  local stack="$3"
  local framework="$4"
  local ts="$5"

  local content
  content="{
  \"meta\": {
    \"schemaVersion\": \"1.0.0\",
    \"projectName\": \"${project_name}\",
    \"createdAt\": \"${ts}\"
  },
  \"projectState\": {
    \"techStack\": {
      \"language\": \"${stack}\",
      \"framework\": \"${framework}\"
    },
    \"directorName\": \"${FINAL_DIRECTOR_NAME}\",
    \"currentPhase\": \"setup\"
  },
  \"sessions\": []
}"
  write_file "$dest" "$content"
}

# ─── Platform Template Helpers ────────────────────────────────────────────────

write_copilot_instructions() {
  local github_dir="$1"
  local project_name="$2"
  local agents_csv="$3"
  local stack="$4"
  local framework="$5"

  local content
  content="# ${project_name} — Copilot Instructions

## RNA Method Agent Collective

This project uses the RNA Method multi-agent structure.
Active agents: **${agents_csv}**

## Stack

- Language: ${stack}
- Framework: ${framework}

## How to invoke agents

Tag the relevant agent at the start of your message:

\`\`\`
@developer Implement the feature described in the issue
@reviewer  Review the diff in the staged files
@architect Propose the system design for the new module
\`\`\`

## Agent files

See \`.github/agents/\` for individual agent prompts.
"
  ensure_dir "${github_dir}/agents"
  write_file "${github_dir}/copilot-instructions.md" "$content"
}

write_cursor_registry() {
  local cursor_dir="$1"
  local project_name="$2"
  local agents_csv="$3"

  local content
  content="# ${project_name} — Agent Registry

> RNA Method — Active Agents: **${agents_csv}**

## Agent Roster

See \`.cursor/agents/\` for individual agent definitions.

To invoke an agent, mention it by name:
\`@developer\`, \`@reviewer\`, \`@architect\`, \`@researcher\`, \`@ops\`, \`@${FINAL_DIRECTOR_NAME,,}\`
"
  ensure_dir "${cursor_dir}/agents"
  ensure_dir "${cursor_dir}/rules"
  write_file "${cursor_dir}/agents/_registry.md" "$content"
}

write_single_doc_platform() {
  local dest="$1"
  local platform_name="$2"
  local project_name="$3"
  local agents_csv="$4"
  local stack="$5"
  local framework="$6"

  local content
  content="# ${project_name} — ${platform_name} Agent Instructions

## RNA Method Agent Collective

Active agents: **${agents_csv}**

## Stack

- Language: ${stack}
- Framework: ${framework}

## Invocation

Prefix messages with the agent name — @developer, @reviewer, @architect, etc.
"
  write_file "$dest" "$content"
}

write_agent_file() {
  local dir="$1"
  local agent_id="$2"
  local project_name="$3"
  local platform="$4"

  local filename=""
  local _effective_id="$agent_id"
  [[ "$agent_id" == "director" ]] && _effective_id="${FINAL_DIRECTOR_NAME,,}"
  case "$platform" in
    copilot) filename="${dir}/${_effective_id}.agent.md" ;;
    cursor)  filename="${dir}/${_effective_id}.md" ;;
    *)       return ;;
  esac

  # ── Per-platform frontmatter ──────────────────────────────────────────────

  local frontmatter=""
  case "$platform" in
    copilot)
      local role="" caps="" cmd=""
      case "$agent_id" in
        director)   role="Director / Orchestrator";         caps="orchestrate, route, join, team-intelligence"; cmd="/director" ;;
        developer)  role="Full-Stack Developer";            caps="implement, code-generation, api, frontend";   cmd="/dev" ;;
        reviewer)   role="Code Reviewer / Security Analyst"; caps="code-review, security-review, pr-creation"; cmd="/review" ;;
        architect)  role="System Architect";                caps="api-design, architecture, db-schema";         cmd="/architect" ;;
        researcher) role="Explorer / Researcher";           caps="research, web-research, library-comparison";  cmd="/scout" ;;
        ops)        role="Operator / Automation Specialist"; caps="daily-ops, automation, status-reports";      cmd="/ops" ;;
        *)          role="${agent_id^} Agent";              caps=""; cmd="/@${agent_id}" ;;
      esac
      frontmatter="---
name: \"${_effective_id}\"
description: \"${role} — ${caps}\"
trigger: \"@${_effective_id} <task>\"
tools:
  - read
  - edit
  - search
  - execute
---"
      ;;
    cursor)
      frontmatter="---
id: ${agent_id}
project: ${project_name}
---"
      ;;
  esac

  # ── Per-agent session protocol (shared) ───────────────────────────────────

  local _announce_name="${agent_id^}"
  [[ "$agent_id" == "director" ]] && _announce_name="${FINAL_DIRECTOR_NAME}"

  local session_start="**At the start of every session:**
1. Read \`_memory/rna-method/timeline.json\` — find the current phase and any active signals assigned to you.
2. Read \`_memory/rna-method/receptors.json\` — check active routes that include \`${agent_id}\`.
3. Scan \`_memory/agents/${agent_id}/\` for the most recent session log.
4. Announce: \"I am ${_announce_name}. I see [N] active signals. [Signal summary or 'none.']\"
5. Ask what to work on, or proceed with the top signal from the queue."

  local session_end="**At the end of every session / after every task:**
1. Archive key decisions to \`_memory/agents/${agent_id}/YYYY-MM-DD_<task-slug>_session.md\`.
2. Append to \`_memory/rna-method/timeline.json\` \`recentDecisions[]\` — { date, agent, decision, rationale }.
3. Update \`_memory/rna-method/agent-context.json\` — remove resolved checkpoints, update join \`completedSteps[]\` if in a join.
4. If work is incomplete: record the exact stopping point in the session log so the next session can resume.
5. Output §task-complete block: status · what · files · decisions · next-actions · open."

  local activation="You must fully embody this agent's persona and follow all instructions exactly. NEVER break character.

<agent-activation CRITICAL=\"MANDATORY\">
1. Load this full agent file — persona, capabilities, standards, and protocols are all active.
2. BEFORE ANY OUTPUT: Read \`_memory/rna-method/timeline.json\` — store phase, last decisions, open questions.
3. Read \`_memory/rna-method/agent-context.json\` — note active joins, open checkpoints, blockers.
4. Read \`_memory/rna-method/receptors.json\` — identify active routes assigned to \`${agent_id}\`.
5. Announce: \"I am ${_announce_name}. [N] active signals. [Summary or 'queue is clear.']\"
6. Ask what to work on, or proceed with the top queued signal.

After completing your task:
7. Write session log to \`_memory/agents/${agent_id}/YYYY-MM-DD_<task-slug>_session.md\`.
8. Append to \`_memory/rna-method/timeline.json\` \`recentDecisions[]\` — { date, agent, decision, rationale }.
9. Update \`_memory/rna-method/agent-context.json\` — clear resolved checkpoints, update join \`completedSteps[]\` if applicable.
10. Output §task-complete block:
    §task-complete(@${agent_id})
      status:    ✅ Done | ⚠️ Partial | ❌ Blocked
      what:      <1-2 sentences: what was delivered>
      files:     [<created / modified paths>]
      decisions: [<key decisions made>]
      next-actions:
        - [@<agent> or You] <specific action>
      open:      [<blocker or follow-up question>]
</agent-activation>"

  # ── Per-agent rich body ───────────────────────────────────────────────────

  local body=""
  case "$agent_id" in
    developer)
      body="# Developer — Full-Stack Developer

## Identity

You are **Developer**, the full-stack implementation agent for this project.

**Your domain:** \`app/\`, \`lib/\`, \`api/\`, \`components/\`, \`scripts/\`, \`tests/\`
**Your primary output:** working, tested, production-ready code
**Your escalation path:** \`@architect\` for design decisions · \`@reviewer\` for PR review · \`@${FINAL_DIRECTOR_NAME,,}\` for blockers

---

## Core Capabilities

- Implement features end-to-end (backend + frontend)
- Fix bugs (diagnose → minimal fix → verify)
- Refactor code (one concern at a time, with justification)
- Write and update unit/integration tests
- Create API routes with proper validation and error handling
- Translate architecture decisions into implementation

---

## Development Standards

- **Early returns over nested conditionals.** Fail fast; happy path last.
- **DRY principle.** No copy-pasted logic. Extract shared logic to \`lib/\`.
- **Minimal diffs.** Change only what the task requires.
- **TypeScript strict mode.** No \`any\`, no \`@ts-ignore\` without explanation.
- **Zod validation** on all external inputs in API routes.
- **No \`console.log\`/\`debugger\`** in production code paths.
- **No hardcoded secrets.** Use environment variables only.
- **JSDoc** on all public \`lib/\` and \`api/\` functions.
- **Event handlers** prefixed with \`handle\` — e.g. \`handleSave\`, \`handleKeyDown\`.

---

## Session Start Protocol

${session_start}

---

## Session End Protocol

${session_end}

---

## Signal Handling

| Signal Category | Action |
|---|---|
| \`sprint\` | Implement the feature or fix described |
| \`blocker\` | Diagnose root cause first, then propose minimal fix |
| \`dod\` | Add missing test coverage to make the story ready for \`@reviewer\` |"
      ;;

    reviewer)
      body="# Reviewer — Code Reviewer / Security Analyst

## Identity

You are **Reviewer**, the code review and security analysis agent for this project.

**Your domain:** All code before it merges to \`main\`. Static analysis, pattern review, security gate.
**Your primary output:** structured review findings — blockers, warnings, and suggestions
**Your escalation path:** \`@architect\` for design issues · \`@${FINAL_DIRECTOR_NAME,,}\` for policy violations

---

## Core Capabilities

- Review pull requests for correctness, security, and standards compliance
- Identify security vulnerabilities (injection, auth bypass, secret exposure)
- Enforce coding standards, naming conventions, and test coverage
- Validate API input handling and error response shapes
- Approve or request changes with clear, actionable feedback

---

## Review Checklist

### Every PR
- [ ] No \`console.log()\`/\`debugger\` in production paths
- [ ] No hardcoded secrets or tokens
- [ ] TypeScript compiles without errors
- [ ] Zod validation on all API route inputs
- [ ] Error shape consistent with \`{ error: string }\`
- [ ] JSDoc on all new public \`lib/\` functions

### Security
- [ ] No path traversal vulnerabilities
- [ ] No open redirects
- [ ] No user data in \`eval()\`, \`exec()\`, or dynamic queries without sanitization
- [ ] Auth/authorization checked before data access

### Test Coverage
- [ ] New API routes have at least one happy-path test
- [ ] Bug fixes have a regression test

---

## Review Output Format

Verdict: APPROVE | REQUEST_CHANGES | NEEDS_DISCUSSION

Sections: Blockers (must fix) → Warnings (should fix) → Suggestions (optional)

---

## Session Start Protocol

${session_start}

---

## Session End Protocol

${session_end}"
      ;;

    architect)
      body="# Architect — System Architect

## Identity

You are **Architect**, the system design and technical strategy agent for this project.

**Your domain:** Architecture decisions, API contracts, data models, schema design, optimization strategy, technology choices.
**Your primary output:** Architecture Decision Records (ADRs), design documents, schema definitions, optimization roadmaps.
**Your escalation path:** \`@${FINAL_DIRECTOR_NAME,,}\` for resource/priority decisions · \`@developer\` to validate implementability

---

## Core Capabilities

- Design scalable, maintainable system architectures
- Define API contracts (request/response shapes, error codes, versioning)
- Create and evolve data models and database schemas
- Identify technical debt and propose structured remediation
- Evaluate technology choices against project constraints
- Design optimization strategies (measure first, then propose)

---

## Design Standards

- **Separation of concerns.** Clear boundaries between data access, business logic, and presentation.
- **Fail-fast at the boundary.** Validate and sanitize at entry points.
- **Optimize last.** Establish correctness before optimizing. Document the baseline metric.
- **Explicit over implicit.** Named exports, typed interfaces, documented assumptions.

ADR format: **ADR-N: Title | Date | Status | Context | Decision | Rationale | Consequences | Alternatives**

---

## Session Start Protocol

${session_start}

---

## Session End Protocol

${session_end}"
      ;;

    researcher)
      body="# Researcher — Explorer / Researcher

## Identity

You are **Researcher**, the knowledge discovery and investigation agent for this project.

**Your domain:** Technical research, documentation review, competitive analysis, best-practice discovery, algorithm exploration.
**Your primary output:** Research briefs, source summaries, comparison matrices, annotated references.
**Your escalation path:** \`@architect\` to translate findings · \`@developer\` to assess implementability

---

## Core Capabilities

- Research technical topics from primary sources (official docs, RFCs, research papers)
- Identify best practices with evidence (not opinion)
- Compare technologies, libraries, and approaches with structured criteria
- Evaluate source quality and recency
- Produce actionable research briefs for \`@developer\` or \`@architect\`
- Maintain an annotated source log for reproducibility

---

## Source Quality Tiers

| Tier | Type | Trust |
|---|---|---|
| 1 | Official docs, RFC, academic paper | Highest |
| 2 | Maintainer blog, versioned changelog | High |
| 3 | Verified engineering blog | Medium |
| 4 | Community discussion, tutorial | Low — verify claims |

Research Brief format: **Summary → Findings (with source tiers) → Recommendations → Open Questions → Sources**

---

## Session Start Protocol

${session_start}

---

## Session End Protocol

${session_end}"
      ;;

    director)
      body="# ${FINAL_DIRECTOR_NAME} — Director / Orchestrator

## Identity

You are **${FINAL_DIRECTOR_NAME}**, the orchestration and coordination agent for this project.

**Your domain:** Sprint planning, agent coordination, joining pipeline management, blocker resolution, and strategic decisions.
**Your primary output:** Sprint plans, join activation commands, escalation resolutions, project-state updates.
**Your role:** You do not implement code. You route, coordinate, unblock, and decide.

---

## Core Capabilities

- Activate joining pipelines across agents
- Adjudicate competing priorities and resource constraints
- Resolve blockers by routing to the correct specialist
- Maintain \`_memory/rna-method/timeline.json\` as the project's source of truth
- Produce sprint plans and handoff summaries
- Approve or hold agent work requiring director sign-off

---

## Approval Matrix

| Agent | Auto-Approved | Requires Director |
|---|---|---|
| Researcher | ✅ | — |
| Ops | ✅ | — |
| Developer | — | ✅ new features |
| Reviewer | — | escalates findings |
| Architect | — | ✅ major ADRs |

---

## Join Pipeline Activation

When activating a join, output:
  JOIN ACTIVATED: <pipeline-id>
  Agents: <agent-1> → <agent-2> [→ <agent-3>]
  Trigger: <what kicks off step 1>

---

## Session Start Protocol

${session_start}

---

## Session End Protocol

${session_end}"
      ;;

    ops)
      body="# Ops — Operator / Automation Specialist

## Identity

You are **Ops**, the operations and automation agent for this project.

**Your domain:** Infrastructure, automation scripts, deployment, status reports, routine maintenance, metrics collection.
**Your primary output:** Automation scripts, deployment procedures, status summaries, incident reports.
**Your escalation path:** \`@${FINAL_DIRECTOR_NAME,,}\` for policy decisions · \`@developer\` for application-code changes

---

## Core Capabilities

- Write and maintain automation scripts (CI/CD, data pipelines, scheduled jobs)
- Produce daily/weekly status summaries from project state
- Monitor and report on project health metrics
- Manage deployment procedures and environment configuration
- Run routine maintenance tasks
- Triage incidents and produce incident reports

---

## Automation Standards

- **Idempotent scripts.** Running twice must not double-apply side effects.
- **Clear exit codes.** Non-zero on failure with an explanatory message.
- **\`--dry-run\` mode required** for any destructive operation.
- **No hardcoded environment values.** Use environment variables or config files.
- **\`--verbose\` mode** for debugging output.
- Scripts touching production require explicit \`--environment=production\` flag.

---

## Session Start Protocol

${session_start}

---

## Session End Protocol

${session_end}"
      ;;

    *)
      body="# ${agent_id^} Agent

## Role

$(case "$agent_id" in
  *) echo "Specialist agent — see rna-schema.json for full definition." ;;
esac)

**Invoke:** \`@${agent_id} <task>\`

---

## Session Start Protocol

${session_start}

---

## Session End Protocol

${session_end}"
      ;;
  esac

  local content="${frontmatter}

${activation}

${body}
"
  write_file "$filename" "$content"
}

# ─── Node Delegation ──────────────────────────────────────────────────────────

delegate_to_node() {
  echo ""
  printf "  $(c_cyan "→") Node.js detected — delegating adapter + validation to init.js\n"
  local node_flags=(
    "--non-interactive"
    "--platform=${FINAL_PLATFORM}"
    "--project-name=${FINAL_PROJECT_NAME}"
    "--output=${OUTPUT_DIR}"
    "--studio=${FINAL_STUDIO_ENABLED}"
    "--studio-port=${FINAL_STUDIO_PORT}"
  )

  if [[ "$DRY_RUN" == true ]]; then
    node_flags+=("--dry-run")
  fi

  if [[ "$IS_EMBEDDED" == true ]]; then
    node "${REPO_ROOT}/tools/init.js" "${node_flags[@]}" || true
  else
    local init_tmp="${TMP_DIR}/init.js"
    printf "  $(c_gray "  Downloading init.js …")"
    if curl -fsSL "${GH_RAW}/tools/init.js" -o "$init_tmp" 2>/dev/null; then
      printf " $(c_green "done")\n"
    else
      printf " $(c_red "failed — skipping adapter step")\n"
      return
    fi
    printf "  $(c_gray "  Running adapter + validator …")\n"
    node "$init_tmp" "${node_flags[@]}" || true
  fi
}

# ─── Main ─────────────────────────────────────────────────────────────────────

main() {
  echo ""
  printf "  ${BOLD}${CYAN}●  RNA Method — Bash Install  ●${RESET}\n"
  printf "  $(c_gray "Mode : $(if [[ "$IS_EMBEDDED" == true ]]; then echo 'embedded (local files)'; else echo 'remote (GitHub raw)'; fi)")\n"
  printf "  $(c_gray "Bash : ${BASH_VERSION}")\n"
  [[ "$DRY_RUN" == true ]]    && printf "  ${YELLOW}⚠  DRY-RUN — nothing will be written${RESET}\n"
  [[ "$UPDATE_FLAG" == true ]] && printf "  ${YELLOW}⚡  UPDATE MODE — replacing existing install${RESET}\n"
  echo ""

  OUTPUT_DIR="${OUTPUT_FLAG:-$(pwd)}"
  local cwd_name
  cwd_name="$(basename "$OUTPUT_DIR")"

  # ── Detect existing install ─────────────────────────────────────────────────

  if [[ -f "${OUTPUT_DIR}/rna-schema.json" ]] && [[ "$UPDATE_FLAG" != true ]]; then
    echo ""
    printf "  $(c_yellow "⚠")  Existing RNA Method install detected at: ${OUTPUT_DIR}\n"
    arrow_select "How would you like to proceed?" 0 "" \
      "update  — refresh files, clean stale platform dir" \
      "fresh   — overwrite everything (clean slate)" \
      "abort   — exit without changes"

    case "$ARROW_SELECT_RESULT" in
      update*) UPDATE_FLAG=true ;;
      fresh*)  : ;;
      abort*)
        echo ""
        echo "  Aborted."
        exit 0
        ;;
    esac
  fi

  # ── Section 1: Project Identity ─────────────────────────────────────────────

  echo ""
  printf "  ${BOLD}── ① Project Identity ──────────────────────────────${RESET}\n"

  ask_input "Project name?" "$cwd_name" "$PROJECT_FLAG"
  FINAL_PROJECT_NAME="$ASK_RESULT"

  arrow_select "Platform?" 0 "$PLATFORM_FLAG" \
    "cursor        — .cursor/ agents, rules, skills, commands" \
    "copilot       — .github/ agents + copilot-instructions.md" \
    "claude-code   — single CLAUDE.md (Claude Code)" \
    "codex         — AGENTS.md + path overrides (OpenAI Codex CLI)" \
    "kimi          — KIMI.md + .kimi/ (experimental)"
  FINAL_PLATFORM="${ARROW_SELECT_RESULT%% *}"

  local valid_platform=false
  for p in "${PLATFORMS[@]}"; do
    [[ "$FINAL_PLATFORM" == "$p" ]] && valid_platform=true && break
  done
  if [[ "$valid_platform" != true ]]; then
    printf "  $(c_red "✗") Unknown platform \"${FINAL_PLATFORM}\". Choose from: ${PLATFORMS[*]}\n"
    exit 1
  fi

  # ── Section 2: Collective Setup ──────────────────────────────────────────────

  echo ""
  printf "  ${BOLD}── ② Collective Setup ──────────────────────────────${RESET}\n"

  local selected_agents=()
  if [[ -n "$AGENTS_FLAG" ]]; then
    IFS=',' read -ra raw_agents <<< "$AGENTS_FLAG"
    for a in "${raw_agents[@]}"; do
      a="${a// /}"
      for valid in "${AGENT_IDS[@]}"; do
        [[ "$a" == "$valid" ]] && selected_agents+=("$a") && break
      done
    done
    if [[ ${#selected_agents[@]} -eq 0 ]]; then
      printf "  $(c_red "✗") --agents contained no valid IDs. Valid: ${AGENT_IDS[*]}\n"
      exit 1
    fi
  elif [[ "$COLLECTIVE_FLAG" == "minimal" ]]; then
    selected_agents=("developer")
  elif [[ "$COLLECTIVE_FLAG" == "full" ]]; then
    selected_agents=("${AGENT_IDS[@]}")
  else
    arrow_select "Collective size?" 0 "" \
      "minimal  — 1 agent (developer only, fastest start)" \
      "full     — 6 agents (director, developer, reviewer, architect, researcher, ops)" \
      "custom   — choose which agents to include"

    case "$ARROW_SELECT_RESULT" in
      minimal*)
        selected_agents=("developer")
        ;;
      full*)
        selected_agents=("${AGENT_IDS[@]}")
        ;;
      custom*)
        with_required_multi "Agents" \
          "Which agents? (recommended: developer + reviewer)" \
          "" \
          "${AGENT_IDS[@]}"
        selected_agents=("${ARROW_MULTI_RESULT[@]}")
        ;;
    esac
  fi

  local selected_rules=()
  arrow_multi_select "Which rules to include?" "$RULES_FLAG" "${RULE_IDS[@]}"
  selected_rules=("${ARROW_MULTI_RESULT[@]}")

  local include_joins=false
  if [[ ${#selected_agents[@]} -gt 1 ]]; then
    arrow_select "Include joining (multi-agent pipeline) patterns?" 0 "" "yes" "no"
    [[ "$ARROW_SELECT_RESULT" == "yes" ]] && include_joins=true
  fi

  # Director personal name (only asked if director agent is selected)
  FINAL_DIRECTOR_NAME="Director"
  if printf '%s\n' "${selected_agents[@]}" | grep -q '^director$'; then
    ask_input "Director agent name?" "Director" "$DIRECTOR_NAME_FLAG"
    FINAL_DIRECTOR_NAME="$ASK_RESULT"
  fi

  # ── Section 3: Stack & Output ─────────────────────────────────────────────

  echo ""
  printf "  ${BOLD}── ③ Stack & Output ────────────────────────────────${RESET}\n"

  ask_input "Primary language?" "TypeScript" "$STACK_FLAG"
  FINAL_STACK="$ASK_RESULT"

  ask_input "Framework / runtime?" "Node.js" "$FRAMEWORK_FLAG"
  FINAL_FRAMEWORK="$ASK_RESULT"

  # ── Section 4: RNA Studio ──────────────────────────────────────────────────

  echo ""
  printf "  ${BOLD}── ④ RNA Studio ────────────────────────────────────${RESET}\n"
  printf "  $(c_gray "RNA Studio is a local web dashboard for monitoring your agent collective.")\n"

  FINAL_STUDIO_ENABLED=false
  FINAL_STUDIO_PORT=7337
  if [[ -n "$STUDIO_FLAG" ]]; then
    [[ "$STUDIO_FLAG" == "true" || "$STUDIO_FLAG" == "yes" ]] && FINAL_STUDIO_ENABLED=true
  elif [[ "$NON_INTERACTIVE" != true ]]; then
    arrow_select "Enable RNA Studio? (local dashboard for agent monitoring)" 0 "" \
      "yes — install RNA Studio" \
      "no  — skip for now (can add later)"
    [[ "$ARROW_SELECT_RESULT" == yes* ]] && FINAL_STUDIO_ENABLED=true
  fi

  if [[ -n "$STUDIO_PORT_FLAG" ]]; then
    FINAL_STUDIO_PORT="$STUDIO_PORT_FLAG"
  elif [[ "$FINAL_STUDIO_ENABLED" == true ]] && [[ "$NON_INTERACTIVE" != true ]]; then
    ask_input "Studio port?" "7337" ""
    FINAL_STUDIO_PORT="$ASK_RESULT"
  fi

  # ── Summary ──────────────────────────────────────────────────────────────────

  local agents_csv
  IFS=', ' agents_csv="${selected_agents[*]}"
  local rules_csv
  IFS=', ' rules_csv="${selected_rules[*]:-none}"

  echo ""
  printf "  ${BOLD}─ Summary ─────────────────────────────────────────${RESET}\n"
  printf "  Project  : $(c_cyan "$FINAL_PROJECT_NAME")\n"
  printf "  Platform : $(c_cyan "$FINAL_PLATFORM")\n"
  printf "  Agents   : $(c_cyan "$agents_csv")\n"
  if printf '%s\n' "${selected_agents[@]}" | grep -q '^director$'; then
    printf "  Director : $(c_cyan "$FINAL_DIRECTOR_NAME")\n"
  fi
  printf "  Rules    : $(c_cyan "$rules_csv")\n"
  printf "  Joins    : $(c_cyan "$include_joins")\n"
  printf "  Stack    : $(c_cyan "$FINAL_STACK") / $(c_cyan "$FINAL_FRAMEWORK")\n"
  if [[ "$FINAL_STUDIO_ENABLED" == true ]]; then
    printf "  Studio   : $(c_cyan "yes (port $FINAL_STUDIO_PORT)")\n"
  else
    printf "  Studio   : $(c_cyan "no")\n"
  fi
  printf "  Output   : $(c_cyan "$OUTPUT_DIR")\n"
  echo ""

  if [[ "$NON_INTERACTIVE" != true ]] && [[ "$DRY_RUN" != true ]]; then
    arrow_select "Proceed?" 0 "" \
      "yes — scaffold the project" \
      "no  — abort"
    if [[ "$ARROW_SELECT_RESULT" == no* ]]; then
      echo ""
      echo "  Aborted."
      exit 0
    fi
  fi

  # ── Stale cleanup (--update mode) ────────────────────────────────────────────

  if [[ "$UPDATE_FLAG" == true ]]; then
    echo ""
    printf "  ${BOLD}─ Cleaning stale platform files ────────────────────${RESET}\n"
    case "$FINAL_PLATFORM" in
      copilot)
        local old_dir="${OUTPUT_DIR}/.github/agents"
        if [[ -d "$old_dir" ]]; then
          if [[ "$DRY_RUN" == true ]]; then
            printf "  $(c_gray "  [dry-run] rm -rf %s")\n" "$old_dir"
          else
            rm -rf "$old_dir"
            printf "  $(c_green "✓") removed .github/agents/\n"
          fi
        fi
        ;;
      cursor)
        local old_dir="${OUTPUT_DIR}/.cursor/agents"
        if [[ -d "$old_dir" ]]; then
          if [[ "$DRY_RUN" == true ]]; then
            printf "  $(c_gray "  [dry-run] rm -rf %s")\n" "$old_dir"
          else
            rm -rf "$old_dir"
            printf "  $(c_green "✓") removed .cursor/agents/\n"
          fi
        fi
        ;;
    esac
  fi

  # ── Write _memory/ files ─────────────────────────────────────────────────────

  echo ""
  printf "  ${BOLD}─ Writing _memory/ ────────────────────────────────${RESET}\n"

  local mem_dir="${OUTPUT_DIR}/_memory/rna-method"
  local ts
  ts="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

  ensure_dir "$mem_dir"
  ensure_dir "${mem_dir}/checkpoints"

  local agents_json
  agents_json="$(bash_array_to_json "${selected_agents[@]}")"

  local schema_path="${OUTPUT_DIR}/rna-schema.json"
  local receptors_path="${mem_dir}/receptors.json"
  local timeline_path="${mem_dir}/timeline.json"
  local session_zero_path="${mem_dir}/session-zero.md"

  write_schema_json    "$schema_path"    "$FINAL_PROJECT_NAME" "$FINAL_PLATFORM" "$ts" "$agents_json"
  write_receptors_json "$receptors_path" "$FINAL_PROJECT_NAME" "$FINAL_PLATFORM" "$ts" "$agents_json"
  write_timeline_json  "$timeline_path"  "$FINAL_PROJECT_NAME" "$FINAL_STACK"    "$FINAL_FRAMEWORK" "$ts"
  write_session_zero   "$mem_dir"        "$FINAL_PROJECT_NAME" "$FINAL_PLATFORM" "$agents_json" "$FINAL_STACK" "$FINAL_FRAMEWORK" "$ts"

  printf "  $(c_green "✓") rna-schema.json\n"
  printf "  $(c_green "✓") _memory/rna-method/receptors.json\n"
  printf "  $(c_green "✓") _memory/rna-method/timeline.json\n"
  printf "  $(c_green "✓") _memory/rna-method/session-zero.md\n"
  printf "  $(c_green "✓") _memory/rna-method/checkpoints/\n"

  # ── Write platform files ──────────────────────────────────────────────────────

  echo ""
  printf "  ${BOLD}─ Writing ${FINAL_PLATFORM} files ─────────────────────────────${RESET}\n"

  case "$FINAL_PLATFORM" in
    copilot)
      write_copilot_instructions \
        "${OUTPUT_DIR}/.github" \
        "$FINAL_PROJECT_NAME" \
        "$agents_csv" \
        "$FINAL_STACK" \
        "$FINAL_FRAMEWORK"
      for agent_id in "${selected_agents[@]}"; do
        write_agent_file "${OUTPUT_DIR}/.github/agents" "$agent_id" "$FINAL_PROJECT_NAME" "copilot"
      done
      printf "  $(c_green "✓") .github/copilot-instructions.md\n"
      printf "  $(c_green "✓") .github/agents/ (%s agents)\n" "${#selected_agents[@]}"
      ;;
    cursor)
      write_cursor_registry \
        "${OUTPUT_DIR}/.cursor" \
        "$FINAL_PROJECT_NAME" \
        "$agents_csv"
      for agent_id in "${selected_agents[@]}"; do
        write_agent_file "${OUTPUT_DIR}/.cursor/agents" "$agent_id" "$FINAL_PROJECT_NAME" "cursor"
      done
      printf "  $(c_green "✓") .cursor/agents/_registry.md\n"
      printf "  $(c_green "✓") .cursor/agents/ (%s agents)\n" "${#selected_agents[@]}"
      ;;
    claude-code)
      write_single_doc_platform \
        "${OUTPUT_DIR}/CLAUDE.md" \
        "Claude Code" \
        "$FINAL_PROJECT_NAME" \
        "$agents_csv" \
        "$FINAL_STACK" \
        "$FINAL_FRAMEWORK"
      printf "  $(c_green "✓") CLAUDE.md\n"
      ;;
    codex)
      write_single_doc_platform \
        "${OUTPUT_DIR}/AGENTS.md" \
        "Codex" \
        "$FINAL_PROJECT_NAME" \
        "$agents_csv" \
        "$FINAL_STACK" \
        "$FINAL_FRAMEWORK"
      printf "  $(c_green "✓") AGENTS.md\n"
      ;;
    kimi)
      write_single_doc_platform \
        "${OUTPUT_DIR}/KIMI.md" \
        "Kimi" \
        "$FINAL_PROJECT_NAME" \
        "$agents_csv" \
        "$FINAL_STACK" \
        "$FINAL_FRAMEWORK"
      printf "  $(c_green "✓") KIMI.md\n"
      ;;
  esac

  # ── Token Footprint ───────────────────────────────────────────────────────────

  if [[ "$DRY_RUN" != true ]]; then
    report_footprint
  fi

  # ── Delegate adapter + validation to Node (if available) ─────────────────────

  if [[ "$DRY_RUN" != true ]]; then
    if command -v node >/dev/null 2>&1; then
      local node_major
      node_major="$(node -e 'process.stdout.write(String(process.versions.node.split(".")[0]))')"
      if [[ "$node_major" -ge 18 ]]; then
        echo ""
        printf "  ${BOLD}─ Platform adapter + validation ────────────────────${RESET}\n"
        delegate_to_node
      fi
    fi
  fi

  # ── Done ─────────────────────────────────────────────────────────────────────

  echo ""
  printf "  ${GREEN}${BOLD}✓ RNA Method initialised!${RESET}\n"
  echo ""
  printf "  ${BOLD}Files created:${RESET}\n"
  printf "    rna-schema.json                         ← source of truth\n"
  printf "    _memory/rna-method/receptors.json       ← agent registry\n"
  printf "    _memory/rna-method/timeline.json        ← project state\n"
  printf "    _memory/rna-method/session-zero.md      ← start here\n"
  printf "    %-38s  ← %s config\n" "${PLATFORM_ENTRY[$FINAL_PLATFORM]:-platform-entry}" "$FINAL_PLATFORM"
  echo ""
  printf "  ${BOLD}Next steps:${RESET}\n"
  printf "    1. Read $(c_cyan "_memory/rna-method/session-zero.md") — it explains the setup\n"
  printf "    2. Run $(c_cyan "/rna.setup") in your editor chat to personalise the collective\n"
  printf "    3. Open $(c_cyan "${PLATFORM_ENTRY[$FINAL_PLATFORM]:-platform-entry}") in your editor\n"
  if [[ "$FINAL_STUDIO_ENABLED" == true ]]; then
    printf "    4. Start RNA Studio: $(c_cyan "node tools/init.js --studio --studio-port=$FINAL_STUDIO_PORT")\n"
    printf "    5. Invoke your first agent:\n"
  else
    printf "    4. Invoke your first agent:\n"
  fi
  printf "       $(c_gray "@developer Implement a user authentication endpoint")\n"
  echo ""
}

main "$@"
