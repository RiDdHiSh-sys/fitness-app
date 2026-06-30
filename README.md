# Fitness and Nutrition AI App Backend

This is a high-performance, async backend built with Python 3.11, FastAPI, and Motor (MongoDB async driver) to serve a React Native mobile application. It features automated calorie and macro-nutrient tracking, recovery score calculation, weekly insights, pose evaluation, contextual AI chat capabilities, and JWT/Google OAuth authentication.

---

## Technical Stack

- **Runtime**: Python 3.11+
- **Framework**: FastAPI (Asynchronous ASGI framework)
- **Database**: MongoDB Atlas (Cloud)
- **DB Client**: Motor (Non-blocking async MongoDB driver)
- **Security**: JWT tokens (`PyJWT`), Password hashing (`bcrypt`)
- **Hosting Platform**: Vercel (Serverless Functions)

---

## Directory Structure

```text
fitness_app/
├── main.py               # Application entrypoint & lifespan lifecycle
├── database.py           # MongoDB connection with in-memory mock fallback
├── requirements.txt      # Dependency package definitions
├── vercel.json           # Vercel deployment routing configuration
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
├── routes/               # API Router endpoints (Token Protected)
│   ├── user.py
│   ├── workout.py
│   ├── meal.py
│   ├── summary.py
│   ├── recommendation.py
│   ├── chat.py
│   ├── recovery.py
│   ├── insights.py
│   ├── pose.py
│   └── ai_insights.py
└── utils/                # Calculation & Security utilities
    ├── auth.py           # password hashing, JWT generation, OAuth validation
    ├── calorie_calc.py   # MET-based calorie burn calculator
    └── macro_calc.py     # ICMR target macro & recovery score builders
```

---

## Installation & Local Setup

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Configure Environment Variables (`.env`)
```env
MONGODB_URL=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority
DATABASE_NAME=fitness_app_db
GEMINI_API_KEY=AIzaSy...

# Authentication Config
JWT_SECRET_KEY=your_secure_random_jwt_secret_key
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

### 3. Run Locally
```bash
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

---

## API Endpoints Reference

### 1. User Setup & Auth (Public)

#### `POST /user` (Register)
Registers a new user.
- **Request Body**:
  ```json
  {
    "email": "jane@example.com",
    "password": "securepassword123",
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

#### `POST /user/login` (Email Login)
Authenticates credentials and returns a JWT access token.
- **Request Body**:
  ```json
  {
    "email": "jane@example.com",
    "password": "securepassword123"
  }
  ```
- **Response** (200 OK):
  ```json
  {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "bearer",
    "user_id": "649c25f9b4c09d0d8299a9a3",
    "is_new_user": false
  }
  ```

#### `POST /user/oauth-login` (Google OAuth)
Authenticates a user via Google ID Token. If the user does not exist, they are registered automatically.
- **Request Body**:
  ```json
  {
    "provider": "google",
    "token": "google-id-token-received-on-mobile-app",
    "name": "Optional Name override",
    "age": 30,
    "weight_kg": 75.0,
    "height_cm": 178.0,
    "goal": "build_muscle"
  }
  ```
- **Response** (200 OK):
  ```json
  {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "bearer",
    "user_id": "649c25f9b4c09d0d8299a9a4",
    "is_new_user": true
  }
  ```

---

### 2. Protected Routes (Requires Header: `Authorization: Bearer <JWT>`)

All endpoints below require a valid JWT token in the headers.

#### `POST /workout` (Log Workout)
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
        "met_value": 5.0
      }
    ]
  }
  ```
- **Response** (201 Created):
  ```json
  {
    "workout_id": "649c265bb4c09d0d8299a9a4",
    "total_calories_burned": 98.25,
    "intensity_score": "medium"
  }
  ```

#### `POST /meal` (Log Meal)
- **Request Body**:
  ```json
  {
    "user_id": "649c25f9b4c09d0d8299a9a3",
    "items": [
      {
        "name": "Oatmeal with protein",
        "calories": 350.0,
        "protein_g": 30.0,
        "carbs_g": 45.0,
        "fat_g": 5.0,
        "source": "manual"
      }
    ]
  }
  ```

#### `GET /today-summary/{user_id}`
- **Response** (200 OK):
  ```json
  {
    "user": { "weight_kg": 65.5, "goal": "lose_weight" },
    "workout": { "intensity_score": "medium", "calories_burned": 98.3, "exercises": ["squat"] },
    "meals": { "calories_consumed": 350.0, "protein": 30.0, "carbs": 45.0, "fat": 5.0 },
    "remaining": { "protein": 87.9, "carbs": 151.5, "fat": 47.4, "calories": 1203.8 },
    "sleep_hours": 7.5
  }
  ```

#### `GET /ai-recommendation/{user_id}`
- **Response** (200 OK):
  ```json
  {
    "user_goal": "lose_weight",
    "workout_intensity": "medium",
    "recommendation": "Great work on sleeping 7.5 hours! Since you are doing a weight loss goal..."
  }
  ```

#### `POST /chat-reply`
- **Request Body**:
  ```json
  {
    "user_id": "649c25f9b4c09d0d8299a9a3",
    "message": "What should I eat?",
    "conversation_history": []
  }
  ```

#### `POST /sleep`
- **Request Body**:
  ```json
  {
    "user_id": "649c25f9b4c09d0d8299a9a3",
    "sleep_hours": 7.5
  }
  ```

#### `GET /recovery-score/{user_id}`
- **Response** (200 OK):
  ```json
  {
    "score": "green",
    "label": "Excellent Recovery",
    "reason": "Sufficient sleep duration and balanced physical intensity..."
  }
  ```

#### `GET /weekly-insights/{user_id}`
- **Response** (200 OK):
  ```json
  {
    "days_logged": 1,
    "avg_calories_burned": 98.3,
    "avg_protein_consumed": 30.0,
    "best_day": "2026-06-21",
    "pattern_data": [ ... ]
  }
  ```

#### `POST /pose-feedback`
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

---

## Deploying to Vercel

This backend is pre-configured to deploy seamlessly on Vercel as a Python Serverless Function.

### Step 1: Deploy code to GitHub
Push your local commits containing `vercel.json` to your GitHub repository:
```bash
git push
```

### Step 2: Set up Vercel Service
1. Log in to [Vercel](https://vercel.com).
2. Click **Add New** -> **Project**.
3. Import your GitHub repository.
4. Expand the **Environment Variables** section and configure:
   - `MONGODB_URL`: Your MongoDB Atlas Cluster connection URI.
   - `DATABASE_NAME`: `fitness_app_db` (or custom name).
   - `JWT_SECRET_KEY`: A secure secret string for token signing.
   - `ACCESS_TOKEN_EXPIRE_MINUTES`: `1440` (defaults to 24 hours if omitted).
   - `GEMINI_API_KEY`: *(Optional)* Your Google AI Studio API key.
5. Click **Deploy**. Vercel will automatically build the package and serve your endpoints!
