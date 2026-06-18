import os
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from models.chat import ChatRequest, ChatResponse, ChatMessage, ChatRole
from database import get_db
from routes.user import verify_user_exists
from routes.workout import get_today_start

router = APIRouter()

def generate_local_chat_reply(message: str, stats: dict) -> str:
    """
    Local context-aware rule-based chat fallback.
    Reads today's stats to answer questions about calories, macros, workouts, and sleep.
    """
    msg = message.lower().strip()
    
    # Extract stats variables
    user_goal = stats.get("goal", "maintain").replace("_", " ")
    weight = stats.get("weight", 70.0)
    consumed_cal = stats.get("consumed_cal", 0.0)
    burned_cal = stats.get("burned_cal", 0.0)
    sleep = stats.get("sleep", 0.0)
    exercises = stats.get("exercises", [])
    
    # 1. Greetings
    if any(greet in msg for greet in ["hello", "hi", "hey", "hola"]):
        return (
            f"Hello! I am your AI fitness coach. Today your goal is to {user_goal}. "
            f"You've logged {consumed_cal} kcal consumed and burned {burned_cal} kcal through workouts. "
            "How can I help you with your training or nutrition today?"
        )
        
    # 2. Calories or Food query
    elif any(kw in msg for kw in ["calorie", "calories", "food", "eat", "ate", "hungry"]):
        return (
            f"Today you have consumed {consumed_cal} kcal and burned {burned_cal} kcal. "
            f"Your current daily goal is '{user_goal}'. If you're planning your next meal, "
            "I suggest focusing on nutrient-dense foods that fit your daily target macros."
        )
        
    # 3. Protein or Macros query
    elif any(kw in msg for kw in ["protein", "carb", "carbs", "fat", "macro", "macros"]):
        return (
            f"For your goal of {user_goal} at {weight}kg weight, keeping a close eye on macros is key. "
            f"Consuming lean proteins (chicken, fish, tofu) and complex carbs (rice, sweet potatoes) "
            "will help maintain energy levels. What meal are you planning next?"
        )
        
    # 4. Workout or Exercises query
    elif any(kw in msg for kw in ["workout", "exercise", "train", "gym", "squat", "curl"]):
        if exercises:
            exercise_list = ", ".join(exercises)
            return (
                f"You did a great job logging workouts today! You completed: {exercise_list}, "
                f"burning approximately {burned_cal} kcal. Make sure to hydrate and stretch properly "
                "to aid muscle recovery."
            )
        else:
            return (
                "You haven't logged any workouts today yet. I recommend starting with some resistance training "
                "or a light cardio session depending on your energy levels. What do you feel like doing today?"
            )
            
    # 5. Sleep or Tiredness query
    elif any(kw in msg for kw in ["sleep", "tired", "rest", "fatigue", "recovery"]):
        if sleep == 0:
            return (
                "I don't have today's sleep log yet. Make sure to log your sleep. If you are feeling tired, "
                "it's always safer to prioritize rest or choose a lighter active recovery workout."
            )
        elif sleep < 6.0:
            return (
                f"You only got {sleep} hours of sleep last night. This can impact strength and recovery. "
                "I suggest a light workout or a rest day today, and focus on getting to bed earlier tonight!"
            )
        else:
            return (
                f"You logged {sleep} hours of sleep, which is excellent recovery. You should have good "
                "energy levels for training today. Push hard but maintain proper form!"
            )
            
    # Default fallback
    return (
        f"As your coach, I'm here to support your '{user_goal}' journey. Feel free to ask me about "
        "modifying your workouts, hitting your macro targets, or optimizing your recovery routines!"
    )

async def generate_gemini_chat_reply(api_key: str, message: str, history: list, stats: dict) -> str:
    """
    Queries Gemini for an interactive chat response using conversation history and user stats.
    """
    try:
        import google.generativeai as genai
        genai.configure(api_key=api_key)
        
        # Build chat sessions or feed it as a single request
        # Convert history list to a system-defined chat structure
        # In Gemini python SDK, we can use model.start_chat(history=...)
        # We need to map role: 'user' -> 'user', 'ai' -> 'model'
        gemini_history = []
        for msg in history:
            role = "user" if msg.role == ChatRole.user else "model"
            gemini_history.append({
                "role": role,
                "parts": [msg.content]
            })
            
        system_instruction = (
            f"You are an expert AI fitness coach and sports nutritionist. You are chat-conversing "
            f"with a user. Be supportive, scientific, concise, and clear.\n"
            f"User Profile & Today's Stats:\n"
            f"- Goal: {stats.get('goal')}\n"
            f"- Weight: {stats.get('weight')} kg\n"
            f"- Calories Consumed today: {stats.get('consumed_cal')} kcal\n"
            f"- Calories Burned today: {stats.get('burned_cal')} kcal\n"
            f"- Sleep logged: {stats.get('sleep')} hours\n"
            f"- Workouts done today: {', '.join(stats.get('exercises')) if stats.get('exercises') else 'None'}\n"
            f"Ensure your responses address the user's message in a helpful, personalized manner."
        )
        
        model = genai.GenerativeModel(
            model_name='gemini-1.5-flash',
            system_instruction=system_instruction
        )
        
        chat = model.start_chat(history=gemini_history)
        response = await chat.send_message_async(message)
        
        if response and response.text:
            return response.text.strip()
    except Exception as e:
        print(f"Gemini Chat Reply invocation failed: {e}. Falling back to rule-based engine.")
    return ""

@router.post("/chat-reply", response_model=ChatResponse, status_code=status.HTTP_200_OK)
async def chat_reply(chat_req: ChatRequest, db = Depends(get_db)):
    """
    Logs user chat, computes a context-rich reply using current day statistics,
    and updates chat session logs in the database.
    """
    # 1. Verify user exists
    user = await verify_user_exists(chat_req.user_id, db)
    weight_kg = user.get("weight_kg", 70.0)
    goal = user.get("goal", "maintain")
    
    # 2. Retrieve today's stats for coaching context
    today_start = get_today_start()
    log = await db.daily_logs.find_one({"user_id": chat_req.user_id, "date": today_start})
    
    # Fetch exercise names for today
    tomorrow_start = today_start + timedelta(days=1)
    workouts_cursor = db.workouts.find({
        "user_id": chat_req.user_id,
        "date": {"$gte": today_start, "$lt": tomorrow_start}
    })
    workouts = await workouts_cursor.to_list(length=100)
    exercises = []
    for w in workouts:
        for ex in w.get("exercises", []):
            exercises.append(ex.get("name"))
            
    stats = {
        "goal": goal,
        "weight": weight_kg,
        "consumed_cal": log.get("total_calories_consumed", 0.0) if log else 0.0,
        "burned_cal": log.get("calories_burned", 0.0) if log else 0.0,
        "sleep": log.get("sleep_hours", 0.0) if log else 0.0,
        "exercises": exercises
    }
    
    # 3. Process conversation history
    history = chat_req.conversation_history
    
    # Append the new user message
    user_msg = ChatMessage(role=ChatRole.user, content=chat_req.message, timestamp=datetime.utcnow())
    history.append(user_msg)
    
    # 4. Generate AI Reply
    api_key = os.getenv("GEMINI_API_KEY")
    ai_reply_text = ""
    
    if api_key:
        ai_reply_text = await generate_gemini_chat_reply(api_key, chat_req.message, history[:-1], stats)
        
    if not ai_reply_text:
        ai_reply_text = generate_local_chat_reply(chat_req.message, stats)
        
    # Append the AI response to the history
    ai_msg = ChatMessage(role=ChatRole.ai, content=ai_reply_text, timestamp=datetime.utcnow())
    history.append(ai_msg)
    
    # 5. Persist/Update chat history collection
    chat_db_entry = await db.chat_history.find_one({"user_id": chat_req.user_id, "date": today_start})
    
    # Serialize messages list to dicts
    messages_dump = [msg.model_dump() for msg in history]
    
    try:
        if not chat_db_entry:
            # Create a new document for today
            new_chat_log = {
                "user_id": chat_req.user_id,
                "date": today_start,
                "messages": messages_dump
            }
            await db.chat_history.insert_one(new_chat_log)
        else:
            # Update history by saving the entire updated list
            await db.chat_history.update_one(
                {"user_id": chat_req.user_id, "date": today_start},
                {"$set": {"messages": messages_dump}}
            )
            
        return ChatResponse(
            ai_reply=ai_reply_text,
            updated_history=history
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to process chat: {str(e)}"
        )
