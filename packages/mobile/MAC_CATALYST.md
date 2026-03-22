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
