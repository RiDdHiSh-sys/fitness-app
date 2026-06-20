from fastapi import APIRouter, Depends
from database import get_db
from routes.user import verify_user_exists
from routes.workout import get_today_start
from datetime import timedelta

router = APIRouter()

@router.get("/ai-insights/{user_id}")
async def ai_insights(user_id: str, db=Depends(get_db)):

    await verify_user_exists(user_id, db)

    today_start = get_today_start()
    past_dates = [today_start - timedelta(days=i) for i in range(6, -1, -1)]

    logs_cursor = db.daily_logs.find({
        "user_id": user_id,
        "date": {"$gte": past_dates[0], "$lte": past_dates[-1]}
    })

    logs = await logs_cursor.to_list(length=100)

    return {
        "days_found": len(logs),
        "message": "AI endpoint working"
    }
