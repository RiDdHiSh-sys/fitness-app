from datetime import datetime
from enum import Enum
from typing import Annotated, List, Optional
from pydantic import BaseModel, Field, BeforeValidator

PyObjectId = Annotated[str, BeforeValidator(str)]

class MealSource(str, Enum):
    photo = "photo"
    text = "text"
    manual = "manual"

class MealItem(BaseModel):
    name: str = Field(..., min_length=1, description="Food name e.g., Chicken Breast, Oats")
    calories: float = Field(..., ge=0, description="Calories in kcal")
    protein_g: float = Field(..., ge=0, description="Protein content in grams")
    carbs_g: float = Field(..., ge=0, description="Carbs content in grams")
    fat_g: float = Field(..., ge=0, description="Fat content in grams")
    source: MealSource = Field(..., description="Method used to log meal: photo, text, or manual")

class MealCreate(BaseModel):
    user_id: str = Field(..., min_length=1, description="String representation of User ObjectId")
    items: List[MealItem] = Field(..., min_length=1, description="Food items logged in this meal")

class MealResponse(BaseModel):
    meal_id: str
    total_calories: float
    total_protein: float
    total_carbs: float
    total_fat: float

class MealDB(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    user_id: str
    date: datetime = Field(default_factory=datetime.utcnow)
    items: List[MealItem]

    model_config = {
        "populate_by_name": True
    }
