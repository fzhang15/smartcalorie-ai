# SmartCalorie AI 🍽️

A smart calorie tracking app powered by Google Gemini AI. Take a photo of your food and get instant nutritional analysis.

## Features

### 📸 AI-Powered Food Recognition
- Take a photo of your meal and let Gemini AI analyze it
- Automatic detection of food items with calorie and macro estimates
- Supports breakfast, lunch, dinner, and snacks

### ⏱️ Time-Based Calorie Tracking
- Real-time calorie burn calculation based on time of day
- Shows net calories (eaten - burned) for better tracking
- Visual progress bars for both intake and burn

### 🗑️ Meal Management
- Delete any logged meal with a single tap
- View meal history by date
- Navigate between days to review past meals

### 👥 Multi-User Support
- Create multiple user profiles
- Each user has their own data and settings
- Easy profile switching

### 📊 Nutritional Insights
- Track protein, carbs, and fat intake
- Daily weight impact prediction
- BMR and TDEE calculation based on your profile

## Tech Stack

- **Frontend:** React + TypeScript
- **Styling:** Tailwind CSS
- **AI:** Google Gemini API
- **Build Tool:** Vite
- **Charts:** Recharts
- **Icons:** Lucide React

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

## Deployment

This app is deployed on Vercel. Any push to the `main` branch will trigger automatic deployment.

**Live Demo:** [Coming Soon]

## License

MIT