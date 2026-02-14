# SmartCalorie AI 🍽️

A smart calorie tracking app powered by Google Gemini AI. Take a photo of your food or describe your meal and get instant nutritional analysis with adaptive weight prediction.

## Features

### 📸 AI-Powered Food Recognition
- Take a photo of your meal and let Gemini AI analyze it
- **Text-based meal input** — describe what you ate (e.g., "12 beef dumplings and a bowl of egg drop soup") and get AI-estimated nutrition
- Automatic detection of food items with calorie and macro estimates
- **Editable AI results** — after analysis, manually adjust food item names, calories, protein, carbs, and fat before saving
- **No food detected handling** — when AI doesn't find food in an image, offers options to try a different photo or describe the meal via text
- Supports breakfast, lunch, dinner, and snacks
- **Auto meal type detection** — meal type pre-selects based on time of day (breakfast 8–10am, lunch 11:30am–1:30pm, dinner 5–7pm, snack otherwise)
- Nutritional values rounded to whole numbers for clean display
- **Automatic image compression** — photos resized to 1024×1024 max and compressed to JPEG 0.7 for reliable uploads
- **Retry with backoff** — transient API errors (rate limits, network issues, server errors) automatically retried up to 2 times
- **Descriptive error messages** — users see specific error reasons (rate limit, network, image too large, etc.) instead of generic failures

### 🍽️ Meal Portion & Sharing
- **Diners selector** — choose 1P, 2P, 3P, 4P to automatically split calories when sharing a meal
- **Custom portion slider** — set any portion from 10% to 100% for flexible splitting
- Calories, protein, carbs, and fat all adjusted proportionally
- Per-item and total calorie preview shows adjusted values before saving

### 🏃 Exercise Tracking
- Log workouts with various exercise types:
  - Walking, Running, Cycling
  - Elliptical, Swimming, Strength Training
  - Aerobics, Plank
- Input duration in minutes (slider + manual input)
- Automatic calorie burn calculation based on exercise type
- Exercise calories added to daily burn total

### 💧 Water Tracking (Opt-in)
- **Disabled by default** — enable in Profile Editor when you want it
- Quick-add buttons: Cup (250ml), Bottle (500ml), Large (750ml)
- Custom amount input with ml/oz unit support
- Blue progress bar in the dashboard stats card
- Water log section with timestamps and delete support
- Dedicated 💧 Water FAB button (appears when enabled)
- Daily goal configurable (default 2,500ml)
- Goal reached celebration indicator 🎉
- **No impact on calorie calculations** — purely a hydration tracker

### 🔔 Water Reminder Notifications
- **Opt-in feature** — nested under Water Tracking in Profile Editor
- **Proportional deficit detection** — calculates expected intake based on time elapsed in your active window, not just a fixed schedule
- **Configurable notification period** — default 8 AM to 9 PM, adjustable to any hour range
- **Deviation threshold** — triggers notification when you're behind by a configurable amount (default: 2 hours' worth of water; options from 30 min to 4 hours)
- **Browser Notification API** — works when the tab is open (foreground or background); permission requested on toggle-on
- **Spam prevention** — 1-hour cooldown between notifications, checks run every 30 minutes
- **Smart skip** — no notifications after daily goal is reached or outside the notification window
- **Permission denied handling** — shows inline error message if browser notifications are blocked

### ⚖️ Smart Weight Prediction with Calibration
- Automatic weight prediction based on net calorie history
- Tracks cumulative calorie surplus/deficit since last weight update
- Shows "Predicted Weight" when it differs from recorded weight
- Tap to manually update weight and reset prediction baseline
- Uses 7,700 calories per kg of body fat formula
- **Supports both kg and lbs units**
- **Adaptive BMR calibration** - learns your actual metabolism over time:
  - Compares predicted vs actual weight changes when you update
  - Adjusts "Effective BMR" to match your real metabolism
  - Historical impact records corrected to reflect actual changes
  - **Duration-aware smoothing** — longer measurement gaps = more trust in new data
  - Same-day weigh-ins (< 24h) skip calibration to avoid noise
  - See [BMR Calibration Math](#-bmr-calibration--compensation-math) below for details

### 📈 Impact History & Trends
- Tap "Daily Impact" card to view historical weight trends
- **Three views:**
  - **Daily:** Last 7 days of weight impact
  - **Weekly:** Last 8 weeks aggregated
  - **Monthly:** Last 8 months aggregated
- Line chart visualization with zero reference line
- Fixed Y-axis boundaries that auto-expand for large values
- Persisted impact history with catch-up backfill on app load
- Today's live value calculated in real-time
- Summary statistics: total and average impact

### 📊 Calorie Gauge
- Semi-circular speedometer-style gauge showing net calorie deficit/surplus
- Animated needle that sweeps from deficit (green, left) to surplus (red, right)
- Range dynamically set to ±50% of your BMR
- Glow effects and tapered needle for polished appearance
- Deficit/surplus labels and tick marks for orientation

### ✏️ Profile Editing
- Tap on avatar/name to edit profile settings
- Editable fields: Gender, Age, Height, Weight, Daily Exercise Goal
- Name is read-only after registration
- Real-time BMR preview when editing
- **Weight unit toggle (kg/lbs)** — converts automatically
- Water tracking toggle with configurable goal and unit

### 🎂 Automatic Age Increment
- Age automatically increases by 1 year on January 1st
- BMR automatically recalculated with new age
- No manual updates needed

### ⏱️ Time-Based BMR Tracking
- Real-time BMR burn calculation proportional to time of day
- **Registration day adjustment** — on the day a profile is created, BMR burn only counts from the creation time (not the full 24h)
- Shows net calories (eaten - BMR - exercise) for accurate tracking
- Visual progress rings for intake, BMR burn, exercise burn, and water (when enabled)
- Daily target based on BMR (exercise tracked separately)

### 📅 Date Navigation
- View meal and exercise history by date
- Navigate between days with arrow controls
- **Calendar picker popup** — tap the date to open a full calendar view
  - Month/year navigation
  - Touch-friendly large date buttons (44px touch targets)
  - Visual highlighting of selected date and today
  - **Green dot indicators** for dates with logged meals or exercises
  - Future dates disabled
  - Pre-data dates disabled (can't navigate before earliest log or registration)
  - "Go to Today" quick action
  - Click outside to dismiss
- Quick "Today" button to return to current date

### 📊 Impact History Modal
- Tap "Daily Impact" card to view historical weight trends
- Click anywhere outside the modal to dismiss
- View daily, weekly, and monthly aggregated data

### 🗑️ Meal & Exercise Management
- Delete any logged meal or exercise with a single tap
- View detailed nutritional breakdown (protein, carbs, fat) in meal detail modal
- Photo thumbnails for visual meal reference
- **Full-screen image preview** — tap a meal photo to view it full-screen with dark overlay

### 👤 Multi-User Support
- **User selector screen** — choose profile when multiple users exist
- **Add new profiles** from the user selector
- **Automatic login** for single-user devices (skips selection screen)
- Quick profile deletion with cache cleanup
- Per-user data isolation in LocalStorage
- **Legacy data migration** — single-user data from older versions automatically migrated

### 📊 Nutritional Insights
- Track protein, carbs, and fat intake with macro pie chart
- Daily weight impact prediction based on net calories
- BMR calculation using Mifflin-St Jeor equation
- Clean, mobile-first dashboard design

### 📱 Mobile-First Design & PWA
- **Installable PWA** — add to home screen on iOS and Android for native app experience
- Bottom sheet modals with **drag handles** and **swipe-down-to-dismiss** gesture
- **Body scroll locking** when modals are open to prevent background scrolling
- iOS safe area support (notch padding)
- Responsive layout — optimized for mobile, centered card on desktop
- Custom Inter font with antialiased rendering
- Smooth animations (fade-in, slide-in, zoom) for all transitions

## Tech Stack

- **Frontend:** React 18 + TypeScript
- **Styling:** Tailwind CSS (CDN)
- **AI:** Google Gemini API (`gemini-3-flash-preview`)
- **Build Tool:** Vite 6
- **Charts:** Recharts
- **Icons:** Lucide React
- **Storage:** LocalStorage (per-user data persistence)
- **PWA:** Web App Manifest + Apple meta tags

## Run Locally

**Prerequisites:** Node.js

1. Clone the repository:
   ```bash
   git clone https://github.com/fzhang15/smartcalorie-ai.git
   cd smartcalorie-ai
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file and add your Gemini API key:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```

4. Run the app:
   ```bash
   npm run dev
   ```

5. Open http://localhost:3000 in your browser

## Data Model

### User Profile
- Name, Age, Gender, Height, Weight
- Weight Unit (kg or lbs)
- BMR (Basal Metabolic Rate)
- Calibration Factor (learned metabolism adjustment)
- Calibration Base Weight (weight at last calibration point, only updated when dayGap ≥ 1)
- Created At (timestamp when profile was first created, never changes)
- Last weight update timestamp for prediction
- Age last updated year (for auto-increment)
- Daily exercise goal
- Water tracking enabled (boolean, default false)
- Daily water goal in ml (default 2500)
- Water unit preference (ml or oz)
- Water notification enabled (boolean, default false)
- Water notification start hour (default 8 = 8 AM)
- Water notification end hour (default 21 = 9 PM)
- Water notification deviation threshold in hours (default 2)

### Meal Log
- Timestamp, Meal type
- Food items with calories and macros
- Optional photo or text description
- Portion ratio for shared meals

### Exercise Log
- Timestamp, Exercise type
- Duration in minutes
- Calculated calories burned

### Water Log
- Timestamp
- Amount in ml (stored internally, converted to oz for display when preferred)

### Daily Impact Record
- Date (YYYY-MM-DD format)
- Weight impact in kg (can be positive or negative)

## 🧮 BMR Calibration & Compensation Math

The app learns your real metabolism over time by comparing predicted vs actual weight changes. Here's how it works:

### Step 1: Base BMR (Mifflin-St Jeor Equation)

```
Male:   BMR = 10 × weight(kg) + 6.25 × height(cm) − 5 × age + 5
Female: BMR = 10 × weight(kg) + 6.25 × height(cm) − 5 × age − 161
```

### Step 2: Effective BMR

The Mifflin-St Jeor equation is a population average — your actual metabolism may differ. The app applies a learned `calibrationFactor` (default 1.0):

```
Effective BMR = BMR × calibrationFactor
```

All calorie burn calculations use `Effective BMR` instead of raw `BMR`.

### Step 3: Daily Weight Impact

Each day's weight impact is calculated from net calories:

```
netCalories = caloriesEaten − effectiveBmrBurned − exerciseCalories
dailyImpact = netCalories / 7700    (kg)
```

> **7,700 kcal ≈ 1 kg of body fat** is the energy density constant used for weight ↔ calorie conversion.

For today (partial day), BMR burn is proportional to time elapsed:

```
bmrBurnedSoFar = effectiveBmr × (hoursElapsed / 24)
```

### Step 4: Weight Prediction

Predicted weight accumulates daily impacts since the last manual weight update:

```
predictedWeight = lastRecordedWeight + Σ(dailyImpact)
```

Days with no logged meals/exercise are skipped (assumed net zero — the user simply forgot to log).

### Step 5: Calibration on Weight Update

When the user manually updates their weight (e.g., stepping on a scale), the app compares prediction vs reality:

```
actualChange    = newWeight − previousWeight
predictedChange = Σ(dailyImpact)  over the period
predictionError = predictedChange − actualChange
```

**Interpreting the error:**
- `predictionError > 0` → We overpredicted weight gain → real BMR is **higher** than estimated → factor should **increase**
- `predictionError < 0` → We underpredicted weight gain → real BMR is **lower** than estimated → factor should **decrease**

**Deriving the BMR correction ratio:**

The only tunable variable in the weight prediction is the BMR. If the *true* BMR were `r` times our current estimate, the extra calories burned would shift the prediction. For the corrected prediction to match reality:

```
predictedChange − [totalBmrBurned × (r − 1) / 7700] = actualChange
```

Solving for `r`:

```
totalBmrBurned × (r − 1) / 7700 = predictedChange − actualChange
r − 1 = (predictedChange − actualChange) × 7700 / totalBmrBurned
r = 1 + (predictionError × 7700) / totalBmrBurned
```

Where `totalBmrBurned` is the sum of effective BMR burned across all logged days in the period. Since `Effective BMR = BMR × factor`, the factor itself is multiplied by `r`:

```
thisMeasurementFactor = oldFactor × bmrCorrectionRatio
```

**Four safety guards prevent wild swings:**

1. **Same-day gate (dayGap = 0):** If the gap since last weight update is < 24 hours, skip calibration entirely. Short-term weight fluctuations (water, food in stomach) would poison the calibration. The weight is saved for display and BMR recalculation, but `lastWeightUpdate` and `calibrationBaseWeight` are NOT moved — the gap keeps accumulating until it crosses 24h.

   ```
   gapHours = (now − lastWeightUpdate) / 3600000
   dayGap = floor(gapHours / 24)
   if dayGap === 0 → save weight, skip calibration, keep baseline
   ```

2. **Noise filter (5% threshold):** If `|bmrCorrectionRatio − 1| ≤ 0.05`, skip calibration. Small errors are likely measurement noise, not metabolism changes.

3. **Clamping [0.5, 1.5]:** The factor is clamped so effective BMR never deviates more than ±50% from the Mifflin-St Jeor baseline.

4. **Duration-aware exponential smoothing:** Longer measurement periods produce more reliable signals. The smoothing ratio scales with `dayGap`:

   | dayGap | oldRatio | newRatio | Reasoning |
   |--------|----------|----------|-----------|
   | 0 | — | — | Skip calibration entirely |
   | 1 | 0.9 | 0.1 | 1 day is still noisy |
   | 2 | 0.8 | 0.2 | Moderate confidence |
   | 3 | 0.7 | 0.3 | Good signal |
   | 4 | 0.6 | 0.4 | Strong signal |
   | ≥5 | 0.5 | 0.5 | Max trust (capped) |

   Formula:
   ```
   newRatio = min(dayGap × 0.1, 0.5)
   oldRatio = 1 − newRatio
   newFactor = oldRatio × oldFactor + newRatio × clampedFactor
   ```

   **`calibrationBaseWeight`:** The `actualChange` for calibration is always computed against `calibrationBaseWeight` (not the display weight). This field is only updated when `dayGap ≥ 1`, ensuring same-day weigh-ins don't shift the calibration baseline.

### Step 6: Historical Impact Correction

After calibration, the app retroactively corrects the impact history for the period between weight updates. The prediction error is distributed evenly across all logged days:

```
correctionPerDay = predictionError / numberOfLoggedDays
correctedImpact[day] = originalImpact[day] − correctionPerDay
```

This ensures the impact history chart reflects what actually happened (based on the scale reading), not just what was predicted.

### Worked Example

> **Setup:** Male, 80 kg, 175 cm, 30 years old. `calibrationFactor = 1.0`.
>
> ```
> BMR = 10(80) + 6.25(175) − 5(30) + 5 = 800 + 1093.75 − 150 + 5 = 1749 kcal
> Effective BMR = 1749 × 1.0 = 1749 kcal
> ```
>
> **Over 7 days**, the user eats 1600 kcal/day, burns 100 kcal/day exercise:
>
> ```
> Daily net = 1600 − 1749 − 100 = −249 kcal
> Daily impact = −249 / 7700 = −0.0323 kg/day
> Predicted change = 7 × (−0.0323) = −0.226 kg
> Predicted weight = 80 − 0.226 = 79.774 kg
> Total BMR burned = 7 × 1749 = 12,243 kcal
> ```
>
> **User steps on scale:** actual weight = 79.5 kg
>
> ```
> actualChange    = 79.5 − 80 = −0.500 kg
> predictedChange = −0.226 kg
> predictionError = −0.226 − (−0.500) = +0.274 kg  (overpredicted weight gain)
> ```
>
> The user lost more weight than predicted → real BMR is higher than 1749.
>
> ```
> bmrCorrectionRatio = 1 + (0.274 × 7700) / 12243 = 1 + 0.1723 = 1.172
> thisMeasurementFactor = 1.0 × 1.172 = 1.172
> ```
>
> Passes 5% threshold (17.2% > 5%) ✓. Within [0.5, 1.5] range ✓.
>
> Duration-aware smoothing: `dayGap = 7` → `newRatio = min(7 × 0.1, 0.5) = 0.5`, `oldRatio = 0.5`
>
> ```
> newFactor = 0.5 × 1.0 + 0.5 × 1.172 = 0.500 + 0.586 = 1.086
> New Effective BMR = 1749 × 1.086 = 1899 kcal
> ```
>
> **Historical correction:**
> ```
> correctionPerDay = 0.274 / 7 = 0.0391 kg
> Each day's impact reduced by 0.0391 kg
> New daily impact = −0.0323 − 0.0391 = −0.0714 kg/day
> Sum = 7 × (−0.0714) = −0.500 kg  ✓ (matches actual change)
> ```

## Project Structure

```
smartcalorie-ai/
├── index.html              # Entry HTML with Tailwind config & PWA meta tags
├── index.tsx               # React root mount
├── App.tsx                 # Main app: routing, state management, data persistence
├── types.ts                # TypeScript interfaces & enums
├── constants.ts            # Exercise/water/weight constants & conversions
├── vite.config.ts          # Vite build config with Gemini API key injection
├── components/
│   ├── Onboarding.tsx      # 2-step profile creation wizard
│   ├── UserSelector.tsx    # Multi-user profile picker
│   ├── Dashboard.tsx       # Main dashboard with stats, meals, exercises, water
│   ├── CalorieGauge.tsx    # SVG semi-circular net calorie gauge
│   ├── MealLogger.tsx      # Camera/upload/text meal input with AI analysis
│   ├── MealLogDetail.tsx   # Meal detail bottom sheet with delete
│   ├── ExerciseLogger.tsx  # Exercise type & duration logger
│   ├── WaterTracker.tsx    # Water intake quick-add & custom input
│   ├── WeightInput.tsx     # Weight update modal with unit conversion
│   ├── ProfileEditor.tsx   # Profile settings editor
│   └── ImpactHistoryModal.tsx  # Daily/weekly/monthly weight trend charts
├── hooks/
│   ├── useSwipeToClose.ts  # Swipe-down gesture hook with scroll locking
│   └── useWaterNotification.ts  # Water reminder notification hook with proportional deficit detection
├── services/
│   └── geminiService.ts    # Gemini AI integration (image & text analysis)
├── public/
│   ├── manifest.json       # PWA web app manifest
│   ├── icon.png            # App icon (512×512)
│   └── apple-touch-icon.png # iOS home screen icon
└── assets/
    └── icon.png            # Source icon asset
```

## Deployment

This app is deployed on Vercel. Any push to the `main` branch will trigger automatic deployment.

**Live Demo:**
https://smartcalorie-ai.vercel.app/

## License

CC BY-NC-ND 4.0 (Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International)

See [LICENSE](LICENSE) for details.
