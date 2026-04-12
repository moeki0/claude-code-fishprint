#!/bin/bash
# Usage: assemble.sh <sectionDir> <output> [preamble_file] [appendix_file]
# Concatenates section_N.md files in numeric order, with optional preamble and appendix.
set -euo pipefail

SECTION_DIR="$1"
OUTPUT="$2"
PREAMBLE_FILE="${3:-}"
APPENDIX_FILE="${4:-}"

if [ ! -d "$SECTION_DIR" ]; then
  echo "Error: sectionDir '$SECTION_DIR' not found" >&2
  exit 1
fi

# Collect section files in numeric order
SECTIONS=$(ls "$SECTION_DIR"/section_*.md 2>/dev/null | sort -t_ -k2 -n)
if [ -z "$SECTIONS" ]; then
  echo "Error: no section_*.md files found in '$SECTION_DIR'" >&2
  exit 1
fi

# Ensure output directory exists
mkdir -p "$(dirname "$OUTPUT")"

# Build output
{
  if [ -n "$PREAMBLE_FILE" ] && [ -f "$PREAMBLE_FILE" ]; then
    cat "$PREAMBLE_FILE"
    echo
    echo
  fi

  FIRST=1
  for f in $SECTIONS; do
    if [ "$FIRST" = "1" ]; then
      FIRST=0
    else
      echo
      echo "---"
      echo
    fi
    cat "$f"
  done

  if [ -n "$APPENDIX_FILE" ] && [ -f "$APPENDIX_FILE" ]; then
    echo
    echo "---"
    echo
    cat "$APPENDIX_FILE"
  fi
} > "$OUTPUT"

# Clean up
rm -f $SECTIONS
rmdir "$SECTION_DIR" 2>/dev/null || true

echo "Assembled $(echo "$SECTIONS" | wc -l | tr -d ' ') sections → $OUTPUT"
