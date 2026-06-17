#!/bin/bash
# Deploy qtrends-clone data to GitHub Pages repo
REPO_DIR="$HOME/qtrends-pages"
mkdir -p "$REPO_DIR/data" "$REPO_DIR"

# Copy the data and HTML
cp data/news.json "$REPO_DIR/data/"
cp public/index.html "$REPO_DIR/"

cd "$REPO_DIR" || exit 1

# Init git if needed
if [ ! -d ".git" ]; then
    git init
    git remote add origin https://github.com/timding1983-cyber/qtrends-clone.git
fi

# Commit and push
git add -A
git diff --cached --quiet || {
    git commit -m "auto-update $(date +%Y-%m-%d\ %H:%M)"
    git push -u origin main
}
