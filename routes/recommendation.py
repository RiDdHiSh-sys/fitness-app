import os
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from database import get_db
from routes.user import verify_user_exists, get_current_user_id
from routes.workout import get_today_start
from utils.macro_calc import calculate_daily_targets

router = APIRouter()

def generate_local_recommendation(goal: str, consumed: dict, remaining: dict, sleep: float, workout_intensity: str, exercises: list) -> str:
    """
    Generates smart, personalized fitness advice based on targets and logged activities.
    """
    tips = []
    
    # 1. Sleep advice
    if sleep <= 0:
        tips.append("Log your sleep hours tonight to evaluate your recovery status.")
    elif sleep < 6.0:
        tips.append(f"You logged only {sleep} hours of sleep. Prioritise getting at least 7-8 hours of sleep tonight for muscle recovery and metabolic balance.")
    elif sleep >= 8.0:
        tips.append("Excellent sleep! Your body is in a prime state for muscle repair and fat oxidation.")
        
    # 2. Workout and Recovery advice
    if workout_intensity == "high":
        if sleep < 6.0 and sleep > 0:
            tips.append("Warning: High workout intensity combined with low sleep increases injury risk. Prioritise deep sleep tonight and consider an active recovery or rest day tomorrow.")
        else:
            tips.append("High-intensity session completed! Hydrate well and consume adequate protein to rebuild muscle tissue.")
    elif workout_intensity == "none" and len(exercises) == 0:
        tips.append("No workouts logged today. A light 20-minute walk or active mobility session is a great way to stay active.")

    # 3. Macro and Goal advice
    if goal == "build_muscle":
        if remaining["protein"] > 20.0:
            tips.append(f"You are {remaining['protein']}g short of your protein goal. Consider a protein shake, Greek yogurt, or eggs to support muscle synthesis.")
        else:
            tips.append("Excellent! You are on track with your protein goal to support muscle hypertrophy.")
            
        if remaining["carbs"] > 50.0:
            tips.append("Don't shy away from complex carbs (oats, brown rice); they fuel heavy training sessions.")
            
    elif goal == "lose_weight":
        if remaining["calories"] < 0:
            tips.append("You have exceeded your calorie threshold for weight loss. Prioritise hydration and volume-rich, low-calorie foods (like vegetables) for the rest of the day.")
        elif remaining["carbs"] < 15.0:
            tips.append("Carb budget is almost depleted. Shift your focus to lean protein sources and healthy fats for your remaining snacks.")
            
    elif goal == "maintain":
        if abs(remaining["calories"]) <= 150:
            tips.append("Outstanding consistency! You are landing right in your maintenance calorie zone.")
            
    if not tips:
        tips.append("Excellent work tracking your habits. Consistency is the key to achieving your long-term fitness goals.")
        
    return " ".join(tips)

async def generate_gemini_recommendation(api_key: str, goal: str, consumed: dict, remaining: dict, sleep: float, workout_intensity: str, exercises: list) -> str:
    """
    Asynchronously queries Gemini for a personalised, high-quality advice text.
    """
    try:
        import google.generativeai as genai
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        prompt = (
            f"You are a professional AI fitness coach and sports nutritionist. Provide a brief, encouraging, "
            f"and actionable daily advice message (max 3 sentences) for a user with the goal of '{goal}'.\n"
            f"Today's stats:\n"
            f"- Workout intensity: {workout_intensity}\n"
            f"- Exercises done: {', '.join(exercises) if exercises else 'None'}\n"
            f"- Calories consumed: {consumed['calories']} kcal\n"
            f"- Target macros remaining: Protein {remaining['protein']}g, Carbs {remaining['carbs']}g, Fat {remaining['fat']}g, Calories {remaining['calories']} kcal\n"
            f"- Sleep logged: {sleep} hours\n"
            f"Ensure the tone is warm, professional, and tailored strictly to these metrics."
        )
        
        # Async generative call
        response = await model.generate_content_async(prompt)
        if response and response.text:
            return response.text.strip()
    except Exception as e:
        print(f"Gemini API invocation failed: {e}. Falling back to rule-based engine.")
    return ""

@router.get("/ai-recommendation/{user_id}", status_code=status.HTTP_200_OK)
async def get_ai_recommendation(
    user_id: str,
    db = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id)
):
    """
    Retrieves a personalized AI recommendation summary for today.
    Uses Gemini API if key is set in env, otherwise falls back to a smart local engine.
    """
    # Enforce authentication user match
    if user_id != current_user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Cannot access recommendations for another user"
        )
        
    # 1. Verify user exists
    user = await verify_user_exists(user_id, db)
    weight_kg = user.get("weight_kg", 70.0)
    goal = user.get("goal", "maintain")
    
    # 2. Normalized date queries
    today_start = get_today_start()
    tomorrow_start = today_start + timedelta(days=1)
    
    # 3. Retrieve daily logs and workouts
    log = await db.daily_logs.find_one({"user_id": user_id, "date": today_start})
    
    workouts_cursor = db.workouts.find({
        "user_id": user_id,
        "date": {"$gte": today_start, "$lt": tomorrow_start}
    })
    workouts = await workouts_cursor.to_list(length=100)
    exercises_done = []
    for w in workouts:
        for ex in w.get("exercises", []):
            exercises_done.append(ex.get("name"))
            
    # 4. Default values if no daily log exists
    sleep_hours = 0.0
    intensity_score = "none"
    calories_burned = 0.0
    
    total_protein = 0.0
    total_carbs = 0.0
    total_fat = 0.0
    total_calories_consumed = 0.0
    
    if log:
        sleep_hours = log.get("sleep_hours", 0.0)
        intensity_score = log.get("intensity_score", "none")
        calories_burned = log.get("calories_burned", 0.0)
        total_protein = log.get("total_protein", 0.0)
        total_carbs = log.get("total_carbs", 0.0)
        total_fat = log.get("total_fat", 0.0)
        total_calories_consumed = log.get("total_calories_consumed", 0.0)
        
    # 5. Calculate targets and remaining
    targets = calculate_daily_targets(weight_kg, goal)
    
    consumed = {
        "protein": round(total_protein, 1),
        "carbs": round(total_carbs, 1),
        "fat": round(total_fat, 1),
        "calories": round(total_calories_consumed, 1)
    }
    
    remaining = {
        "protein": round(targets["protein"] - total_protein, 1),
        "carbs": round(targets["carbs"] - total_carbs, 1),
        "fat": round(targets["fat"] - total_fat, 1),
        "calories": round(targets["calories"] - total_calories_consumed + calories_burned, 1)
    }
    
    # 6. Generate recommendation (Gemini vs Local Fallback)
    api_key = os.getenv("GEMINI_API_KEY")
    recommendation_text = ""
    
    if api_key:
        recommendation_text = await generate_gemini_recommendation(
            api_key, goal, consumed, remaining, sleep_hours, intensity_score, exercises_done
        )
        
    if not recommendation_text:
        recommendation_text = generate_local_recommendation(
            goal, consumed, remaining, sleep_hours, intensity_score, exercises_done
        )
        
    return {
        "user_goal": goal,
        "workout_intensity": intensity_score,
        "calories_burned": round(calories_burned, 1),
        "macros_consumed": consumed,
        "macros_remaining": remaining,
        "exercises_done": exercises_done,
        "sleep_hours": round(sleep_hours, 1),
        "recommendation": recommendation_text
    }
