import uvicorn
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.ai_insights import router as ai_router
from database import connect_to_mongo, close_mongo_connection
from routes import (
    user,
    workout,
    meal,
    summary,
    recommendation,
    chat,
    recovery,
    insights,
    pose,
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Connect to MongoDB on startup
    await connect_to_mongo()
    yield
    # Close connection on shutdown
    await close_mongo_connection()

app = FastAPI(
    title="Fitness & Nutrition AI Backend",
    description="FastAPI + Motor (MongoDB) backend service facilitating mobile workouts, macro goals, AI recommendations, and pose validation.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS configuration (tailored for React Native, allowing all origins, credentials, methods, and headers)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all API routers
app.include_router(user.router, tags=["User Setup"])
app.include_router(workout.router, tags=["Workouts"])
app.include_router(meal.router, tags=["Meals"])
app.include_router(summary.router, tags=["Summary"])
app.include_router(recommendation.router, tags=["AI Recommendation"])
app.include_router(chat.router, tags=["AI Chat Coach"])
app.include_router(recovery.router, tags=["Recovery & Sleep"])
app.include_router(insights.router, tags=["Weekly Insights"])
app.include_router(pose.router, tags=["Real-time Pose Feedback"])
app.include_router(ai_router, tags=["AI Insights"])  

@app.get("/", tags=["Health"])
async def root():
    return {
        "status": "healthy",
        "service": "Fitness & Nutrition AI App Backend",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
