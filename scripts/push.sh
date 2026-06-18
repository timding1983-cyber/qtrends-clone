#!/bin/bash
cd ~/.openclaw/workspace/qtrends-clone
python3.14 scripts/collect.py 2>/dev/null
cp data/news.json .
git add -A
git diff --cached --quiet || {
    git commit -m "auto-update $(date +%Y-%m-%d\ %H:%M)"
    # macOS compatibility: timeout from coreutils or bash fallback
TIMEOUT_CMD=""
command -v gtimeout >/dev/null 2>&1 && TIMEOUT_CMD="gtimeout 30"
command -v timeout >/dev/null 2>&1 && TIMEOUT_CMD="timeout 30"

if [ -n "$TIMEOUT_CMD" ]; then
    $TIMEOUT_CMD git push origin main 2>/dev/null || {
        echo "PUSH_FAILED_DIRECT"
        # retry via mirror
        git push https://ghfast.top/https://github.com/sv3nbear/qtrends.git main 2>/dev/null || echo "PUSH_MIRROR_FAILED_TOO"
    }
else
    # no timeout command, run push and cap with background kill
    git push origin main &
    PUSH_PID=$!
    (sleep 30; kill $PUSH_PID 2>/dev/null) &
    SLEEP_PID=$!
    wait $PUSH_PID 2>/dev/null
    kill $SLEEP_PID 2>/dev/null
    echo "PUSH_TIMEOUT_OR_FAILED"
fi
}
