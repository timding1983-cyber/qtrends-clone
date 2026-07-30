#!/bin/bash
set -euo pipefail

WORKDIR=~/.openclaw/workspace/qtrends-clone
cd "$WORKDIR"

# Ensure git repo is initialized
if ! git rev-parse --git-dir >/dev/null 2>&1; then
    git init
    git remote add origin https://github.com/timding1983-cyber/qtrends.git
    # Create an initial commit if the repo is empty
    if git rev-parse --verify HEAD >/dev/null 2>&1; then
        echo "Repository already has commits"
    else
        echo "Initializing with placeholder commit"
        echo "Initial commit" > README.md
        git add README.md
        git commit -m "init"
    fi
fi

# Run the collection script
python3.14 scripts/collect.py 2>/dev/null
cp data/news.json .

# Stage all changes
git add -A

# Only commit if there are actual changes
if ! git diff --cached --quiet; then
    git commit -m "auto-update $(date +'%Y-%m-%d %H:%M')"
    
    # Handle timeout for push (macOS compatibility)
    TIMEOUT_CMD=""
    if command -v gtimeout >/dev/null 2>&1; then
        TIMEOUT_CMD="gtimeout 30"
    elif command -v timeout >/dev/null 2>&1; then
        TIMEOUT_CMD="timeout 30"
    fi

    if [ -n "$TIMEOUT_CMD" ]; then
        # Use timeout command if available
        $TIMEOUT_CMD git push origin main || {
            echo "PUSH_FAILED_DIRECT"
            # Retry via mirror
            git push https://ghfast.top/https://github.com/sv3nbear/qtrends.git main || echo "PUSH_MIRROR_FAILED_TOO"
        }
    else
        # Background push with 30s kill fallback
        git push origin main &
        PUSH_PID=$!
        (sleep 30; kill $PUSH_PID 2>/dev/null) &
        wait $PUSH_PID 2>/dev/null && echo "PUSH_OK" || echo "PUSH_TIMEOUT_OR_FAILED"
    fi
else
    echo "No changes to commit"
fi