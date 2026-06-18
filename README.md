# Fitness and Nutrition AI App Backend

This is a high-performance, async backend built with Python 3.11, FastAPI, and Motor (MongoDB async driver) to serve a React Native mobile application. It features automated calorie and macro-nutrient tracking, recovery score calculation, weekly insights, pose evaluation, and contextual AI chat capabilities.

---

## Technical Stack

- **Runtime**: Python 3.11+
- **Framework**: FastAPI (Asynchronous ASGI framework)
- **Database**: MongoDB Atlas (Cloud) / Local MongoDB
- **DB Client**: Motor (Non-blocking async MongoDB driver)
- **Data Validation**: Pydantic v2
- **Environment Management**: Python-dotenv & Pydantic-settings
- **AI Integrations**: Google Gemini API (optional fallback)

---

## Directory Structure

```text
fitness_app/
├── main.py               # Application entrypoint & CORS configuration
├── database.py           # MongoDB connection lifecycle & clients
├── requirements.txt      # Dependency package definitions
├── .env                  # Environment secrets (ignored by Git)
├── .env.example          # Environment variables template
├── README.md             # Setup instructions and API documentation
├── models/               # Pydantic validation & DB structure schemas
│   ├── user.py
│   ├── workout.py
│   ├── meal.py
│   ├── daily_log.py
│   ├── chat.py
│   └── pose.py
├── routes/               # API Router endpoints
│   ├── user.py
│   ├── workout.py
│   ├── meal.py
│   ├── summary.py
│   ├── recommendation.py
│   ├── chat.py
│   ├── recovery.py
│   ├── insights.py
│   └── pose.py
└── utils/                # Calculation utilities
    ├── calorie_calc.py   # MET-based calorie burn calculator
    └── macro_calc.py     # ICMR target macro & recovery score builders
```

---

## Installation & Setup

### 1. Prerequisites
- Install [Python 3.11](https://www.python.org/downloads/)
- Install [MongoDB](https://www.mongodb.com/try/download/community) locally or set up a cloud cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).

### 2. Install Dependencies
Clone this repository (or navigate to its root directory) and run:
```bash
pip install -r requirements.txt
```

### 3. Environment Configuration
Create a `.env` file from the template:
```bash
cp .env.example .env
```
Fill in your credentials in `.env`:
```env
MONGODB_URL=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority
DATABASE_NAME=fitness_app_db

# Optional: Add your Google Gemini API key to enable generative AI coaches
GEMINI_API_KEY=AIzaSy...
```

### 4. Running the Server Locally
Launch the Uvicorn development server:
```bash
python main.py
```
Or run directly through Uvicorn:
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
The interactive Swagger API documentation will be available at:
- **Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

## API Endpoints Reference

### 1. User Setup
#### `POST /user`
Creates a new user profile.
- **Request Body**:
  ```json
  {
    "name": "Jane Doe",
    "age": 28,
    "weight_kg": 65.5,
    "height_cm": 168.0,
    "goal": "lose_weight"
  }
  ```
- **Response** (201 Created):
  ```json
  {
    "user_id": "649c25f9b4c09d0d8299a9a3",
    "message": "User created successfully"
  }
  ```

---

### 2. Workouts
#### `POST /workout`
Logs a workout session. Burned calories are calculated using the MET formula: `MET * weight_kg * duration_hours`.
- **Request Body**:
  ```json
  {
    "user_id": "649c25f9b4c09d0d8299a9a3",
    "exercises": [
      {
        "name": "squat",
        "sets": 4,
        "reps": 12,
        "weight_kg": 50.0,
        "met_value": 5.0,
        "duration_minutes": 15.0
      },
      {
        "name": "bicep_curl",
        "sets": 3,
        "reps": 10,
        "weight_kg": 15.0,
        "met_value": 3.5
      }
    ]
  }
  ```
  *Note: If `duration_minutes` is omitted, it defaults to a sensible 1.5 minutes per set.*
- **Response** (201 Created):
  ```json
  {
    "workout_id": "649c265bb4c09d0d8299a9a4",
    "total_calories_burned": 98.25,
    "intensity_score": "medium"
  }
  ```

---

### 3. Meals
#### `POST /meal`
Logs a meal containing multiple food items. Tallies values into daily nutritional metrics.
- **Request Body**:
  ```json
  {
    "user_id": "649c25f9b4c09d0d8299a9a3",
    "items": [
      {
        "name": "Oatmeal with protein powder",
        "calories": 350.0,
        "protein_g": 30.0,
        "carbs_g": 45.0,
        "fat_g": 5.0,
        "source": "manual"
      },
      {
        "name": "Banana",
        "calories": 105.0,
        "protein_g": 1.3,
        "carbs_g": 27.0,
        "fat_g": 0.3,
        "source": "text"
      }
    ]
  }
  ```
- **Response** (201 Created):
  ```json
  {
    "meal_id": "649c279db4c09d0d8299a9a5",
    "total_calories": 455.0,
    "total_protein": 31.3,
    "total_carbs": 72.0,
    "total_fat": 5.3
  }
  ```

---

### 4. Today Summary
#### `GET /today-summary/{user_id}`
Returns today's physical activity, calories consumed vs. burned, remaining targets, and sleep. Returns default zero-states if no logs exist.
- **Response** (200 OK):
  ```json
  {
    "user": {
      "weight_kg": 65.5,
      "goal": "lose_weight"
    },
    "workout": {
      "intensity_score": "medium",
      "calories_burned": 98.3,
      "exercises": ["squat", "bicep_curl"]
    },
    "meals": {
      "calories_consumed": 455.0,
      "protein": 31.3,
      "carbs": 72.0,
      "fat": 5.3
    },
    "remaining": {
      "protein": 86.6,
      "carbs": 124.5,
      "fat": 47.1,
      "calories": 1098.8
    },
    "sleep_hours": 7.5
  }
  ```

---

### 5. AI Recommendations
#### `GET /ai-recommendation/{user_id}`
Provides daily coaches' tips based on macro deficits, workouts, and sleep metrics. Falls back to a local rules engine if no Gemini API Key is configured.
- **Response** (200 OK):
  ```json
  {
    "user_goal": "lose_weight",
    "workout_intensity": "medium",
    "calories_burned": 98.3,
    "macros_consumed": {
      "protein": 31.3,
      "carbs": 72.0,
      "fat": 5.3,
      "calories": 455.0
    },
    "macros_remaining": {
      "protein": 86.6,
      "carbs": 124.5,
      "fat": 47.1,
      "calories": 1098.8
    },
    "exercises_done": ["squat", "bicep_curl"],
    "sleep_hours": 7.5,
    "recommendation": "Great work on sleeping 7.5 hours! Since you are doing a weight loss goal, focus on hitting your remaining 86.6g protein using high-volume foods like lean chicken or white fish to stay full. Keep up the consistency!"
  }
  ```

---

### 6. AI Coach Chat
#### `POST /chat-reply`
A chat session with an AI coach that understands today's macro consumption and training volume.
- **Request Body**:
  ```json
  {
    "user_id": "649c25f9b4c09d0d8299a9a3",
    "message": "I feel really tired after my squat session today, what should I eat?",
    "conversation_history": [
      {
        "role": "user",
        "content": "Hi",
        "timestamp": "2026-06-18T10:00:00Z"
      },
      {
        "role": "ai",
        "content": "Hello! I am your AI fitness coach. How can I help you?",
        "timestamp": "2026-06-18T10:00:05Z"
      }
    ]
  }
  ```
- **Response** (200 OK):
  ```json
  {
    "ai_reply": "Since you completed a medium intensity squat session today and got 7.5 hours of sleep, your body is in recovery. I suggest eating a protein and carb-rich snack like a banana with protein shake. This will replenish your glycogen stores and jumpstart muscle repair.",
    "updated_history": [
      {
        "role": "user",
        "content": "Hi",
        "timestamp": "2026-06-18T10:00:00Z"
      },
      {
        "role": "ai",
        "content": "Hello! I am your AI fitness coach. How can I help you?",
        "timestamp": "2026-06-18T10:00:05Z"
      },
      {
        "role": "user",
        "content": "I feel really tired after my squat session today, what should I eat?",
        "timestamp": "2026-06-18T14:32:00Z"
      },
      {
        "role": "ai",
        "content": "Since you completed a medium intensity squat session today and got 7.5 hours of sleep, your body is in recovery. I suggest eating a protein and carb-rich snack like a banana with protein shake. This will replenish your glycogen stores and jumpstart muscle repair.",
        "timestamp": "2026-06-18T14:32:02Z"
      }
    ]
  }
  ```

---

### 7. Sleep and Recovery
#### `POST /sleep`
Logs sleep hours for today or a specific date. Updates the recovery score.
- **Request Body**:
  ```json
  {
    "user_id": "649c25f9b4c09d0d8299a9a3",
    "sleep_hours": 7.5
  }
  ```
- **Response** (200 OK):
  ```json
  {
    "message": "Sleep logged successfully",
    "sleep_hours": 7.5
  }
  ```

#### `GET /recovery-score/{user_id}`
Calculates recovery score (green/yellow/red), labels, and actionable reasons based on sleep hours and workout strain.
- **Response** (200 OK):
  ```json
  {
    "score": "green",
    "label": "Excellent Recovery",
    "reason": "Sufficient sleep duration and balanced physical intensity. Your body is primed for optimal performance today.",
    "sleep_hours": 7.5,
    "last_intensity": "medium"
  }
  ```

---

### 8. Weekly Insights
#### `GET /weekly-insights/{user_id}`
Computes statistics and trend lines over the last 7 days (calories burned, protein consumed, sleep trends, and highlights the best day).
- **Response** (200 OK):
  ```json
  {
    "days_logged": 1,
    "avg_calories_burned": 98.3,
    "avg_protein_consumed": 31.3,
    "best_day": "2026-06-18",
    "pattern_data": [
      { "date": "2026-06-12", "calories_burned": 0.0, "protein": 0.0, "sleep": 0.0 },
      { "date": "2026-06-13", "calories_burned": 0.0, "protein": 0.0, "sleep": 0.0 },
      { "date": "2026-06-14", "calories_burned": 0.0, "protein": 0.0, "sleep": 0.0 },
      { "date": "2026-06-15", "calories_burned": 0.0, "protein": 0.0, "sleep": 0.0 },
      { "date": "2026-06-16", "calories_burned": 0.0, "protein": 0.0, "sleep": 0.0 },
      { "date": "2026-06-17", "calories_burned": 0.0, "protein": 0.0, "sleep": 0.0 },
      { "date": "2026-06-18", "calories_burned": 98.3, "protein": 31.3, "sleep": 7.5 }
    ]
  }
  ```

---

### 9. Pose Feedback AI
#### `POST /pose-feedback`
Processes exercise joint angles and returns real-time corrective instructions. Logged details append under `pose_sessions`.
- **Request Body**:
  ```json
  {
    "user_id": "649c25f9b4c09d0d8299a9a3",
    "exercise": "squat",
    "knee_angle": 120.0,
    "elbow_angle": 90.0,
    "back_angle": 75.0
  }
  ```
- **Response** (200 OK):
  ```json
  {
    "feedback": "Shallow squat depth",
    "is_correct": false,
    "correction": "Lower your hips further until your thighs are parallel to the floor (aim for 90-100 degrees)."
  }
  ```
