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
    email: str = Field(..., min_length=3, max_length=100, description="Email address of the user")
    password: str = Field(..., min_length=6, description="Password (minimum 6 characters)")
    name: str = Field(..., min_length=1, description="Name of the user")
    age: int = Field(..., gt=0, le=120, description="Age of the user in years")
    weight_kg: float = Field(..., gt=0, le=500, description="Weight in kilograms")
    height_cm: float = Field(..., gt=0, le=300, description="Height in centimeters")
    goal: UserGoal = Field(..., description="Fitness goal: lose_weight, build_muscle, or maintain")

class UserLogin(BaseModel):
    email: str = Field(..., description="User's registered email address")
    password: str = Field(..., description="User's password")

class OAuthLogin(BaseModel):
    provider: str = Field(..., description="OAuth provider name (e.g., google)")
    token: str = Field(..., description="OAuth ID token/credential token")
    # Optional profile inputs for auto-registration
    name: Optional[str] = Field(default=None, description="Optional name for new users")
    age: Optional[int] = Field(default=None, gt=0, le=120, description="Optional age for new users")
    weight_kg: Optional[float] = Field(default=None, gt=0, le=500, description="Optional weight for new users")
    height_cm: Optional[float] = Field(default=None, gt=0, le=300, description="Optional height for new users")
    goal: Optional[UserGoal] = Field(default=None, description="Optional goal for new users")

class UserResponse(BaseModel):
    user_id: str
    message: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    is_new_user: Optional[bool] = None

class UserDB(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    email: str
    hashed_password: Optional[str] = Field(default=None, description="Hashed password for email login")
    oauth_provider: Optional[str] = Field(default=None, description="OAuth provider name")
    oauth_id: Optional[str] = Field(default=None, description="Unique OAuth provider subject ID")
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
                "email": "jane@example.com",
                "name": "Jane Doe",
                "age": 28,
                "weight_kg": 65.5,
                "height_cm": 168.0,
                "goal": "lose_weight"
            }
        }
    }
