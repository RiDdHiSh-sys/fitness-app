import urllib.request
import json
import time

BASE_URL = "http://127.0.0.1:8000"

def send_request(path, method="GET", body=None):
    url = f"{BASE_URL}{path}"
    headers = {"Content-Type": "application/json"}
    data = json.dumps(body).encode("utf-8") if body else None
    
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as response:
            res_body = response.read().decode("utf-8")
            return response.status, json.loads(res_body) if res_body else {}
    except urllib.error.HTTPError as e:
        res_body = e.read().decode("utf-8")
        try:
            return e.code, json.loads(res_body) if res_body else {}
        except Exception:
            return e.code, {"error": res_body}
    except Exception as e:
        return 0, {"error": str(e)}

def run_tests():
    print("==================================================")
    print("   Fitness & Nutrition AI App Backend API Tests   ")
    print("==================================================")
    
    # Check if server is running
    status, res = send_request("/")
    if status != 200:
        print(f"[-] Root check failed: status {status}. Is the FastAPI server running?")
        print("    Please start the server first using: uvicorn main:app --reload")
        return
    print(f"[+] Server is healthy: {res}")
    
    user_id = None
    
    # 1. Test POST /user (Success)
    print("\n[1] Testing POST /user...")
    user_payload = {
        "name": "Jane Doe",
        "age": 28,
        "weight_kg": 65.5,
        "height_cm": 168.0,
        "goal": "lose_weight"
    }
    status, res = send_request("/user", "POST", user_payload)
    if status == 201:
        user_id = res.get("user_id")
        print(f"[+] User created successfully. ID: {user_id}")
    else:
        print(f"[-] User creation failed: status {status}, response: {res}")
        return

    # 2. Test POST /user (Validation Error - Goal Enum)
    print("\n[2] Testing POST /user with invalid goal...")
    bad_user_payload = user_payload.copy()
    bad_user_payload["goal"] = "get_shredded" # Invalid goal enum
    status, res = send_request("/user", "POST", bad_user_payload)
    if status == 422:
        print(f"[+] Handled validation error correctly (422 Unprocessable Entity)")
    else:
        print(f"[-] Failed to catch validation error: status {status}, response: {res}")

    # 3. Test POST /workout
    print("\n[3] Testing POST /workout...")
    workout_payload = {
        "user_id": user_id,
        "exercises": [
            {
                "name": "squat",
                "sets": 4,
                "reps": 10,
                "weight_kg": 50.0,
                "met_value": 5.0,
                "duration_minutes": 15.0
            },
            {
                "name": "bicep_curl",
                "sets": 3,
                "reps": 12,
                "weight_kg": 15.0,
                "met_value": 3.5
            }
        ]
    }
    status, res = send_request("/workout", "POST", workout_payload)
    if status == 201:
        print(f"[+] Workout logged. Calories burned: {res.get('total_calories_burned')}, Intensity: {res.get('intensity_score')}")
    else:
        print(f"[-] Workout logging failed: status {status}, response: {res}")

    # 4. Test POST /meal
    print("\n[4] Testing POST /meal...")
    meal_payload = {
        "user_id": user_id,
        "items": [
            {
                "name": "Oatmeal with Protein",
                "calories": 350.0,
                "protein_g": 30.0,
                "carbs_g": 45.0,
                "fat_g": 5.0,
                "source": "manual"
            },
            {
                "name": "Banana",
                "calories": 105.0,
                "protein_g": 1.3,
                "carbs_g": 27.0,
                "fat_g": 0.3,
                "source": "text"
            }
        ]
    }
    status, res = send_request("/meal", "POST", meal_payload)
    if status == 201:
        print(f"[+] Meal logged. Calories: {res.get('total_calories')}, Protein: {res.get('total_protein')}g, Carbs: {res.get('total_carbs')}g, Fat: {res.get('total_fat')}g")
    else:
        print(f"[-] Meal logging failed: status {status}, response: {res}")

    # 5. Test POST /sleep
    print("\n[5] Testing POST /sleep...")
    sleep_payload = {
        "user_id": user_id,
        "sleep_hours": 7.5
    }
    status, res = send_request("/sleep", "POST", sleep_payload)
    if status == 200:
        print(f"[+] Sleep logged. Hours: {res.get('sleep_hours')}")
    else:
        print(f"[-] Sleep logging failed: status {status}, response: {res}")

    # 6. Test GET /today-summary/{user_id}
    print("\n[6] Testing GET /today-summary...")
    status, res = send_request(f"/today-summary/{user_id}")
    if status == 200:
        print(f"[+] Summary retrieved successfully.")
        print(f"    - Goal: {res.get('user', {}).get('goal')}")
        print(f"    - Consumed: {res.get('meals', {}).get('calories_consumed')} kcal")
        print(f"    - Burned: {res.get('workout', {}).get('calories_burned')} kcal")
        print(f"    - Remaining calories: {res.get('remaining', {}).get('calories')} kcal")
        print(f"    - Sleep: {res.get('sleep_hours')} hours")
    else:
        print(f"[-] Summary failed: status {status}, response: {res}")

    # 7. Test GET /ai-recommendation/{user_id}
    print("\n[7] Testing GET /ai-recommendation...")
    status, res = send_request(f"/ai-recommendation/{user_id}")
    if status == 200:
        print(f"[+] AI Recommendation retrieved.")
        print(f"    - Recommendation: {res.get('recommendation')}")
    else:
        print(f"[-] Recommendation failed: status {status}, response: {res}")

    # 8. Test POST /chat-reply
    print("\n[8] Testing POST /chat-reply...")
    chat_payload = {
        "user_id": user_id,
        "message": "Should I eat some protein now?",
        "conversation_history": [
            {"role": "user", "content": "Hi", "timestamp": "2026-06-18T10:00:00Z"},
            {"role": "ai", "content": "Hello! I am your AI fitness coach. How can I help you?", "timestamp": "2026-06-18T10:00:05Z"}
        ]
    }
    status, res = send_request("/chat-reply", "POST", chat_payload)
    if status == 200:
        print(f"[+] Chat Coach Reply: {res.get('ai_reply')}")
        print(f"    - Messages in history: {len(res.get('updated_history'))}")
    else:
        print(f"[-] Chat reply failed: status {status}, response: {res}")

    # 9. Test GET /recovery-score/{user_id}
    print("\n[9] Testing GET /recovery-score...")
    status, res = send_request(f"/recovery-score/{user_id}")
    if status == 200:
        print(f"[+] Recovery Score: {res.get('score')} ({res.get('label')})")
        print(f"    - Reason: {res.get('reason')}")
    else:
        print(f"[-] Recovery score failed: status {status}, response: {res}")

    # 10. Test GET /weekly-insights/{user_id}
    print("\n[10] Testing GET /weekly-insights...")
    status, res = send_request(f"/weekly-insights/{user_id}")
    if status == 200:
        print(f"[+] Weekly Insights retrieved. Days logged: {res.get('days_logged')}")
        print(f"    - Average Calories Burned: {res.get('avg_calories_burned')}")
        print(f"    - Best Day: {res.get('best_day')}")
    else:
        print(f"[-] Weekly insights failed: status {status}, response: {res}")

    # 11. Test POST /pose-feedback (Squat)
    print("\n[11] Testing POST /pose-feedback (Squat Form)...")
    pose_payload = {
        "user_id": user_id,
        "exercise": "squat",
        "knee_angle": 120.0, # Shallow squat
        "elbow_angle": 90.0,
        "back_angle": 75.0
    }
    status, res = send_request("/pose-feedback", "POST", pose_payload)
    if status == 200:
        print(f"[+] Pose Squat Feedback. Correct: {res.get('is_correct')}")
        print(f"    - Feedback: {res.get('feedback')}")
        print(f"    - Correction: {res.get('correction')}")
    else:
        print(f"[-] Pose feedback failed: status {status}, response: {res}")

    # 12. Test POST /pose-feedback (Bicep Curl)
    print("\n[12] Testing POST /pose-feedback (Bicep Curl Form)...")
    pose_payload_curl = {
        "user_id": user_id,
        "exercise": "bicep_curl",
        "knee_angle": 180.0,
        "elbow_angle": 35.0, # Full curl
        "back_angle": 60.0 # Torso swinging
    }
    status, res = send_request("/pose-feedback", "POST", pose_payload_curl)
    if status == 200:
        print(f"[+] Pose Curl Feedback. Correct: {res.get('is_correct')}")
        print(f"    - Feedback: {res.get('feedback')}")
        print(f"    - Correction: {res.get('correction')}")
    else:
        print(f"[-] Pose feedback failed: status {status}, response: {res}")

    # 13. Test Error Handlers: 404 User Not Found
    print("\n[13] Testing GET /today-summary for non-existent User ID...")
    fake_user_id = "649c25f9b4c09d0d8299a9aa"
    status, res = send_request(f"/today-summary/{fake_user_id}")
    if status == 404:
        print(f"[+] Successfully returned 404 Not Found error message: {res.get('detail')}")
    else:
        print(f"[-] Failed to return 404: status {status}, response: {res}")

    # 14. Test Error Handlers: 400 Bad Request (Invalid Hex User ID)
    print("\n[14] Testing GET /today-summary with invalid user_id format...")
    invalid_user_id = "short_id"
    status, res = send_request(f"/today-summary/{invalid_user_id}")
    if status == 400:
        print(f"[+] Successfully returned 400 Bad Request error message: {res.get('detail')}")
    else:
        print(f"[-] Failed to return 400: status {status}, response: {res}")

    print("\n==================================================")
    print("            All API Tests Completed               ")
    print("==================================================")

if __name__ == "__main__":
    run_tests()
