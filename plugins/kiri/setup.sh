#!/bin/bash
DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"
if [ ! -d node_modules ]; then
  bun install
  bunx playwright install chromium
fi
