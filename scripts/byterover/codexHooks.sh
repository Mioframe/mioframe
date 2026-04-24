#!/bin/sh
set -u

event_name="${1:-}"

case "$event_name" in
  SessionStart|UserPromptSubmit|PostToolUse|Stop|RunSync) ;;
  *)
    printf '[brv-sync] unsupported event "%s".\n' "$event_name" >&2
    exit 0
    ;;
esac

project_root="${PWD}"
context_tree_path="${BRV_SYNC_CONTEXT_TREE_PATH:-$project_root/.brv/context-tree}"
state_path="${BRV_SYNC_STATE_PATH:-$project_root/.brv/codex-hook-state.env}"
lock_path="${BRV_SYNC_LOCK_PATH:-$project_root/.brv/codex-hook-sync.lock}"
log_path="${BRV_SYNC_LOG_PATH:-$project_root/.brv/codex-hook-sync.log}"
sync_branch="${BRV_SYNC_BRANCH:-main}"
sync_remote="${BRV_SYNC_REMOTE:-origin}"
sync_commit_message="${BRV_SYNC_AUTO_COMMIT_MESSAGE:-chore: sync brv context tree from codex session}"
prompt_sync_interval_ms="${BRV_SYNC_PROMPT_INTERVAL_MS:-300000}"
git_network_timeout_seconds="${BRV_SYNC_GIT_NETWORK_TIMEOUT_SECONDS:-15}"
auto_setup_enabled="${BRV_SYNC_AUTO_SETUP:-1}"
auto_setup_remote_url="${BRV_SYNC_REMOTE_URL:-}"
git_askpass_program="${BRV_SYNC_GIT_ASKPASS:-}"

log_info() {
  printf '[brv-sync] %s\n' "$1"
}

log_warn() {
  printf '[brv-sync] %s\n' "$1" >&2
}

ensure_state_parent() {
  mkdir -p "$(dirname "$state_path")"
}

ensure_runtime_parent() {
  ensure_state_parent
  mkdir -p "$(dirname "$lock_path")"
  mkdir -p "$(dirname "$log_path")"
}

load_state() {
  if [ -f "$state_path" ]; then
    # shellcheck disable=SC1090
    . "$state_path"
  fi
}

write_state() {
  ensure_state_parent
  {
    printf "last_session_branch=%s\n" "$(quote_shell_value "${last_session_branch:-}")"
    printf "last_session_start_epoch_ms=%s\n" "$(quote_shell_value "${last_session_start_epoch_ms:-}")"
    printf "last_sync_attempt_epoch_ms=%s\n" "$(quote_shell_value "${last_sync_attempt_epoch_ms:-}")"
    printf "last_sync_epoch_ms=%s\n" "$(quote_shell_value "${last_sync_epoch_ms:-}")"
    printf "last_sync_reason=%s\n" "$(quote_shell_value "${last_sync_reason:-}")"
    printf "last_sync_status=%s\n" "$(quote_shell_value "${last_sync_status:-}")"
    printf "last_sync_message=%s\n" "$(quote_shell_value "${last_sync_message:-}")"
  } >"$state_path"
}

quote_shell_value() {
  printf "'%s'" "$(printf '%s' "$1" | sed "s/'/'\\\\''/g")"
}

mark_sync_attempt() {
  last_sync_attempt_epoch_ms="$(date +%s000)"
  last_sync_reason="$1"
  last_sync_status="running"
  last_sync_message="sync in progress"
  write_state
}

mark_sync_result() {
  status="$1"
  message="$2"

  if [ "$status" = "ok" ]; then
    last_sync_epoch_ms="$(date +%s000)"
  fi

  last_sync_status="$status"
  last_sync_message="$message"
  write_state
}

append_log() {
  ensure_runtime_parent
  printf '%s %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$1" >>"$log_path"
}

run_git_logged() {
  operation="$1"
  shift

  output_file="$(mktemp)"
  if "$@" >"$output_file" 2>&1; then
    rm -f "$output_file"
    return 0
  fi

  command_output="$(tr '\n' ' ' <"$output_file" | sed 's/[[:space:]]\+/ /g; s/^ //; s/ $//')"
  rm -f "$output_file"

  if [ -n "$command_output" ]; then
    append_log "[git:$operation] $command_output"
  else
    append_log "[git:$operation] command failed without stderr output"
  fi

  return 1
}

timed_git_run() {
  if command -v timeout >/dev/null 2>&1; then
    if [ -n "$git_askpass_program" ]; then
      timeout \
        "$git_network_timeout_seconds" \
        env \
        GIT_TERMINAL_PROMPT=0 \
        GIT_ASKPASS="$git_askpass_program" \
        git \
        -c credential.interactive=never \
        -C "$context_tree_path" \
        "$@"
      return
    fi

    timeout \
      "$git_network_timeout_seconds" \
      env \
      GIT_TERMINAL_PROMPT=0 \
      git \
      -c credential.interactive=never \
      -C "$context_tree_path" \
      "$@"
    return
  fi

  git_run "$@"
}

git_run() {
  if [ -n "$git_askpass_program" ]; then
    env \
      GIT_TERMINAL_PROMPT=0 \
      GIT_ASKPASS="$git_askpass_program" \
      git \
      -c credential.interactive=never \
      -C "$context_tree_path" \
      "$@"
    return
  fi

  env \
    GIT_TERMINAL_PROMPT=0 \
    git \
    -c credential.interactive=never \
    -C "$context_tree_path" \
    "$@"
}

has_remote() {
  git_run remote get-url "$sync_remote" >/dev/null 2>&1
}

remote_url() {
  git_run remote get-url "$sync_remote" 2>/dev/null || true
}

has_remote_branch() {
  branch="$1"
  git_run show-ref --verify --quiet "refs/remotes/$sync_remote/$branch"
}

git_config_value() {
  repo_path="$1"
  key="$2"
  git -C "$repo_path" config --get "$key" 2>/dev/null || true
}

commit_user_name() {
  value="${BRV_SYNC_GIT_USER_NAME:-}"

  if [ -n "$value" ]; then
    printf '%s\n' "$value"
    return
  fi

  value="$(git_config_value "$context_tree_path" user.name)"
  if [ -n "$value" ]; then
    printf '%s\n' "$value"
    return
  fi

  value="$(git_config_value "$project_root" user.name)"
  if [ -n "$value" ]; then
    printf '%s\n' "$value"
    return
  fi

  printf 'Codex BRV Sync\n'
}

commit_user_email() {
  value="${BRV_SYNC_GIT_USER_EMAIL:-}"

  if [ -n "$value" ]; then
    printf '%s\n' "$value"
    return
  fi

  value="$(git_config_value "$context_tree_path" user.email)"
  if [ -n "$value" ]; then
    printf '%s\n' "$value"
    return
  fi

  value="$(git_config_value "$project_root" user.email)"
  if [ -n "$value" ]; then
    printf '%s\n' "$value"
    return
  fi

  printf 'codex-brv-sync@local\n'
}

current_branch() {
  branch="$(git_run symbolic-ref --quiet --short HEAD 2>/dev/null || true)"
  if [ -n "$branch" ]; then
    printf '%s\n' "$branch"
  else
    printf '%s\n' "$sync_branch"
  fi
}

is_dirty() {
  [ -n "$(git_run status --porcelain 2>/dev/null)" ]
}

abort_in_progress_state() {
  git_dir="$context_tree_path/.git"

  if [ -d "$git_dir/rebase-merge" ] || [ -d "$git_dir/rebase-apply" ]; then
    git_run rebase --abort >/dev/null 2>&1 || true
  fi

  if [ -f "$git_dir/MERGE_HEAD" ]; then
    git_run merge --abort >/dev/null 2>&1 || true
  fi

  if [ -f "$git_dir/CHERRY_PICK_HEAD" ]; then
    git_run cherry-pick --abort >/dev/null 2>&1 || true
  fi

  if [ -f "$git_dir/REVERT_HEAD" ]; then
    git_run revert --abort >/dev/null 2>&1 || true
  fi
}

auto_setup_remote() {
  if [ "$auto_setup_enabled" != "1" ] || [ -z "$auto_setup_remote_url" ]; then
    return 1
  fi

  git_run remote add "$sync_remote" "$auto_setup_remote_url" >/dev/null 2>&1 ||
    git_run remote set-url "$sync_remote" "$auto_setup_remote_url" >/dev/null 2>&1
}

auto_setup_repo() {
  if [ "$auto_setup_enabled" != "1" ] || [ -z "$auto_setup_remote_url" ] || [ ! -d "$context_tree_path" ]; then
    return 1
  fi

  git_run init -b "$sync_branch" >/dev/null 2>&1 || return 1
  auto_setup_remote || return 1
  timed_git_run fetch "$sync_remote" "$sync_branch" >/dev/null 2>&1 || return 0
  git_run checkout -B "$sync_branch" --track "$sync_remote/$sync_branch" >/dev/null 2>&1 || true
}

verify_context_tree_setup() {
  if [ ! -d "$context_tree_path" ]; then
    log_warn "context tree is missing at $context_tree_path; skipping sync"
    return 1
  fi

  if ! git_run rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    auto_setup_repo >/dev/null 2>&1 || true
  fi

  if ! git_run rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    log_warn "context tree at $context_tree_path is not a git repository; skipping sync"
    return 1
  fi

  if ! has_remote; then
    auto_setup_remote >/dev/null 2>&1 || true
  fi

  if ! has_remote; then
    log_warn "git remote \"$sync_remote\" is not configured for $context_tree_path; skipping sync"
    return 1
  fi

  configured_remote_url="$(remote_url)"
  if [ -n "$auto_setup_remote_url" ] && [ "$configured_remote_url" != "$auto_setup_remote_url" ]; then
    git_run remote set-url "$sync_remote" "$auto_setup_remote_url" >/dev/null 2>&1 || true
  fi

  return 0
}

commit_dirty_changes() {
  if ! is_dirty; then
    return 1
  fi

  git_run add -A || return 1

  if git_run diff --cached --quiet; then
    return 1
  fi

  git_run \
    -c "user.name=$(commit_user_name)" \
    -c "user.email=$(commit_user_email)" \
    commit -m "$sync_commit_message" >/dev/null 2>&1 || return 1
  return 0
}

sync_remote_state() {
  branch="$1"

  run_git_logged "fetch" timed_git_run fetch "$sync_remote" "$branch" || return 1

  if ! has_remote_branch "$branch"; then
    return 0
  fi

  if run_git_logged "rebase" git_run rebase "$sync_remote/$branch"; then
    return 0
  fi

  abort_in_progress_state
  run_git_logged \
    "merge" \
    git_run \
    -c "user.name=$(commit_user_name)" \
    -c "user.email=$(commit_user_email)" \
    merge -X ours --no-edit "$sync_remote/$branch"
}

push_branch() {
  branch="$1"
  run_git_logged "push" timed_git_run push -u "$sync_remote" "$branch"
}

acquire_lock() {
  ensure_runtime_parent

  if mkdir "$lock_path" 2>/dev/null; then
    printf '%s\n' "$$" >"$lock_path/pid"
    return 0
  fi

  if [ -f "$lock_path/pid" ]; then
    lock_pid="$(cat "$lock_path/pid" 2>/dev/null || true)"
    if [ -n "$lock_pid" ] && kill -0 "$lock_pid" 2>/dev/null; then
      return 1
    fi
  fi

  rm -rf "$lock_path" 2>/dev/null || true
  if mkdir "$lock_path" 2>/dev/null; then
    printf '%s\n' "$$" >"$lock_path/pid"
    return 0
  fi

  return 1
}

release_lock() {
  rm -rf "$lock_path" 2>/dev/null || true
}

handle_session_start() {
  branch="$(current_branch)"
  last_session_branch="$branch"
  last_session_start_epoch_ms="$(date +%s000)"
  write_state
}

handle_sync() {
  reason="$1"
  force="${2:-0}"
  branch="$(current_branch)"
  committed=0

  load_state
  mark_sync_attempt "$reason"
  append_log "[start] reason=$reason branch=$branch"

  if ! is_dirty && [ "$force" != "1" ]; then
    mark_sync_result "ok" "no local changes to sync"
    append_log "[skip] reason=$reason no local changes"
    return 0
  fi

  if commit_dirty_changes; then
    committed=1
  fi

  if ! sync_remote_state "$branch"; then
    abort_in_progress_state
    mark_sync_result "error" "failed to pull or rebase $sync_remote/$branch"
    append_log "[error] reason=$reason failed to pull/rebase $sync_remote/$branch"
    log_warn "failed to pull/rebase $sync_remote/$branch before push"
    return 0
  fi

  if ! push_branch "$branch"; then
    abort_in_progress_state
    mark_sync_result "error" "failed to push context tree to $sync_remote/$branch"
    append_log "[error] reason=$reason failed to push $sync_remote/$branch"
    log_warn "failed to push context tree to $sync_remote/$branch"
    return 0
  fi

  last_session_branch="$branch"
  mark_sync_result "ok" "synced to $sync_remote/$branch"
  append_log "[ok] reason=$reason synced to $sync_remote/$branch committed=$committed"

  if [ "$committed" = "1" ]; then
    log_info "published context tree changes on $reason"
  fi

  return 0
}

run_sync_once() {
  reason="$1"
  force="${2:-0}"

  if ! verify_context_tree_setup; then
    load_state
    mark_sync_result "error" "context tree is not ready for sync"
    append_log "[error] reason=$reason context tree is not ready"
    return 0
  fi

  if ! acquire_lock; then
    append_log "[skip] reason=$reason sync already running"
    return 0
  fi

  trap 'release_lock' EXIT INT TERM
  handle_sync "$reason" "$force"
}

handle_prompt_submit() {
  load_state

  if ! is_dirty; then
    return 0
  fi

  now_ms="$(date +%s000)"
  last_sync="${last_sync_epoch_ms:-0}"
  elapsed_ms=$((now_ms - last_sync))

  if [ "$elapsed_ms" -lt "$prompt_sync_interval_ms" ]; then
    return 0
  fi

  run_sync_once "UserPromptSubmit" 0
}

handle_post_tool_use() {
  load_state

  if ! is_dirty; then
    return 0
  fi

  now_ms="$(date +%s000)"
  last_sync="${last_sync_epoch_ms:-0}"
  elapsed_ms=$((now_ms - last_sync))

  if [ "$elapsed_ms" -lt "$prompt_sync_interval_ms" ]; then
    return 0
  fi

  run_sync_once "PostToolUse" 0
}

case "$event_name" in
  SessionStart)
    if ! verify_context_tree_setup; then
      exit 0
    fi
    handle_session_start
    ;;
  UserPromptSubmit)
    if ! verify_context_tree_setup; then
      exit 0
    fi
    handle_prompt_submit
    ;;
  PostToolUse)
    if ! verify_context_tree_setup; then
      exit 0
    fi
    handle_post_tool_use
    ;;
  Stop)
    if ! verify_context_tree_setup; then
      exit 0
    fi
    run_sync_once "Stop" 1
    ;;
  RunSync)
    run_sync_once "${2:-Manual}" "${3:-0}"
    ;;
esac
