#!/usr/bin/env sh
# Copy web/ into docs/ (the folder GitHub Pages serves). No build step beyond this.
# Files starting with "_" (dev previews) stay out of docs/.
set -e
cd "$(dirname "$0")"
for f in web/*.html web/*.js; do
  [ -e "$f" ] || continue
  case "$(basename "$f")" in _*) continue ;; esac
  cp "$f" docs/
done
echo "docs/ updated:"; ls docs
