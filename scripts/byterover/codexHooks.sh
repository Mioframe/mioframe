#!/bin/sh
set -u

event_name="${1:-}"

case "$event_name" in
  SessionStart|UserPromptSubmit|PostToolUse|Stop) ;;
  *)
    printf '[brv-sync] unsupported event "%s".\n' "$event_name" >&2
    exit 0
    ;;
esac

project_root="${PWD}"
context_tree_path="${BRV_SYNC_CONTEXT_TREE_PATH:-$project_root/.brv/context-tree}"
state_path="${BRV_SYNC_STATE_PATH:-$project_root/.brv/codex-hook-state.env}"
sync_branch="${BRV_SYNC_BRANCH:-main}"
sync_remote="${BRV_SYNC_REMOTE:-origin}"
sync_commit_message="${BRV_SYNC_AUTO_COMMIT_MESSAGE:-chore: sync brv context tree from codex session}"
prompt_sync_interval_ms="${BRV_SYNC_PROMPT_INTERVAL_MS:-300000}"
auto_setup_enabled="${BRV_SYNC_AUTO_SETUP:-1}"
auto_setup_remote_url="${BRV_SYNC_REMOTE_URL:-}"

log_info() {
  printf '[brv-sync] %s\n' "$1"
}

log_warn() {
  printf '[brv-sync] %s\n' "$1" >&2
}

ensure_state_parent() {
  mkdir -p "$(dirname "$state_path")"
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
    printf 'last_session_branch=%s\n' "${last_session_branch:-}"
    printf 'last_session_start_epoch_ms=%s\n' "${last_session_start_epoch_ms:-}"
    printf 'last_sync_epoch_ms=%s\n' "${last_sync_epoch_ms:-}"
    printf 'last_sync_reason=%s\n' "${last_sync_reason:-}"
  } >"$state_path"
}

git_output() {
  git -C "$context_tree_path" "$@" 2>&1
}

has_remote() {
  git -C "$context_tree_path" remote get-url "$sync_remote" >/dev/null 2>&1
}

has_upstream() {
  git -C "$context_tree_path" rev-parse --abbrev-ref --symbolic-full-name '@{u}' >/dev/null 2>&1
}

remote_url() {
  git -C "$context_tree_path" remote get-url "$sync_remote" 2>/dev/null || true
}

has_remote_branch() {
  branch="$1"
  git -C "$context_tree_path" show-ref --verify --quiet "refs/remotes/$sync_remote/$branch"
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
  branch="$(git -C "$context_tree_path" symbolic-ref --quiet --short HEAD 2>/dev/null || true)"
  if [ -n "$branch" ]; then
    printf '%s\n' "$branch"
  else
    printf '%s\n' "$sync_branch"
  fi
}

is_dirty() {
  [ -n "$(git -C "$context_tree_path" status --porcelain 2>/dev/null)" ]
}

abort_in_progress_state() {
  git_dir="$context_tree_path/.git"

  if [ -d "$git_dir/rebase-merge" ] || [ -d "$git_dir/rebase-apply" ]; then
    git -C "$context_tree_path" rebase --abort >/dev/null 2>&1 || true
  fi

  if [ -f "$git_dir/MERGE_HEAD" ]; then
    git -C "$context_tree_path" merge --abort >/dev/null 2>&1 || true
  fi

  if [ -f "$git_dir/CHERRY_PICK_HEAD" ]; then
    git -C "$context_tree_path" cherry-pick --abort >/dev/null 2>&1 || true
  fi

  if [ -f "$git_dir/REVERT_HEAD" ]; then
    git -C "$context_tree_path" revert --abort >/dev/null 2>&1 || true
  fi
}

auto_setup_remote() {
  if [ "$auto_setup_enabled" != "1" ] || [ -z "$auto_setup_remote_url" ]; then
    return 1
  fi

  git -C "$context_tree_path" remote add "$sync_remote" "$auto_setup_remote_url" >/dev/null 2>&1 ||
    git -C "$context_tree_path" remote set-url "$sync_remote" "$auto_setup_remote_url" >/dev/null 2>&1
}

auto_setup_repo() {
  if [ "$auto_setup_enabled" != "1" ] || [ -z "$auto_setup_remote_url" ] || [ ! -d "$context_tree_path" ]; then
    return 1
  fi

  git -C "$context_tree_path" init -b "$sync_branch" >/dev/null 2>&1 || return 1
  auto_setup_remote || return 1
  git -C "$context_tree_path" fetch "$sync_remote" "$sync_branch" >/dev/null 2>&1 || return 0
  git -C "$context_tree_path" checkout -B "$sync_branch" --track "$sync_remote/$sync_branch" >/dev/null 2>&1 ||
    true
}

verify_context_tree_setup() {
  if [ ! -d "$context_tree_path" ]; then
    log_warn "context tree is missing at $context_tree_path; skipping sync"
    return 1
  fi

  if ! git -C "$context_tree_path" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    auto_setup_repo >/dev/null 2>&1 || true
  fi

  if ! git -C "$context_tree_path" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
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
    git -C "$context_tree_path" remote set-url "$sync_remote" "$auto_setup_remote_url" >/dev/null 2>&1 ||
      true
  fi

  return 0
}

commit_dirty_changes() {
  if ! is_dirty; then
    return 1
  fi

  git -C "$context_tree_path" add -A || return 1

  if git -C "$context_tree_path" diff --cached --quiet; then
    return 1
  fi

  git -C "$context_tree_path" \
    -c "user.name=$(commit_user_name)" \
    -c "user.email=$(commit_user_email)" \
    commit -m "$sync_commit_message" >/dev/null 2>&1 || return 1
  return 0
}

sync_remote_state() {
  branch="$1"

  git -C "$context_tree_path" fetch "$sync_remote" "$branch" >/dev/null 2>&1 || return 1

  if ! has_remote_branch "$branch"; then
    return 0
  fi

  if git -C "$context_tree_path" rebase "$sync_remote/$branch" >/dev/null 2>&1; then
    return 0
  fi

  abort_in_progress_state
  git -C "$context_tree_path" \
    -c "user.name=$(commit_user_name)" \
    -c "user.email=$(commit_user_email)" \
    merge -X ours --no-edit "$sync_remote/$branch" >/dev/null 2>&1
}

push_branch() {
  branch="$1"

  git -C "$context_tree_path" push -u "$sync_remote" "$branch" >/dev/null 2>&1
}

handle_session_start() {
  branch="$(current_branch)"
  last_session_branch="$branch"
  last_session_start_epoch_ms="$(date +%s000)"
  write_state
  handle_sync "SessionStart" 1
}

handle_sync() {
  reason="$1"
  force="${2:-0}"
  branch="$(current_branch)"
  committed=0

  if ! is_dirty && [ "$force" != "1" ]; then
    return 0
  fi

  if commit_dirty_changes; then
    committed=1
  fi

  if ! sync_remote_state "$branch"; then
    abort_in_progress_state
    log_warn "failed to pull/rebase $sync_remote/$branch before push"
    return 0
  fi

  if ! push_branch "$branch"; then
    abort_in_progress_state
    log_warn "failed to push context tree to $sync_remote/$branch"
    return 0
  fi

  last_session_branch="$branch"
  last_sync_epoch_ms="$(date +%s000)"
  last_sync_reason="$reason"
  write_state

  if [ "$committed" = "1" ]; then
    log_info "published context tree changes on $reason"
  fi

  return 0
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

  handle_sync "UserPromptSubmit" 0
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

  handle_sync "PostToolUse" 0
}

if ! verify_context_tree_setup; then
  exit 0
fi

case "$event_name" in
  SessionStart)
    handle_session_start
    ;;
  UserPromptSubmit)
    handle_prompt_submit
    ;;
  PostToolUse)
    handle_post_tool_use
    ;;
  Stop)
    handle_sync "Stop" 1
    ;;
esac
