import urllib.request
import json
import time

BASE_URL = "http://127.0.0.1:8000"

def send_request(path, method="GET", body=None, token=None):
    url = f"{BASE_URL}{path}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
        
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
    print("   (With JWT Token Authentication & Google OAuth) ")
    print("==================================================")
    
    # Check if server is running
    status, res = send_request("/")
    if status != 200:
        print(f"[-] Root health check failed: status {status}. Is the FastAPI server running?")
        print("    Please start the server first using: uvicorn main:app --reload")
        return
    print(f"[+] Server is healthy: {res}")
    
    # Generate unique emails
    timestamp = int(time.time())
    email_a = f"user_a_{timestamp}@example.com"
    email_b = f"user_b_{timestamp}@example.com"
    password = "secretpassword123"
    
    user_id_a = None
    token_a = None
    
    user_id_b = None
    token_b = None

    # 1. Test POST /user (Registration Success for User A)
    print("\n[1] Testing POST /user (Registration User A)...")
    user_payload_a = {
        "email": email_a,
        "password": password,
        "name": "User A",
        "age": 28,
        "weight_kg": 65.5,
        "height_cm": 168.0,
        "goal": "lose_weight"
    }
    status, res = send_request("/user", "POST", user_payload_a)
    if status == 201:
        user_id_a = res.get("user_id")
        print(f"[+] User A registered successfully. ID: {user_id_a}")
    else:
        print(f"[-] User A registration failed: status {status}, response: {res}")
        return

    # 2. Test POST /user (Email conflict check)
    print("\n[2] Testing POST /user (Duplicate Email Conflict)...")
    status, res = send_request("/user", "POST", user_payload_a)
    if status == 400 and "already registered" in res.get("detail", "").lower():
        print(f"[+] Email conflict handled correctly: 400 Bad Request ({res.get('detail')})")
    else:
        print(f"[-] Failed to catch email conflict: status {status}, response: {res}")

    # 3. Test POST /user/login (Login Success for User A)
    print("\n[3] Testing POST /user/login (Login User A)...")
    login_payload = {
        "email": email_a,
        "password": password
    }
    status, res = send_request("/user/login", "POST", login_payload)
    if status == 200:
        token_a = res.get("access_token")
        print(f"[+] User A logged in successfully. Token: {token_a[:15]}...")
    else:
        print(f"[-] Login failed: status {status}, response: {res}")
        return

    # 4. Test POST /user/login (Incorrect Credentials check)
    print("\n[4] Testing POST /user/login (Incorrect Password)...")
    bad_login_payload = {
        "email": email_a,
        "password": "wrongpassword"
    }
    status, res = send_request("/user/login", "POST", bad_login_payload)
    if status == 400:
        print(f"[+] Incorrect credentials handled correctly: 400 Bad Request")
    else:
        print(f"[-] Failed to catch bad login credentials: status {status}, response: {res}")

    # 5. Test POST /user/oauth-login (Google OAuth Auto-Registration User B)
    print("\n[5] Testing POST /user/oauth-login (Google OAuth)...")
    oauth_payload = {
        "provider": "google",
        "token": "mock-google-token-jane",
        "age": 30,
        "weight_kg": 80.0,
        "height_cm": 180.0,
        "goal": "build_muscle"
    }
    status, res = send_request("/user/oauth-login", "POST", oauth_payload)
    if status == 200:
        token_b = res.get("access_token")
        user_id_b = res.get("user_id")
        is_new = res.get("is_new_user")
        print(f"[+] Google User B authenticated successfully. ID: {user_id_b}, New User: {is_new}, Token: {token_b[:15]}...")
    else:
        print(f"[-] Google OAuth login failed: status {status}, response: {res}")
        return

    # 6. Test Route Protection (Summary Endpoint without Token)
    print("\n[6] Testing GET /today-summary/{id} (Access without Token)...")
    status, res = send_request(f"/today-summary/{user_id_a}")
    if status == 401:
        print(f"[+] Access blocked correctly (401 Unauthorized)")
    else:
        print(f"[-] Failed to protect endpoint: status {status}, response: {res}")

    # 7. Test Cross-User Access Protection (User A attempting to access User B's dashboard)
    print("\n[7] Testing GET /today-summary/{id} (Cross-User Access Verification)...")
    status, res = send_request(f"/today-summary/{user_id_b}", "GET", token=token_a)
    if status == 403:
        print(f"[+] Cross-user access blocked correctly: 403 Forbidden ({res.get('detail')})")
    else:
        print(f"[-] Failed to protect cross-user access: status {status}, response: {res}")

    # 8. Test POST /workout (Authorized using Token A)
    print("\n[8] Testing POST /workout...")
    workout_payload = {
        "user_id": user_id_a,
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
    status, res = send_request("/workout", "POST", workout_payload, token=token_a)
    if status == 201:
        print(f"[+] Workout logged. Calories: {res.get('total_calories_burned')}, Intensity: {res.get('intensity_score')}")
    else:
        print(f"[-] Workout logging failed: status {status}, response: {res}")

    # 9. Test POST /meal (Authorized using Token A)
    print("\n[9] Testing POST /meal...")
    meal_payload = {
        "user_id": user_id_a,
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
    status, res = send_request("/meal", "POST", meal_payload, token=token_a)
    if status == 201:
        print(f"[+] Meal logged. Calories: {res.get('total_calories')}, Protein: {res.get('total_protein')}g")
    else:
        print(f"[-] Meal logging failed: status {status}, response: {res}")

    # 10. Test POST /sleep (Authorized using Token A)
    print("\n[10] Testing POST /sleep...")
    sleep_payload = {
        "user_id": user_id_a,
        "sleep_hours": 7.5
    }
    status, res = send_request("/sleep", "POST", sleep_payload, token=token_a)
    if status == 200:
        print(f"[+] Sleep logged. Hours: {res.get('sleep_hours')}")
    else:
        print(f"[-] Sleep logging failed: status {status}, response: {res}")

    # 11. Test GET /today-summary/{id} (Authorized using Token A)
    print("\n[11] Testing GET /today-summary...")
    status, res = send_request(f"/today-summary/{user_id_a}", token=token_a)
    if status == 200:
        print(f"[+] Summary retrieved. Calories consumed: {res.get('meals', {}).get('calories_consumed')} kcal, remaining: {res.get('remaining', {}).get('calories')} kcal")
    else:
        print(f"[-] Summary retrieval failed: status {status}, response: {res}")

    # 12. Test GET /ai-recommendation/{id} (Authorized using Token A)
    print("\n[12] Testing GET /ai-recommendation...")
    status, res = send_request(f"/ai-recommendation/{user_id_a}", token=token_a)
    if status == 200:
        print(f"[+] Recommendation text: {res.get('recommendation')}")
    else:
        print(f"[-] Recommendation failed: status {status}, response: {res}")

    # 13. Test POST /chat-reply (Authorized using Token A)
    print("\n[13] Testing POST /chat-reply...")
    chat_payload = {
        "user_id": user_id_a,
        "message": "What should I eat for dinner?",
        "conversation_history": []
    }
    status, res = send_request("/chat-reply", "POST", chat_payload, token=token_a)
    if status == 200:
        print(f"[+] Chat Coach Reply: {res.get('ai_reply')}")
    else:
        print(f"[-] Chat failed: status {status}, response: {res}")

    # 14. Test GET /recovery-score/{id} (Authorized using Token A)
    print("\n[14] Testing GET /recovery-score...")
    status, res = send_request(f"/recovery-score/{user_id_a}", token=token_a)
    if status == 200:
        print(f"[+] Recovery Score: {res.get('score')} ({res.get('label')})")
    else:
        print(f"[-] Recovery score failed: status {status}, response: {res}")

    # 15. Test GET /weekly-insights/{id} (Authorized using Token A)
    print("\n[15] Testing GET /weekly-insights...")
    status, res = send_request(f"/weekly-insights/{user_id_a}", token=token_a)
    if status == 200:
        print(f"[+] Weekly Insights retrieved. Average calories burned: {res.get('avg_calories_burned')}")
    else:
        print(f"[-] Weekly insights failed: status {status}, response: {res}")

    # 16. Test POST /pose-feedback (Authorized using Token A)
    print("\n[16] Testing POST /pose-feedback...")
    pose_payload = {
        "user_id": user_id_a,
        "exercise": "squat",
        "knee_angle": 120.0,
        "elbow_angle": 90.0,
        "back_angle": 75.0
    }
    status, res = send_request("/pose-feedback", "POST", pose_payload, token=token_a)
    if status == 200:
        print(f"[+] Pose Squat Feedback. Correct: {res.get('is_correct')}, Feedback: {res.get('feedback')}")
    else:
        print(f"[-] Pose feedback failed: status {status}, response: {res}")

    print("\n==================================================")
    print("            All API Tests Completed               ")
    print("==================================================")

if __name__ == "__main__":
    run_tests()
