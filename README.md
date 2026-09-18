# FamFeast

A React Native CLI family weekly meal planner. Households plan breakfast, lunch, and dinner, assign chefs, spin theme-aware suggestions, vote on alternatives, and keep a supporting grocery/pantry list.

This app uses a **mock service layer** (`src/services/mock`) so every primary flow runs without a backend. Swap adapters in `src/services/index.ts` when a real API is ready.

## Run

```bash
npm install
# iOS
cd ios && pod install && cd ..
npx react-native run-ios
# Android
npx react-native run-android
```

First launch opens household onboarding. Tap **Preview the Miller Feast demo** to load the populated Miller family week.

## Architecture

- `src/domain` — models
- `src/services` — replaceable interfaces + mock adapters (latency, validation, weighted randomizer)
- `src/store` — Zustand snapshot + toast/UI state
- `src/screens` — Schedule, Chefs, Spin, Voting, plus stack flows
- `src/theme` — Hearth & Table tokens and weekly theme overlays

## Brand

FamFeast uses the Hearth & Table system: terracotta primary, herb green, sunshine gold, Plus Jakarta Sans, and warm linen-adjacent surfaces.
# FamFeast
