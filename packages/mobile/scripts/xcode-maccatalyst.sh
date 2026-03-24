#!/usr/bin/env bash
# Clean + build Wyoming Events Calendar for Mac Catalyst via xcodebuild.
#
# Dropbox paths with spaces break some CocoaPods/React Native shell scripts.
# Prefer opening Xcode from a symlink without spaces, e.g.:
#   ln -sf "/Volumes/Dropbox/.../CYH Calendar" ~/cyh-calendar
#   cd ~/cyh-calendar/packages/mobile/ios
#
# Usage (from repo root):
#   bash packages/mobile/scripts/xcode-maccatalyst.sh
set -euo pipefail
IOS_DIR="$(cd "$(dirname "$0")/../ios" && pwd)"
export NODE_ENV="${NODE_ENV:-development}"
cd "$IOS_DIR"
DEST='platform=macOS,arch=arm64,variant=Mac Catalyst,name=My Mac'
if [[ "$IOS_DIR" == *" "* ]]; then
  echo "Warning: path contains spaces; xcodebuild may fail in script phases." >&2
  echo "Use a symlink without spaces (see script header) or build from Xcode GUI." >&2
fi
xcodebuild -workspace WyomingEventsCalendar.xcworkspace \
  -scheme WyomingEventsCalendar \
  -configuration Debug \
  -destination "$DEST" \
  clean build
