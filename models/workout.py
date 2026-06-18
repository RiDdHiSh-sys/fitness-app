from datetime import datetime
from enum import Enum
from typing import Annotated, List, Optional
from pydantic import BaseModel, Field, BeforeValidator

PyObjectId = Annotated[str, BeforeValidator(str)]

class WorkoutIntensity(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"

class ExerciseDetail(BaseModel):
    name: str = Field(..., min_length=1, description="Exercise name e.g., squat, running")
    sets: int = Field(..., gt=0, description="Number of sets performed")
    reps: int = Field(..., gt=0, description="Reps per set")
    weight_kg: float = Field(..., ge=0, description="Weight used in kilograms")
    met_value: float = Field(..., ge=0, description="MET value of the exercise")
    duration_minutes: Optional[float] = Field(default=None, description="Optional duration in minutes (if omitted, estimated based on sets)")

class WorkoutCreate(BaseModel):
    user_id: str = Field(..., min_length=1, description="String representation of User ObjectId")
    exercises: List[ExerciseDetail] = Field(..., min_length=1, description="List of exercises in the workout")

class WorkoutResponse(BaseModel):
    workout_id: str
    total_calories_burned: float
    intensity_score: WorkoutIntensity

class WorkoutDB(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    user_id: str
    date: datetime = Field(default_factory=datetime.utcnow)
    exercises: List[ExerciseDetail]
    total_calories_burned: float
    intensity_score: WorkoutIntensity

    model_config = {
        "populate_by_name": True
    }
