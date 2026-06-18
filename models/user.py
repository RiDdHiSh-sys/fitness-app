from datetime import datetime
from enum import Enum
from typing import Annotated, Optional
from pydantic import BaseModel, Field, BeforeValidator

# Custom type for handling MongoDB ObjectIds in Pydantic v2
PyObjectId = Annotated[str, BeforeValidator(str)]

class UserGoal(str, Enum):
    lose_weight = "lose_weight"
    build_muscle = "build_muscle"
    maintain = "maintain"

class UserCreate(BaseModel):
    name: str = Field(..., min_length=1, description="Name of the user")
    age: int = Field(..., gt=0, le=120, description="Age of the user in years")
    weight_kg: float = Field(..., gt=0, le=500, description="Weight in kilograms")
    height_cm: float = Field(..., gt=0, le=300, description="Height in centimeters")
    goal: UserGoal = Field(..., description="Fitness goal: lose_weight, build_muscle, or maintain")

class UserResponse(BaseModel):
    user_id: str
    message: str

class UserDB(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    name: str
    age: int
    weight_kg: float
    height_cm: float
    goal: UserGoal
    created_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = {
        "populate_by_name": True,
        "json_schema_extra": {
            "example": {
                "name": "Jane Doe",
                "age": 28,
                "weight_kg": 65.5,
                "height_cm": 168.0,
                "goal": "lose_weight"
            }
        }
    }
