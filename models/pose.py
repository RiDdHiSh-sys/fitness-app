from datetime import datetime
from enum import Enum
from typing import Annotated, List, Optional
from pydantic import BaseModel, Field, BeforeValidator

PyObjectId = Annotated[str, BeforeValidator(str)]

class PoseExercise(str, Enum):
    squat = "squat"
    bicep_curl = "bicep_curl"

class PoseFrameData(BaseModel):
    frame: int = Field(..., ge=1, description="Frame index of the pose stream")
    knee_angle: float = Field(..., description="Detected knee angle in degrees")
    elbow_angle: float = Field(..., description="Detected elbow angle in degrees")
    back_angle: float = Field(..., description="Detected back angle in degrees")
    feedback: str = Field(..., description="AI feedback for this specific frame")

class PoseFeedbackRequest(BaseModel):
    user_id: str = Field(..., min_length=1, description="String representation of User ObjectId")
    exercise: PoseExercise = Field(..., description="Exercise being tracked: squat or bicep_curl")
    knee_angle: float = Field(..., description="Current knee angle in degrees")
    elbow_angle: float = Field(..., description="Current elbow angle in degrees")
    back_angle: float = Field(..., description="Current back angle in degrees")

class PoseFeedbackResponse(BaseModel):
    feedback: str
    is_correct: bool
    correction: str

class PoseSessionDB(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    user_id: str
    exercise: PoseExercise
    date: datetime = Field(default_factory=datetime.utcnow)
    angle_data: List[PoseFrameData] = Field(default=[])

    model_config = {
        "populate_by_name": True
    }
