#!/bin/bash
cd ~/.openclaw/workspace/qtrends-clone
python3.14 scripts/collect.py 2>/dev/null
cp data/news.json .
git add -A
git diff --cached --quiet || {
    git commit -m "auto-update $(date +%Y-%m-%d\ %H:%M)"
    timeout 30 git push origin main 2>/dev/null || echo "PUSH_TIMEOUT_OR_FAILED"
}
