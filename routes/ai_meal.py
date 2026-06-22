import os
import json

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from google import genai

router = APIRouter()

client = genai.Client(
    api_key=os.getenv("GOOGLE_API_KEY")
)

class MealSuggestionRequest(BaseModel):
    age: int
    weight: float
    goal: str
    diet_type: str


@router.post("/ai-meal")
async def get_ai_meal_plan(data: MealSuggestionRequest):

    prompt = f"""
You are an expert nutrition coach.

User Details:

Age: {data.age}
Weight: {data.weight}
Goal: {data.goal}
Diet Type: {data.diet_type}

Return ONLY valid JSON.

{{
    "breakfast": "",
    "lunch": "",
    "dinner": "",
    "snacks": ""
}}
"""

    try:

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )

        return json.loads(response.text)

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )