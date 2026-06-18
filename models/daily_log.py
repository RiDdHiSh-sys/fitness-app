from datetime import datetime
from enum import Enum
from typing import Annotated, Optional
from pydantic import BaseModel, Field, BeforeValidator

PyObjectId = Annotated[str, BeforeValidator(str)]

class RecoveryScore(str, Enum):
    green = "green"
    yellow = "yellow"
    red = "red"

class SleepCreate(BaseModel):
    user_id: str = Field(..., min_length=1, description="String representation of User ObjectId")
    sleep_hours: float = Field(..., ge=0.0, le=24.0, description="Hours of sleep logged")
    date: Optional[datetime] = Field(default=None, description="Optional date for log (defaults to current date)")

class DailyLogDB(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    user_id: str
    date: datetime # normalized date at 00:00:00 UTC
    intensity_score: str = Field(default="none")
    calories_burned: float = Field(default=0.0)
    total_protein: float = Field(default=0.0)
    total_carbs: float = Field(default=0.0)
    total_fat: float = Field(default=0.0)
    total_calories_consumed: float = Field(default=0.0)
    sleep_hours: float = Field(default=0.0)
    recovery_score: RecoveryScore = Field(default=RecoveryScore.yellow)

    model_config = {
        "populate_by_name": True
    }
