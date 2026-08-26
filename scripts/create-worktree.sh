#!/usr/bin/env bash
# create-worktree.sh — Per-task Git worktree isolation per D-3, S-2 O-1
# Usage: ./scripts/create-worktree.sh <project-slug> <agent> <task-id> <task-title>
# Example: ./scripts/create-worktree.sh demo test-hermes 2 "Test worktree"
# Creates /workspaces/<project>/worktrees/<agent>-TASK-<id> on branch task/TASK-<id>/<slug>
set -euo pipefail

PROJECT_SLUG="${1:?project-slug required}"
AGENT="${2:?agent required}"
TASK_ID_RAW="${3:?task-id required}"
TASK_TITLE="${4:-task}"

# Normalize TASK_ID: accept TASK-2 or 2
TASK_NUM="${TASK_ID_RAW#TASK-}"
TASK_NUM="${TASK_NUM#task-}"

# Slugify title: lowercase, non-alphanum -> -, trim to 30 chars
SLUG=$(echo "$TASK_TITLE" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9]+/-/g; s/^-+//; s/-+$//' | cut -c1-30 | sed -E 's/-$//')
if [ -z "$SLUG" ]; then SLUG="task"; fi

BRANCH="task/TASK-${TASK_NUM}/${SLUG}"
WORKSPACE_BASE="/workspaces"
# Allow override for local test without /workspaces perms (fallback to repo-relative workspaces)
if [ ! -w "$WORKSPACE_BASE" ] && [ -w "/tmp" ]; then
  if [ -d "/workspaces" ]; then
    WORKSPACE_BASE="/workspaces"
  else
    # For CI/local without root, use ./workspaces if exists, else /tmp/workspaces
    if [ -d "./workspaces" ] || mkdir -p "./workspaces" 2>/dev/null; then
      WORKSPACE_BASE="$(pwd)/workspaces"
    else
      WORKSPACE_BASE="/tmp/workspaces"
    fi
  fi
fi

MAIN_DIR="${WORKSPACE_BASE}/${PROJECT_SLUG}/main"
WORKTREE_DIR="${WORKSPACE_BASE}/${PROJECT_SLUG}/worktrees/${AGENT}-TASK-${TASK_NUM}"

if [ ! -d "${MAIN_DIR}/.git" ] && [ ! -d "${MAIN_DIR}" ]; then
  echo "main repo not found at ${MAIN_DIR}, cloning placeholder from origin main for demo" >&2
  mkdir -p "$(dirname "${MAIN_DIR}")"
  if [ -d ".git" ]; then
    git clone --branch main . "${MAIN_DIR}" 2>&1 | head -n 20 || cp -r . "${MAIN_DIR}"
  else
    mkdir -p "${MAIN_DIR}" && git -C "${MAIN_DIR}" init -q && git -C "${MAIN_DIR}" commit --allow-empty -m "init" 2>&1 | head
  fi
fi

if [ ! -d "${MAIN_DIR}/.git" ]; then
  # If main is not a git repo (e.g., plain directory), init
  if [ ! -d "${MAIN_DIR}" ]; then mkdir -p "${MAIN_DIR}"; fi
  if [ ! -d "${MAIN_DIR}/.git" ]; then
    git -C "${MAIN_DIR}" init -q 2>&1 | head
    git -C "${MAIN_DIR}" config user.email "paperclip@example.com" 2>&1 | head
    git -C "${MAIN_DIR}" config user.name "paperclip" 2>&1 | head
    touch "${MAIN_DIR}/README.md" && git -C "${MAIN_DIR}" add README.md 2>&1 | head
    git -C "${MAIN_DIR}" commit -m "init main" -q 2>&1 | head || true
  fi
fi

mkdir -p "$(dirname "${WORKTREE_DIR}")"

if git -C "${MAIN_DIR}" worktree list | grep -q "${WORKTREE_DIR}"; then
  echo "worktree already exists at ${WORKTREE_DIR} for ${BRANCH}" >&2
  echo "${WORKTREE_DIR}"
  exit 0
fi

if git -C "${MAIN_DIR}" show-ref --verify --quiet "refs/heads/${BRANCH}"; then
  echo "branch ${BRANCH} exists, adding worktree without -b" >&2
  git -C "${MAIN_DIR}" worktree add "${WORKTREE_DIR}" "${BRANCH}" 2>&1 | head
else
  git -C "${MAIN_DIR}" worktree add -b "${BRANCH}" "${WORKTREE_DIR}" main 2>&1 | head
fi

# Verify same path visible inside containers (bind mount check)
echo "created worktree ${WORKTREE_DIR} on branch ${BRANCH}" >&2
echo "${WORKTREE_DIR}"

# Log structured JSON per §37 for O-2 correlation
TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%SZ)
cat <<JSON >&2
{"timestamp":"${TIMESTAMP}","component":"paperclip","agent_id":"${AGENT}","task_id":"TASK-${TASK_NUM}","run_id":"RUN-${TASK_NUM}","event":"specialist_started","specialist":"hermes","workspace":"${WORKTREE_DIR}","branch":"${BRANCH}"}
JSON
