from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from database import get_db
from routes.user import verify_user_exists, get_current_user_id
from routes.workout import get_today_start
from utils.macro_calc import calculate_daily_targets

router = APIRouter()

@router.get("/today-summary/{user_id}", status_code=status.HTTP_200_OK)
async def get_today_summary(
    user_id: str,
    db = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id)
):
    """
    Returns today's summary of physical activity and nutrition targets.
    Handles empty/unlogged states gracefully.
    """
    # Enforce authentication user match
    if user_id != current_user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Cannot access summaries for another user"
        )
        
    # 1. Verify user exists
    user = await verify_user_exists(user_id, db)
    weight_kg = user.get("weight_kg", 70.0)
    goal = user.get("goal", "maintain")
    
    # 2. Get today's start and tomorrow's start
    today_start = get_today_start()
    tomorrow_start = today_start + timedelta(days=1)
    
    # 3. Retrieve today's daily log
    log = await db.daily_logs.find_one({"user_id": user_id, "date": today_start})
    
    # 4. Retrieve workouts logged today to extract exercise names and stats
    workouts_cursor = db.workouts.find({
        "user_id": user_id,
        "date": {"$gte": today_start, "$lt": tomorrow_start}
    })
    workouts = await workouts_cursor.to_list(length=100)
    exercise_names = []
    for w in workouts:
        for ex in w.get("exercises", []):
            exercise_names.append(ex.get("name"))
            
    # 5. Populate stats (defaulting to zero/none if no log exists)
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
        
    # 6. Calculate daily targets based on weight and goal
    targets = calculate_daily_targets(weight_kg, goal)
    
    # 7. Calculate remaining macros (Remaining = Target - Consumed)
    # Remaining calories = Target - Consumed + Burned (workout adjustment)
    rem_protein = round(targets["protein"] - total_protein, 1)
    rem_carbs = round(targets["carbs"] - total_carbs, 1)
    rem_fat = round(targets["fat"] - total_fat, 1)
    rem_calories = round(targets["calories"] - total_calories_consumed + calories_burned, 1)
    
    return {
        "user": {
            "weight_kg": weight_kg,
            "goal": goal
        },
        "workout": {
            "intensity_score": intensity_score,
            "calories_burned": round(calories_burned, 1),
            "exercises": exercise_names
        },
        "meals": {
            "calories_consumed": round(total_calories_consumed, 1),
            "protein": round(total_protein, 1),
            "carbs": round(total_carbs, 1),
            "fat": round(total_fat, 1)
        },
        "remaining": {
            "protein": rem_protein,
            "carbs": rem_carbs,
            "fat": rem_fat,
            "calories": rem_calories
        },
        "sleep_hours": round(sleep_hours, 1)
    }
