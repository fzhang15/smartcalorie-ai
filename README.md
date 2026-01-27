# SmartCalorie AI 🍽️

A smart calorie tracking app powered by Google Gemini AI. Take a photo of your food and get instant nutritional analysis.

## Features

### 📸 AI-Powered Food Recognition
- Take a photo of your meal and let Gemini AI analyze it
- Automatic detection of food items with calorie and macro estimates
- Supports breakfast, lunch, dinner, and snacks
- Nutritional values rounded to whole numbers for clean display

### 🏃 Exercise Tracking
- Log workouts with various exercise types:
  - Walking, Running, Cycling
  - Elliptical, Swimming, Strength Training
- Input duration in minutes
- Automatic calorie burn calculation based on exercise type
- Exercise calories added to daily burn total

### ⚖️ Smart Weight Prediction
- Automatic weight prediction based on net calorie history
- Tracks cumulative calorie surplus/deficit since last weight update
- Shows "Predicted Weight" when it differs from recorded weight
- Tap to manually update weight and reset prediction baseline
- Uses 7,700 calories per kg of body fat formula

### ⏱️ Time-Based BMR Tracking
- Real-time BMR burn calculation proportional to time of day
- Shows net calories (eaten - BMR - exercise) for accurate tracking
- Visual progress bars for intake, BMR burn, and exercise burn
- Daily target based on BMR (exercise tracked separately)

### 📅 Date Navigation
- View meal and exercise history by date
- Navigate between days with intuitive controls
- Quick "Today" button to return to current date

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
- BMR (Basal Metabolic Rate)
- Last weight update timestamp for prediction

### Meal Log
- Timestamp, Meal type
- Food items with calories and macros
- Optional photo

### Exercise Log
- Timestamp, Exercise type
- Duration in minutes
- Calculated calories burned

## Deployment

This app is deployed on Vercel. Any push to the `main` branch will trigger automatic deployment.

**Live Demo:**
https://smartcalorie-ai.vercel.app/

## License

MIT