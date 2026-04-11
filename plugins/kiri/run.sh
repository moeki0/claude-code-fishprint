#!/bin/bash
DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"

# ユーザーのログインシェルからPATHを継承
USER_SHELL="$(basename "$SHELL")"
eval "$(${SHELL:-/bin/zsh} -lc 'echo export PATH="$PATH"' 2>/dev/null)"

if [ "$1" = "ocr" ] && ! command -v tesseract &>/dev/null; then
  echo "Error: tesseract is required for OCR. Install with: brew install tesseract" >&2
  exit 1
fi

bun run capture.ts "$@"
