from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from models.workout import WorkoutCreate, WorkoutResponse, WorkoutDB, WorkoutIntensity
from database import get_db
from routes.user import verify_user_exists, get_current_user_id
from utils.calorie_calc import calculate_calories_burned
from utils.macro_calc import calculate_recovery_score

router = APIRouter()

def get_today_start(dt: datetime = None) -> datetime:
    if dt is None:
        dt = datetime.utcnow()
    return datetime(dt.year, dt.month, dt.day, 0, 0, 0)

async def update_daily_log_workout(db, user_id: str, date: datetime, calories_burned: float, workout_intensity: str):
    """
    Syncs workout data to daily logs. Upserts daily log for the normalized date.
    """
    today_start = get_today_start(date)
    intensity_priority = {"none": 0, "low": 1, "medium": 2, "high": 3}
    
    log = await db.daily_logs.find_one({"user_id": user_id, "date": today_start})
    
    if not log:
        # Create daily log with workout details
        recovery = calculate_recovery_score(0.0, workout_intensity)
        new_log = {
            "user_id": user_id,
            "date": today_start,
            "intensity_score": workout_intensity,
            "calories_burned": round(calories_burned, 2),
            "total_protein": 0.0,
            "total_carbs": 0.0,
            "total_fat": 0.0,
            "total_calories_consumed": 0.0,
            "sleep_hours": 0.0,
            "recovery_score": recovery
        }
        await db.daily_logs.insert_one(new_log)
    else:
        # Update existing daily log
        current_intensity = log.get("intensity_score", "none")
        # Keep the highest intensity logged today
        if intensity_priority.get(workout_intensity, 0) > intensity_priority.get(current_intensity, 0):
            final_intensity = workout_intensity
        else:
            final_intensity = current_intensity
            
        total_burned = log.get("calories_burned", 0.0) + calories_burned
        sleep = log.get("sleep_hours", 0.0)
        recovery = calculate_recovery_score(sleep, final_intensity)
        
        await db.daily_logs.update_one(
            {"user_id": user_id, "date": today_start},
            {
                "$set": {
                    "intensity_score": final_intensity,
                    "calories_burned": round(total_burned, 2),
                    "recovery_score": recovery
                }
            }
        )

@router.post("/workout", response_model=WorkoutResponse, status_code=status.HTTP_201_CREATED)
async def log_workout(
    workout_data: WorkoutCreate,
    db = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id)
):
    """
    Logs a workout session for a user.
    Calculates total calories burned using the MET formula based on the user's weight.
    Determines workout intensity and syncs with daily logs.
    """
    # Enforce authentication user match
    if workout_data.user_id != current_user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Cannot log workouts for another user"
        )
        
    # 1. Verify user exists and get their weight
    user = await verify_user_exists(workout_data.user_id, db)
    weight_kg = user.get("weight_kg", 70.0) # default if not set
    
    # Convert Pydantic submodels to list of dicts for helper
    exercises_dict = [ex.model_dump() for ex in workout_data.exercises]
    
    # 2. Calculate calories burned
    total_calories_burned = calculate_calories_burned(exercises_dict, weight_kg)
    
    # 3. Determine intensity score based on average MET and calories burned
    # If calories burned > 350 or average MET >= 6.0, intensity is high.
    # If calories burned > 150 or average MET >= 4.0, intensity is medium.
    # Otherwise low.
    avg_met = sum(ex.met_value for ex in workout_data.exercises) / len(workout_data.exercises)
    
    if total_calories_burned > 350 or avg_met >= 6.0:
        intensity = WorkoutIntensity.high
    elif total_calories_burned > 150 or avg_met >= 4.0:
        intensity = WorkoutIntensity.medium
    else:
        intensity = WorkoutIntensity.low
        
    # 4. Insert workout into the DB
    workout_db = WorkoutDB(
        user_id=workout_data.user_id,
        exercises=workout_data.exercises,
        total_calories_burned=total_calories_burned,
        intensity_score=intensity
    )
    
    try:
        result = await db.workouts.insert_one(workout_db.model_dump(by_alias=True, exclude={"id"}))
        workout_id = str(result.inserted_id)
        
        # 5. Sync to daily logs
        await update_daily_log_workout(
            db, 
            workout_data.user_id, 
            workout_db.date, 
            total_calories_burned, 
            intensity.value
        )
        
        return WorkoutResponse(
            workout_id=workout_id,
            total_calories_burned=total_calories_burned,
            intensity_score=intensity
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to log workout: {str(e)}"
        )
