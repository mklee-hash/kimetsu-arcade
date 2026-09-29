#!/usr/bin/env sh
# Copy web/ into docs/ (the folder GitHub Pages serves). No build step beyond this.
set -e
cd "$(dirname "$0")"
cp web/*.html docs/
echo "docs/ updated:"; ls docs
