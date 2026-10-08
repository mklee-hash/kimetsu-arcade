#!/usr/bin/env sh
# Copy web/ into docs/ (the folder GitHub Pages serves). No build step beyond this.
# Files starting with "_" (dev previews) stay out of docs/.
# Shared scripts get a ?v=<stamp> so phones fetch the new copy instead of a cached old one.
set -e
cd "$(dirname "$0")"
STAMP=$(date +%Y%m%d%H%M%S)
for f in web/*.html web/*.js; do
  [ -e "$f" ] || continue
  case "$(basename "$f")" in _*) continue ;; esac
  cp "$f" docs/
done
for f in docs/*.html; do
  sed -i -E "s#(<script src=\"[a-z0-9-]+\.js)(\?v=[0-9]+)?\"#\1?v=$STAMP\"#g" "$f"
done
echo "docs/ updated (v=$STAMP):"; ls docs
