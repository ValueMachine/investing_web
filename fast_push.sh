#!/bin/bash
echo "🚀 Vibe Coding: Syncing to GitHub..."
git add .
git commit -m "⚡ Vibe Coding: Fast update $(date +%Y-%m-%d_%H-%M-%S)"
git push
echo "✅ Done! Changes are live."
