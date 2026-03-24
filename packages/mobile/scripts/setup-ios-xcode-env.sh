#!/usr/bin/env bash
# Append Node 24 / Expo fixes to ios/.xcode.env if missing (safe to run multiple times).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
EXAMPLE="$ROOT/docs/ios-xcode.env.example"
TARGET="$ROOT/ios/.xcode.env"
if [[ ! -f "$EXAMPLE" ]]; then
  echo "Missing $EXAMPLE" >&2
  exit 1
fi
if [[ ! -d "$ROOT/ios" ]]; then
  echo "No ios/ folder yet. Run: npx expo prebuild --platform ios" >&2
  exit 1
fi
if [[ ! -f "$TARGET" ]]; then
  cp "$EXAMPLE" "$TARGET"
  echo "Created $TARGET from example."
  exit 0
fi
if grep -q "no-experimental-strip-types" "$TARGET" 2>/dev/null; then
  echo "ios/.xcode.env already contains NODE_OPTIONS fix."
  exit 0
fi
echo "" >> "$TARGET"
echo "# Added by setup-ios-xcode-env.sh (Node 24 / Expo)" >> "$TARGET"
grep -E "^export NODE_(BINARY|OPTIONS)" "$EXAMPLE" >> "$TARGET" || cat "$EXAMPLE" >> "$TARGET"
echo "Appended Expo/Node 24 lines to $TARGET"
