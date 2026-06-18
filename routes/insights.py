from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from database import get_db
from routes.user import verify_user_exists
from routes.workout import get_today_start

router = APIRouter()

@router.get("/weekly-insights/{user_id}", status_code=status.HTTP_200_OK)
async def get_weekly_insights(user_id: str, db = Depends(get_db)):
    """
    Returns weekly insights for the user over the last 7 days.
    Compiles average nutrition metrics and highlights the most active/consistent day.
    """
    # 1. Verify user exists
    await verify_user_exists(user_id, db)
    
    # 2. Compile list of the last 7 days (including today)
    today_start = get_today_start()
    past_dates = [today_start - timedelta(days=i) for i in range(6, -1, -1)]
    
    start_date = past_dates[0]
    end_date = past_dates[-1]
    
    # 3. Retrieve daily logs in range
    logs_cursor = db.daily_logs.find({
        "user_id": user_id,
        "date": {"$gte": start_date, "$lte": end_date}
    })
    logs = await logs_cursor.to_list(length=100)
    
    # Map logs by date string YYYY-MM-DD
    logs_map = {log["date"].strftime("%Y-%m-%d"): log for log in logs}
    
    # 4. Iterate over days to compile stats and find the 'best' day
    pattern_data = []
    total_calories_burned = 0.0
    total_protein_consumed = 0.0
    days_logged = 0
    
    best_day_date = "none"
    highest_consistency_score = -1.0
    
    for dt in past_dates:
        date_str = dt.strftime("%Y-%m-%d")
        log = logs_map.get(date_str)
        
        if log:
            days_logged += 1
            burned = log.get("calories_burned", 0.0)
            protein = log.get("total_protein", 0.0)
            sleep = log.get("sleep_hours", 0.0)
            
            total_calories_burned += burned
            total_protein_consumed += protein
            
            # Consistency formula: protein + (calories_burned / 10) + (sleep * 5)
            # Prioritizes hitting multiple targets
            consistency_score = protein + (burned / 10.0) + (sleep * 5.0)
            if consistency_score > highest_consistency_score:
                highest_consistency_score = consistency_score
                best_day_date = date_str
        else:
            burned = 0.0
            protein = 0.0
            sleep = 0.0
            
        pattern_data.append({
            "date": date_str,
            "calories_burned": round(burned, 1),
            "protein": round(protein, 1),
            "sleep": round(sleep, 1)
        })
        
    # 5. Compute averages
    avg_calories_burned = 0.0
    avg_protein_consumed = 0.0
    if days_logged > 0:
        avg_calories_burned = round(total_calories_burned / days_logged, 1)
        avg_protein_consumed = round(total_protein_consumed / days_logged, 1)
        
    return {
        "days_logged": days_logged,
        "avg_calories_burned": avg_calories_burned,
        "avg_protein_consumed": avg_protein_consumed,
        "best_day": best_day_date,
        "pattern_data": pattern_data
    }
