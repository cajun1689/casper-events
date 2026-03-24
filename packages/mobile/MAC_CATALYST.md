# Mac Catalyst

This app is configured to support **Mac Catalyst**: the same iOS codebase can run on Mac (Apple Silicon / Intel with Catalyst).

## What was added

- Config plugin `plugins/withMacCatalyst.js` sets `SUPPORTS_MACCATALYST = YES` in the Xcode project during `expo prebuild`.

## One-time: regenerate native project

From the repo root (with dependencies installed):

```bash
cd packages/mobile
npx expo prebuild --platform ios --clean
```

Open the workspace:

```bash
open ios/*.xcworkspace
```

In Xcode:

1. Select the **app target** (Wyoming Events Calendar / `wyomingevents`).
2. **Signing & Capabilities** → ensure a Team is set for Mac.
3. At the top, set the run destination to **My Mac (Mac Catalyst)** (or **My Mac (Designed for iPad)** depending on Xcode wording).
4. **Product → Run** (⌘R).

## EAS Build

Cloud iOS builds still produce an **iOS** `.ipa`. To ship on the **Mac App Store** as Catalyst, archive in Xcode with a Mac destination or follow App Store Connect guidance for your listing.

## Features to verify on Mac

| Feature            | Notes                                              |
|--------------------|----------------------------------------------------|
| Maps               | `react-native-maps` may be limited; test map tab.  |
| Push notifications | Often not available on Mac Catalyst the same way.  |
| Haptics              | `expo-haptics` may no-op on Mac.                   |

## Disabling Catalyst

Remove `./plugins/withMacCatalyst.js` from `app.json` → `plugins`, then `expo prebuild --clean`.

## Dropbox / spaces in path (important)

If the repo lives under a path with **spaces** (e.g. `MAPL Dropbox`):

1. **`ios.buildReactNativeFromSource`** is set in `ios/Podfile.properties.json` so CocoaPods does not use RN prebuilt tarballs (Ruby `URI::File` breaks on spaces).
2. **`pod install`** and **Xcode** should be run from a path **without spaces** if possible, or apply the local fixes below (Expo’s shell scripts use `bash -c` with unquoted paths).
3. Convenience symlink (optional): `ln -sf "/path/to/CYH Calendar" ~/cyh-calendar` and open `~/cyh-calendar/packages/mobile/ios/*.xcworkspace`.

Local patches applied in this repo for spaces:

- **`expo-constants`**: `EXConstants.podspec` script uses `bash -l -c ". \"$PODS_TARGET_SRCROOT/../scripts/get-app-config-ios.sh\""` instead of invoking the script path as raw `bash -c` code.
- **`WyomingEventsCalendar.xcodeproj`**: “Bundle React Native code and images” uses `bash "$(node … path to react-native-xcode.sh)"` instead of backticks (same quoting issue).

**Note:** Running `expo prebuild --clean` will regenerate `ios/` and may drop these edits; re-apply or add an Expo config plugin / `patch-package` to persist.


## Build error: `RCTSwiftUIContainerView.swift` not found

This usually means **`ios/Podfile.lock` is out of sync** with `node_modules/react-native` (e.g. the lockfile still references **React Native 0.83** while `package.json` has **0.76.x**). CocoaPods then points at Swift files that do not exist in your installed RN version.

**Fix — regenerate Pods (from `packages/mobile` after `pnpm install`):**

```bash
cd ios
rm -rf Pods Podfile.lock build
cd ..
pnpm exec pod-install
# or: cd ios && pod install
```

Then in Xcode: **Product → Clean Build Folder** (⇧⌘K), build again.

If it still fails, align the native project: `npx expo prebuild --platform ios --clean` (may require re-applying Catalyst / Dropbox path patches documented above).

## Command-line: `xcodebuild` (Mac Catalyst)

The `ios/` folder is not committed (see `.gitignore`); native projects are local. For **CLI** builds:

```bash
cd packages/mobile/ios   # or symlink path without spaces
bash ../scripts/xcode-maccatalyst.sh
```

**Node 24 (Homebrew):** add to **`ios/.xcode.env`** (same folder as the workspace — not committed):

```bash
export NODE_OPTIONS="${NODE_OPTIONS:-} --no-experimental-strip-types"
```

Without this, Expo’s config step can fail while loading plugins from `node_modules`.

**Paths with spaces (Dropbox):** some Pod script phases split paths incorrectly. Prefer a **symlink** without spaces to the repo root, then `cd` into `packages/mobile/ios` from that symlink before `xcodebuild`.
