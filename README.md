# SmartCalorie AI 🍽️

A smart calorie tracking app powered by Google Gemini AI. Take a photo of your food and get instant nutritional analysis.

## Features

### 📸 AI-Powered Food Recognition
- Take a photo of your meal and let Gemini AI analyze it
- **Text-based meal input** — describe what you ate (e.g., "12 beef dumplings and a bowl of egg drop soup") and get AI-estimated nutrition
- Automatic detection of food items with calorie and macro estimates
- Supports breakfast, lunch, dinner, and snacks
- Nutritional values rounded to whole numbers for clean display
- **Automatic image compression** — photos resized to 1024×1024 max and compressed to JPEG 0.7 for reliable uploads
- **Retry with backoff** — transient API errors (rate limits, network issues, server errors) automatically retried up to 2 times
- **Descriptive error messages** — users see specific error reasons (rate limit, network, image too large, etc.) instead of generic failures

### 🏃 Exercise Tracking
- Log workouts with various exercise types:
  - Walking, Running, Cycling
  - Elliptical, Swimming, Strength Training
- Input duration in minutes
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
- **No impact on calorie calculations** — purely a hydration tracker

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
  - Exponential smoothing (70% old, 30% new) for stable learning
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

### ✏️ Profile Editing
- Tap on avatar/name to edit profile settings
- Editable fields: Gender, Age, Height, Weight
- Name is read-only after registration
- Real-time BMR preview when editing
- **Weight unit toggle (kg/lbs)** - converts automatically

### 🎂 Automatic Age Increment
- Age automatically increases by 1 year on January 1st
- BMR automatically recalculated with new age
- No manual updates needed

### ⏱️ Time-Based BMR Tracking
- Real-time BMR burn calculation proportional to time of day
- Shows net calories (eaten - BMR - exercise) for accurate tracking
- Visual progress bars for intake, BMR burn, and exercise burn
- Daily target based on BMR (exercise tracked separately)

### 📅 Date Navigation
- View meal and exercise history by date
- Navigate between days with arrow controls
- **Calendar picker popup** - tap the date to open a full calendar view
  - Month/year navigation
  - Touch-friendly large date buttons (44px touch targets)
  - Visual highlighting of selected date and today
  - **Green dot indicators** for dates with logged meals or exercises
  - Future dates disabled
  - "Go to Today" quick action
  - Click outside to dismiss
- Quick "Today" button to return to current date

### 📊 Impact History Modal
- Tap "Daily Impact" card to view historical weight trends
- Click anywhere outside the modal to dismiss
- View daily, weekly, and monthly aggregated data

### 🗑️ Meal & Exercise Management
- Delete any logged meal or exercise with a single tap
- View detailed nutritional breakdown (protein, carbs, fat)
- Photo thumbnails for visual meal reference

### 👤 Single-User Optimized
- Automatic login for single-user devices
- No user selection screen when only one profile exists
- Quick profile deletion with cache cleanup

### 📊 Nutritional Insights
- Track protein, carbs, and fat intake with macro pie chart
- Daily weight impact prediction based on net calories
- BMR calculation using Mifflin-St Jeor equation
- Clean, mobile-first dashboard design

## Tech Stack

- **Frontend:** React + TypeScript
- **Styling:** Tailwind CSS
- **AI:** Google Gemini API (gemini-3-flash-preview)
- **Build Tool:** Vite
- **Charts:** Recharts
- **Icons:** Lucide React
- **Storage:** LocalStorage (per-user data persistence)

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
- Last weight update timestamp for prediction
- Age last updated year (for auto-increment)
- Daily exercise goal
- Water tracking enabled (boolean, default false)
- Daily water goal in ml (default 2500)
- Water unit preference (ml or oz)

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

**Three safety guards prevent wild swings:**

1. **Noise filter (5% threshold):** If `|bmrCorrectionRatio − 1| ≤ 0.05`, skip calibration entirely. Small errors are likely measurement noise (water weight, scale variance), not metabolism changes.

2. **Clamping [0.5, 1.5]:** The factor is clamped so effective BMR never deviates more than ±50% from the Mifflin-St Jeor baseline.

3. **Exponential smoothing (70/30):** The new factor blends with history to dampen outliers:
   ```
   newFactor = 0.7 × oldFactor + 0.3 × clampedFactor
   ```
   The 70% weight on the old value means a single bad measurement can only shift the factor by 30% of the implied correction.

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
> ```
> newFactor = 0.7 × 1.0 + 0.3 × 1.172 = 0.700 + 0.352 = 1.052
> New Effective BMR = 1749 × 1.052 = 1840 kcal
> ```
>
> **Historical correction:**
> ```
> correctionPerDay = 0.274 / 7 = 0.0391 kg
> Each day's impact reduced by 0.0391 kg
> New daily impact = −0.0323 − 0.0391 = −0.0714 kg/day
> Sum = 7 × (−0.0714) = −0.500 kg  ✓ (matches actual change)
> ```

## Deployment

This app is deployed on Vercel. Any push to the `main` branch will trigger automatic deployment.

**Live Demo:**
https://smartcalorie-ai.vercel.app/

## License

CC BY-NC-ND 4.0 (Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International)

See [LICENSE](LICENSE) for details.
