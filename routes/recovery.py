from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from database import get_db
from models.daily_log import SleepCreate
from routes.user import verify_user_exists
from routes.workout import get_today_start
from utils.macro_calc import calculate_recovery_score

router = APIRouter()

@router.post("/sleep", status_code=status.HTTP_200_OK)
async def log_sleep(sleep_data: SleepCreate, db = Depends(get_db)):
    """
    Logs sleep hours for today or a specific date.
    Updates the daily log and recalculates the recovery score.
    """
    # 1. Verify user
    await verify_user_exists(sleep_data.user_id, db)
    
    # 2. Determine target date (default to today)
    target_date = sleep_data.date if sleep_data.date else datetime.utcnow()
    today_start = get_today_start(target_date)
    
    # 3. Retrieve or create daily log
    log = await db.daily_logs.find_one({"user_id": sleep_data.user_id, "date": today_start})
    
    try:
        if not log:
            recovery = calculate_recovery_score(sleep_data.sleep_hours, "none")
            new_log = {
                "user_id": sleep_data.user_id,
                "date": today_start,
                "intensity_score": "none",
                "calories_burned": 0.0,
                "total_protein": 0.0,
                "total_carbs": 0.0,
                "total_fat": 0.0,
                "total_calories_consumed": 0.0,
                "sleep_hours": round(sleep_data.sleep_hours, 1),
                "recovery_score": recovery
            }
            await db.daily_logs.insert_one(new_log)
        else:
            # Update sleep hours and recalculate recovery score
            intensity = log.get("intensity_score", "none")
            recovery = calculate_recovery_score(sleep_data.sleep_hours, intensity)
            
            await db.daily_logs.update_one(
                {"user_id": sleep_data.user_id, "date": today_start},
                {
                    "$set": {
                        "sleep_hours": round(sleep_data.sleep_hours, 1),
                        "recovery_score": recovery
                    }
                }
            )
            
        return {
            "message": "Sleep logged successfully",
            "sleep_hours": round(sleep_data.sleep_hours, 1)
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to log sleep: {str(e)}"
        )

@router.get("/recovery-score/{user_id}", status_code=status.HTTP_200_OK)
async def get_recovery_score(user_id: str, db = Depends(get_db)):
    """
    Returns the user's recovery score, labeling, and reasoning for today.
    Handles unlogged states gracefully.
    """
    # 1. Verify user exists
    await verify_user_exists(user_id, db)
    
    # 2. Get today's start date
    today_start = get_today_start()
    
    # 3. Retrieve today's daily log
    log = await db.daily_logs.find_one({"user_id": user_id, "date": today_start})
    
    # 4. Fetch the latest logged intensity score to provide context if today is empty
    last_intensity = "none"
    sleep_hours = 0.0
    recovery_score = "yellow" # default
    
    if log:
        sleep_hours = log.get("sleep_hours", 0.0)
        last_intensity = log.get("intensity_score", "none")
        recovery_score = log.get("recovery_score", "yellow")
    else:
        # Fallback: check latest logged daily log or latest workout to see what the last workout intensity was
        latest_workout = await db.workouts.find_one(
            {"user_id": user_id},
            sort=[("date", -1)]
        )
        if latest_workout:
            last_intensity = latest_workout.get("intensity_score", "none")
            
        # If no sleep logged today, sleep_hours is 0.0 and we calculate score based on that and last intensity
        recovery_score = calculate_recovery_score(sleep_hours, last_intensity)
        
    # 5. Determine label and reason based on recovery score
    if recovery_score == "green":
        label = "Excellent Recovery"
        reason = "Sufficient sleep duration and balanced physical intensity. Your body is primed for optimal performance today."
    elif recovery_score == "red":
        label = "Critical Recovery Required"
        reason = "Inadequate sleep duration or high cardiovascular/muscle strain detected. We highly recommend a rest day or active recovery (stretching/walking) to avoid fatigue or injury."
    else: # yellow
        label = "Moderate Recovery"
        reason = "Your body is recovering, but sleep duration or workout intensity could be better optimized. Stay hydrated and warm up properly before exercising."
        
    return {
        "score": recovery_score,
        "label": label,
        "reason": reason,
        "sleep_hours": round(sleep_hours, 1),
        "last_intensity": last_intensity
    }
