from google import genai

import os
from bson import ObjectId
from dotenv import load_dotenv

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from database import get_db
from routes.user import get_current_user_id

oad_dotenv()

router = APIRouter(prefix="/coach", tags=["AI Coach"])

client = genai.Client(
    api_key=os.getenv("GOOGLE_API_KEY")
)


class CoachRequest(BaseModel):
    question: str


class CoachResponse(BaseModel):
    answer: str


@router.post("/", response_model=CoachResponse)
async def fitness_coach(
    request: CoachRequest,
    current_user_id: str = Depends(get_current_user_id),
    db=Depends(get_db)
):

    # Fetch logged-in user
    user = await db.users.find_one(
        {"_id": ObjectId(current_user_id)}
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    age = user.get("age", "Unknown")
    weight = user.get("weight_kg", "Unknown")
    height = user.get("height_cm", "Unknown")
    goal = user.get("goal", "maintain")
    name = user.get("name", "User")

    prompt = f"""
You are an expert AI Fitness Coach.

User Profile:
Name: {name}
Age: {age}
Weight: {weight} kg
Height: {height} cm
Goal: {goal}

User Question:
{request.question}

Instructions:
- Give personalized fitness advice.
- Use the user's goal.
- Mention protein recommendations if relevant.
- Mention calorie recommendations if relevant.
- Keep the answer practical.
- Do not give medical diagnoses.
"""

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )

        return CoachResponse(
            answer=response.text
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Gemini Error: {str(e)}"
        )