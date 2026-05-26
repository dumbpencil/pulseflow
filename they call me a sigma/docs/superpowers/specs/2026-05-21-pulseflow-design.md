# PulseFlow — Design Spec
**Date:** 2026-05-21  
**Status:** Approved  
**Approach:** B — Domain stores + repository layer + BLE adapter

---

## 1. Overview

PulseFlow is a React Native (Expo) mobile app for athlete recovery tracking. It connects to a Bluetooth wearable wrap device, tracks recovery sessions, scores soreness and readiness, visualizes trends, and provides team oversight for coaches.

**Target:** iOS and Android via EAS Build (Expo SDK 51+, managed workflow).

---

## 2. Tech Stack

| Concern | Choice |
|---|---|
| Framework | React Native, Expo SDK 51+, managed workflow |
| Navigation | Expo Router (file-based) |
| State | Zustand (3 domain slices) |
| Persistence | expo-sqlite (sessions, readiness, profile) + MMKV (flags) |
| BLE | react-native-ble-plx, behind BLEAdapter interface |
| Charts | Victory Native XL |
| Animation | React Native Reanimated 3 |
| SVG | react-native-svg (score arc) |
| Bottom sheets | @gorhom/bottom-sheet |
| Notifications | expo-notifications |
| Fonts | expo-font (DM Mono, Plus Jakarta Sans, Barlow Condensed) |
| Icons | phosphor-react-native |
| Images | expo-image |
| Sharing/Export | expo-sharing |
| Auth storage | expo-secure-store |

**Explicitly excluded:** Expo Go snack embeds, Recharts/Chart.js, shadcn, NativeBase, Lucide icons, Inter/Roboto fonts, ActivityIndicator, purple-to-blue gradients, glassmorphism everywhere, colored-left-border cards.

---

## 3. Navigation Architecture

```
Root _layout.tsx
├── Auth Stack           (shown when no stored token in expo-secure-store)
│   └── /login           mock login — hardcoded creds: athlete@pulseflow.io / demo
│
├── Onboarding Stack     (shown after login if onboarding_complete flag not set)
│   ├── /onboarding/welcome
│   ├── /onboarding/connect
│   └── /onboarding/profile
│
└── Tab Navigator        (main app)
    ├── / (index)        Recovery Hub
    ├── /history         Session History & Analytics
    ├── /team            Coach Dashboard
    └── /settings        Settings & Profile
    
    Modals (over tab stack):
    ├── /pairing         BLE Pairing (slide-up, full-screen modal)
    └── /session         Active Recovery Session
```

- Auth guard lives in root `_layout.tsx`. Reads token from `expo-secure-store` async on mount; does not block render.
- Onboarding completion stored as `onboarding_complete` key in `expo-secure-store`.
- Tab bar: icon-only, label shown only on active tab. Four tabs maximum.

---

## 4. Data Architecture

### 4.1 TypeScript Types (`/src/types/`)

```typescript
type RecoverySession = {
  id: string;
  date: string;               // ISO8601
  modality: 'vibration' | 'thermal' | 'cold';
  durationMinutes: number;
  sorenessScore: number;      // 1–10
  recoveryDelta: number;      // change in score after session
  deviceConnected: boolean;
  notes?: string;
};

type DailyReadiness = {
  date: string;               // ISO8601 date, primary key
  recoveryScore: number;      // 0–100, computed
  sorenessScore: number;      // 1–10
  sleepQuality: number;       // 1–5
  streakDay: number;
};

type AthleteProfile = {
  id: string;
  name: string;
  teamSchool: string;
  sport: string;
  goals: string[];
  planTier: 'free' | 'premium';
};

type DeviceState = {
  connected: boolean;
  batteryPercent: number | null;
  firmwareVersion: string | null;
  lastSyncTimestamp: string | null;
  rssi: number | null;
  simulated: boolean;         // true when MockBLEAdapter is active
};

type CoachNote = {
  athleteId: string;
  date: string;               // ISO8601 date
  note: string;
};

type MockAthlete = {
  id: string;
  name: string;
  sport: string;
  recoveryScore: number;
  sorenessScore: number;
  streakDay: number;
  sevenDaySoreness: number[]; // index 0 = 6 days ago, index 6 = today
};
```

### 4.2 SQLite Schema (`/src/db/`)

Three tables. Device state is volatile — Zustand only, not persisted.

```sql
CREATE TABLE IF NOT EXISTS coach_notes (
  athlete_id TEXT NOT NULL,
  date TEXT NOT NULL,
  note TEXT NOT NULL,
  PRIMARY KEY (athlete_id, date)
);

CREATE TABLE IF NOT EXISTS recovery_sessions (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  modality TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  soreness_score INTEGER NOT NULL,
  recovery_delta REAL NOT NULL,
  device_connected INTEGER NOT NULL,  -- 0/1
  notes TEXT
);

CREATE TABLE IF NOT EXISTS daily_readiness (
  date TEXT PRIMARY KEY,
  recovery_score REAL NOT NULL,
  soreness_score INTEGER NOT NULL,
  sleep_quality INTEGER NOT NULL,
  streak_day INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS athlete_profile (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  team_school TEXT NOT NULL,
  sport TEXT NOT NULL,
  goals TEXT NOT NULL,         -- JSON array
  plan_tier TEXT NOT NULL
);
```

### 4.3 Repository Layer (`/src/db/`)

Thin modules — no business logic, just query wrappers:

- `sessionRepository.ts` — `insertSession`, `getSessionsByDateRange`, `getWeeklySessions`, `deleteSession`
- `readinessRepository.ts` — `upsertReadiness`, `getReadinessByDateRange`, `getTodayReadiness`
- `profileRepository.ts` — `getProfile`, `upsertProfile`
- `coachNoteRepository.ts` — `upsertCoachNote`, `getCoachNote(athleteId, date)`
- `seed.ts` — generates 14 days of realistic sessions/readiness + 8 mock athletes for Team Dashboard; guarded by `seeded` flag in MMKV (runs once per install)

### 4.4 Zustand Stores (`/src/stores/`)

Three slices. Stores never import from each other. Cross-store reads happen in hooks only.

**`sessionStore`** — session list, active session state (modality, elapsed time, intensity), weekly summary computed via `useMemo` from session list.

**`readinessStore`** — today's readiness, 7-day history array, recovery score (computed from algorithm below), streak counter.

**`profileStore`** — athlete profile (persisted) + device state (volatile). Device state resets on app launch; profile hydrates from SQLite on mount.

### 4.5 Recovery Score Algorithm

```typescript
const recoveryScore = clamp(
  (sleepQuality / 5) * 30 +
  ((10 - sorenessScore) / 10) * 40 +
  (Math.min(streakDays, 7) / 7) * 20 +
  (deviceConnected ? 10 : 0),
  0, 100
);
```

---

## 5. BLE Adapter Pattern (`/src/hooks/useBLE.ts`, `/src/services/ble/`)

### 5.1 Interface

```typescript
interface BLEAdapter {
  startScan(onDevice: (device: BLEDevice) => void): void;
  stopScan(): void;
  connect(deviceId: string): Promise<DeviceState>;
  disconnect(): Promise<void>;
  isBluetoothEnabled(): Promise<boolean>;
}

type BLEDevice = {
  id: string;
  name: string;
  rssi: number;
};
```

### 5.2 Error Types

```typescript
class BluetoothOffError extends Error {}
class DeviceNotFoundError extends Error {}
class PairingFailedError extends Error {}
```

Each surfaces a distinct UI state in the pairing screen — not a generic "Something went wrong."

### 5.3 RealBLEAdapter

Wraps `react-native-ble-plx`. Scans for peripherals advertising the PulseFlow service UUID (`PULSEFLOW_SERVICE_UUID` constant — swappable without touching adapter logic). Maps RSSI to four signal tiers: excellent (> −60), good (−60 to −75), weak (−75 to −85), very weak (< −85).

### 5.4 MockBLEAdapter

Fakes the full pairing flow with deliberate timing:
- Scan starts → 2s delay → `"PulseFlow Wrap #A4"` appears
- Connect called → 1.5s delay → resolves with `{ battery: 78, firmware: "2.1.4", lastSync: now, simulated: true }`

Always sets `simulated: true` on the resolved `DeviceState`. UI shows a "Simulated Device" badge — never hidden.

### 5.5 Adapter Selection

`useBLE` hook instantiates the adapter once at app start (stored in a ref):
- If `react-native-ble-plx` permissions are denied, or platform is simulator → `MockBLEAdapter`
- Otherwise → `RealBLEAdapter`

Adapter does not swap mid-session.

### 5.6 Pairing Screen State Machine

```
idle → scanning → found → connecting → connected
                                      → error (BluetoothOff | NotFound | PairingFailed)
```

Each state is a distinct visual layout. Scanning animation: three concentric rings pulsing outward via Reanimated `withRepeat` + `withTiming` — not a spinner, not `ActivityIndicator`.

---

## 6. Screen Architecture

### Recovery Hub (`/app/(tabs)/index.tsx`)
- `RecoveryScoreArc` — SVG arc, 40% screen height, animates 0→value on mount (600ms ease-out)
- `DeviceStatusWidget` — battery, firmware, last sync, Connect CTA → opens `/pairing` modal
- `WeeklyActivityBars` — Victory Native XL horizontal bars, color by intensity
- `StartSessionSheet` — `@gorhom/bottom-sheet` with three modality tiles → navigates to `/session`

### BLE Pairing (`/app/pairing.tsx`)
- Full-screen modal over tab stack
- Scanning animation: concentric pulsing rings (Reanimated)
- Device `FlatList`: name + RSSI bars (Phosphor icon, 4 tiers)
- Three distinct error layouts with retry actions

### Active Session (`/app/session.tsx`)
- Full-screen countdown timer (DM Mono, large)
- Intensity slider (1–10)
- End Session → soreness score picker (1–10) → writes `RecoverySession` + updates `DailyReadiness` → haptic + navigate back to Hub

### Session History (`/app/(tabs)/history.tsx`)
- Weekly average score arc (smaller variant of `RecoveryScoreArc`)
- 7-day soreness chart: asymmetric rounded-top bars, staggered entrance, tap → bottom sheet with day detail
- Auto-generated insight string from actual store data (% soreness change)
- Session `FlatList` with date, modality icon, duration, recovery delta
- Filter pill: week / month / custom range

### Team Dashboard (`/app/(tabs)/team.tsx`)
- Roster `FlatList`: name, recovery score (DM Mono), soreness dot (green/amber/red), streak
- Sort pill: score / soreness / streak
- Tap athlete → sheet with their 7-day soreness chart + coach note input

### Settings (`/app/(tabs)/settings.tsx`)
- `SectionList` — no nested cards, clean separators
- Recovery section: sport dropdown, goals chips, notification time picker
- Device section: firmware version, calibration modal (3-step state machine), reset (destructive + confirm)
- Account section: plan display, team dashboard link, export data, help

---

## 7. Design System

### Colors (`/src/constants/colors.ts`)

```typescript
const colors = {
  background: {
    deep:     '#0A0A0A',
    card:     '#111111',
    elevated: '#1A1A1A',
  },
  accent: {
    primary: '#00E676',   // warm phosphorescent green — dominant accent
    warning: '#FF8F00',   // deep amber — soreness medium
    danger:  '#E53935',   // high soreness, destructive actions
  },
  text: {
    primary:   '#F5F5F5',
    secondary: '#9E9E9E',
  },
  soreness: {
    low:  '#00E676',
    mid:  '#FF8F00',
    high: '#E53935',
  },
} as const;
```

All text/background combinations verified at WCAG AA (4.5:1 body, 3:1 large text).

### Typography

| Font | Role |
|---|---|
| DM Mono | All numeric data: scores, %, durations, timestamps |
| Plus Jakarta Sans | UI labels, body text, button labels |
| Barlow Condensed | Screen titles and hero stats only |

Loaded via `expo-font` before first render. `<FontLoader>` wrapper prevents unstyled text flash.

### Iconography

Phosphor Icons (`phosphor-react-native`) exclusively. Weight as hierarchy:
- `thin` → decorative / background
- `regular` → navigation items
- `bold` → primary actions
- `fill` → active / selected state

### Spacing Scale (`/src/constants/spacing.ts`)

`4, 8, 12, 16, 24, 32, 48` — 4pt base unit. No magic numbers in component files.

### Primitive Components (`/src/components/ui/`)

| Component | Purpose |
|---|---|
| `Button` | `primary` / `ghost` / `destructive` variants |
| `Badge` | Plan tier, simulated device indicator, goals chips |
| `Separator` | 1px `#1A1A1A` between settings sections |
| `BottomSheet` | Thin wrapper around `@gorhom/bottom-sheet` |
| `EmptyState` | Icon + headline + body + optional CTA — used on every empty list/chart |
| `LoadingPulse` | Shimmer animated placeholder — replaces all `ActivityIndicator` usage |

---

## 8. Charts

All chart components in `/src/components/charts/`. Charts receive data as props — no store reads inside chart components.

### `RecoveryScoreArc`
- `react-native-svg` `<Path>` for arc track and fill
- Sweep angle animated from 0 on mount via Reanimated shared value (600ms ease-out)
- Two size variants: `hero` (Home screen) and `summary` (History header)

### `SorenssTrendChart`
- Victory Native XL `VictoryBar`
- Custom bar path: top corners rounded at 6pt, bottom corners square
- Bar color from `soreness` token (low/mid/high), determined by actual value
- Staggered entrance: each bar's `y` animates up with 80ms delay offset via Reanimated `withDelay`
- Tap handler opens bottom sheet with day detail

### `WeeklyActivityBars`
- Victory Native XL `VictoryBar`, horizontal layout
- Bar fill = `sessionMinutes / maxSessionMinutesThisWeek`
- Color by intensity tier (derived from soreness at session time)

Data transforms (grouping by day, computing averages, insight strings) in hooks:
- `useWeeklySummary` — weekly session data for activity bars
- `useSorenessInsight` — % change string for History auto-generated insight

Both use `useMemo` for transform memoization.

---

## 9. Error Handling

All async operations return a `Result<T, AppError>` discriminated union. No thrown exceptions in business logic.

```typescript
type Result<T, E> =
  | { ok: true; value: T }
  | { ok: false; error: E };
```

- **BLE errors** → distinct screen state per error type with labelled retry
- **SQLite errors** → toast notification via `useToast` hook; don't crash screens
- **Every screen** has a defined `ErrorState` variant alongside its normal render
- **Empty states** are `EmptyState` component instances — never blank views

---

## 10. Notifications

- `expo-notifications` scheduled local notification at user-set time daily
- Message pool of 8, selected by yesterday's `DailyReadiness.recoveryScore` tier:
  - `< 50`: "Your body needs attention today. Log a recovery session."
  - `50–74`: "Decent recovery yesterday. Keep the streak going."
  - `≥ 75`: "Strong recovery score. You're on a roll — don't break the streak."
- Permission requested during onboarding step 3 (not cold launch)
- If denied: notification time picker in Settings is disabled with explanatory label

---

## 11. Onboarding Flow

Three screens, skippable. On skip, prompted to complete on next launch.

1. **Welcome** — app value prop, brand introduction
2. **Connect Device** — triggers BLE pairing flow (same MockBLEAdapter)
3. **Set Sport + Goals** — sport picker, goals multi-select, notification permission request

Completion stored as `onboarding_complete` in `expo-secure-store`.

---

## 12. CSV Export

Format:
```
Date,Modality,Duration(min),Soreness,RecoveryScore,DeviceConnected
2026-05-19,vibration,45,3,82,true
```

Implementation: `csvExport()` utility in `/src/utils/export.ts` queries all sessions from repository, serializes to CSV string, writes temp file via `expo-file-system`, shares via `expo-sharing` (native share sheet on iOS, app picker on Android).

---

## 13. Mock Data Seed

On first install, `seed.ts` generates:

**Personal data (14 days):**
- `RecoverySession` and `DailyReadiness` rows
- Sessions on 10 of 14 days (realistic gap)
- Soreness values follow a realistic arc (higher mid-week, lower on rest days)
- Modality varies across vibration / thermal / cold

**Team roster (8 mock athletes):**
- Hardcoded `MockAthlete` array in `/src/constants/mockAthletes.ts`
- Each has a name, sport, current recovery/soreness scores, streak, and 7-day soreness history
- Not stored in SQLite — static constant, never modified except for coach notes
- Coach notes stored in `coach_notes` table keyed by `(athleteId, date)`

Guarded by `seeded` MMKV flag — runs exactly once per install.

---

## 14. File Structure

```
/app
  _layout.tsx                   root layout, auth guard
  login.tsx                     mock login screen
  /(tabs)
    _layout.tsx                 tab navigator
    index.tsx                   Recovery Hub
    history.tsx                 Session History & Analytics
    team.tsx                    Coach Dashboard
    settings.tsx                Settings & Profile
  /pairing.tsx                  BLE Pairing modal
  /session.tsx                  Active Session screen
  /onboarding/
    _layout.tsx
    welcome.tsx
    connect.tsx
    profile.tsx
/src
  /components
    /charts
      RecoveryScoreArc.tsx
      SorenssTrendChart.tsx
      WeeklyActivityBars.tsx
    /device
      DeviceStatusWidget.tsx
      ScanningAnimation.tsx
    /ui
      Button.tsx
      Badge.tsx
      Separator.tsx
      BottomSheet.tsx
      EmptyState.tsx
      LoadingPulse.tsx
  /hooks
    useBLE.ts
    useRecoveryScore.ts
    useSessionHistory.ts
    useWeeklySummary.ts
    useSorenessInsight.ts
    useToast.ts
  /stores
    sessionStore.ts
    readinessStore.ts
    profileStore.ts
  /db
    schema.ts
    sessionRepository.ts
    readinessRepository.ts
    profileRepository.ts
    coachNoteRepository.ts
    seed.ts
  /services
    /ble
      BLEAdapter.ts             interface + error types
      RealBLEAdapter.ts
      MockBLEAdapter.ts
  /types
    index.ts                    RecoverySession, DailyReadiness, AthleteProfile, DeviceState, CoachNote, MockAthlete
  /utils
    recoveryScore.ts            score algorithm
    export.ts                   CSV export
    date.ts                     date helpers
  /constants
    colors.ts
    spacing.ts
    fonts.ts
    ble.ts                      PULSEFLOW_SERVICE_UUID = '0000FF10-0000-1000-8000-00805F9B34FB'
    mockAthletes.ts             hardcoded MockAthlete roster (8 athletes)
/assets
  /fonts                        DM Mono, Plus Jakarta Sans, Barlow Condensed
```

---

## 15. Deliverables

1. Full Expo project buildable with `npx expo start`
2. `README.md` with setup instructions, EAS build commands, mock BLE explanation, env vars
3. `eas.json` with development and production profiles
4. Runs on iOS simulator and Android emulator without errors
