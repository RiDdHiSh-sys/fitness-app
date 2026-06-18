from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from models.meal import MealCreate, MealResponse, MealDB
from database import get_db
from routes.user import verify_user_exists
from routes.workout import get_today_start
from utils.macro_calc import calculate_recovery_score

router = APIRouter()

async def update_daily_log_meal(db, user_id: str, date: datetime, calories: float, protein: float, carbs: float, fat: float):
    """
    Syncs meal macronutrients to daily logs. Upserts daily log for the normalized date.
    """
    today_start = get_today_start(date)
    log = await db.daily_logs.find_one({"user_id": user_id, "date": today_start})
    
    if not log:
        # Create daily log with meal details
        recovery = calculate_recovery_score(0.0, "none")
        new_log = {
            "user_id": user_id,
            "date": today_start,
            "intensity_score": "none",
            "calories_burned": 0.0,
            "total_protein": round(protein, 1),
            "total_carbs": round(carbs, 1),
            "total_fat": round(fat, 1),
            "total_calories_consumed": round(calories, 1),
            "sleep_hours": 0.0,
            "recovery_score": recovery
        }
        await db.daily_logs.insert_one(new_log)
    else:
        # Update existing daily log macros
        total_p = log.get("total_protein", 0.0) + protein
        total_c = log.get("total_carbs", 0.0) + carbs
        total_f = log.get("total_fat", 0.0) + fat
        total_cal = log.get("total_calories_consumed", 0.0) + calories
        
        # Keep existing workout fields
        intensity = log.get("intensity_score", "none")
        sleep = log.get("sleep_hours", 0.0)
        recovery = calculate_recovery_score(sleep, intensity)
        
        await db.daily_logs.update_one(
            {"user_id": user_id, "date": today_start},
            {
                "$set": {
                    "total_protein": round(total_p, 1),
                    "total_carbs": round(total_c, 1),
                    "total_fat": round(total_f, 1),
                    "total_calories_consumed": round(total_cal, 1),
                    "recovery_score": recovery
                }
            }
        )

@router.post("/meal", response_model=MealResponse, status_code=status.HTTP_201_CREATED)
async def log_meal(meal_data: MealCreate, db = Depends(get_db)):
    """
    Logs a meal for a user.
    Aggregates total calories and macro details across food items and updates daily log.
    """
    # 1. Verify user exists
    await verify_user_exists(meal_data.user_id, db)
    
    # 2. Sum calories and macros
    total_calories = 0.0
    total_protein = 0.0
    total_carbs = 0.0
    total_fat = 0.0
    
    for item in meal_data.items:
        total_calories += item.calories
        total_protein += item.protein_g
        total_carbs += item.carbs_g
        total_fat += item.fat_g
        
    # Round metrics
    total_calories = round(total_calories, 1)
    total_protein = round(total_protein, 1)
    total_carbs = round(total_carbs, 1)
    total_fat = round(total_fat, 1)
    
    # 3. Create database entry
    meal_db = MealDB(
        user_id=meal_data.user_id,
        items=meal_data.items
    )
    
    try:
        result = await db.meals.insert_one(meal_db.model_dump(by_alias=True, exclude={"id"}))
        meal_id = str(result.inserted_id)
        
        # 4. Sync values to daily logs
        await update_daily_log_meal(
            db,
            meal_data.user_id,
            meal_db.date,
            total_calories,
            total_protein,
            total_carbs,
            total_fat
        )
        
        return MealResponse(
            meal_id=meal_id,
            total_calories=total_calories,
            total_protein=total_protein,
            total_carbs=total_carbs,
            total_fat=total_fat
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to log meal: {str(e)}"
        )
