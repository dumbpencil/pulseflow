# PulseFlow

Athlete recovery tracking app built with React Native (Expo SDK 51), Expo Router, Zustand, and SQLite.

## Setup

### Prerequisites

- Node.js 18+ and npm
- Expo CLI: `npm install -g expo-cli eas-cli`
- iOS: Xcode 15+ (for simulator)
- Android: Android Studio with emulator

### Install

```bash
cd pulseflow
npm install
```

### Fonts

Download and place these font files in `assets/fonts/`:

| File | Font |
|------|------|
| `DMMonoRegular.ttf` | [DM Mono Regular](https://fonts.google.com/specimen/DM+Mono) |
| `PlusJakartaSansRegular.ttf` | [Plus Jakarta Sans Regular](https://fonts.google.com/specimen/Plus+Jakarta+Sans) |
| `PlusJakartaSansMedium.ttf` | Plus Jakarta Sans Medium |
| `PlusJakartaSansBold.ttf` | Plus Jakarta Sans Bold |
| `BarlowCondensedSemiBold.ttf` | [Barlow Condensed SemiBold](https://fonts.google.com/specimen/Barlow+Condensed) |

### Run

```bash
# iOS simulator
npx expo run:ios

# Android emulator
npx expo run:android

# Development server (requires development client)
npx expo start
```

## Mock BLE

The app uses a `MockBLEAdapter` when Bluetooth permissions are denied or the platform is a simulator. It simulates the full pairing flow:

1. 2-second scan delay, then "PulseFlow Wrap #A4" appears
2. 1.5-second connect delay
3. Resolves with `battery: 78%`, `firmware: 2.1.4`, `simulated: true`

A **"Simulated Device"** badge is always shown — it cannot be hidden.

To use a real device, build with EAS and grant Bluetooth permissions on a physical device.

## Demo Credentials

```
Email:    athlete@pulseflow.io
Password: demo
```

## Mock Data

On first launch, the app seeds 14 days of recovery sessions, readiness entries, and 8 mock team athletes. The seed runs exactly once per install (guarded by an MMKV flag).

## EAS Build

```bash
# Development build (enables dev client)
eas build --profile development --platform ios

# Production build
eas build --profile production --platform all
```

Configure `eas.json` with your EAS project ID before building.

## Environment

No required `.env` variables for local development. BLE service UUID is `0000FF10-0000-1000-8000-00805F9B34FB` (see `src/constants/ble.ts`).

## Architecture

```
app/                  Expo Router screens
src/
  components/         Shared components (charts, device, ui primitives)
  constants/          Colors, spacing, fonts, BLE UUID, mock athletes
  db/                 SQLite schema, repositories, seed
  hooks/              Composable hooks (BLE, scores, insights)
  services/ble/       BLEAdapter interface + Real/Mock implementations
  stores/             Zustand slices (session, readiness, profile)
  types/              TypeScript types + Result<T,E> union
  utils/              Pure functions (score algorithm, CSV export, dates)
```
