from datetime import datetime
from enum import Enum
from typing import Annotated, List, Optional
from pydantic import BaseModel, Field, BeforeValidator

PyObjectId = Annotated[str, BeforeValidator(str)]

class ChatRole(str, Enum):
    user = "user"
    ai = "ai"

class ChatMessage(BaseModel):
    role: ChatRole = Field(..., description="Role of message sender: user or ai")
    content: str = Field(..., min_length=1, description="Message text")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Time of message")

class ChatRequest(BaseModel):
    user_id: str = Field(..., min_length=1, description="String representation of User ObjectId")
    message: str = Field(..., min_length=1, description="User's new message")
    conversation_history: List[ChatMessage] = Field(default=[], description="Previous message history")

class ChatResponse(BaseModel):
    ai_reply: str
    updated_history: List[ChatMessage]

class ChatHistoryDB(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    user_id: str
    date: datetime # normalized date at 00:00:00 UTC
    messages: List[ChatMessage]

    model_config = {
        "populate_by_name": True
    }
