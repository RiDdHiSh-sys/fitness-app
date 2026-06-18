# utils/macro_calc.py

def calculate_daily_targets(weight_kg: float, goal: str) -> dict:
    """
    Calculates daily macronutrient targets in grams based on ICMR guidelines:
    - lose_weight: protein=1.8g/kg, carbs=3g/kg, fat=0.8g/kg
    - build_muscle: protein=2.2g/kg, carbs=4g/kg, fat=1g/kg
    - maintain: protein=1.6g/kg, carbs=3.5g/kg, fat=0.9g/kg
    
    Returns target dict including calories:
    {
      "protein": float,
      "carbs": float,
      "fat": float,
      "calories": float
    }
    """
    goal = goal.strip().lower()
    
    if goal == "lose_weight":
        p_factor, c_factor, f_factor = 1.8, 3.0, 0.8
    elif goal == "build_muscle":
        p_factor, c_factor, f_factor = 2.2, 4.0, 1.0
    else: # maintain or default
        p_factor, c_factor, f_factor = 1.6, 3.5, 0.9

    protein = p_factor * weight_kg
    carbs = c_factor * weight_kg
    fat = f_factor * weight_kg
    
    # 1g Protein = 4 kcal, 1g Carb = 4 kcal, 1g Fat = 9 kcal
    calories = (protein * 4.0) + (carbs * 4.0) + (fat * 9.0)

    return {
        "protein": round(protein, 1),
        "carbs": round(carbs, 1),
        "fat": round(fat, 1),
        "calories": round(calories, 1)
    }

def calculate_recovery_score(sleep_hours: float, intensity_score: str) -> str:
    """
    Calculates the recovery score based on sleep hours and workout intensity.
    - green: sleep>=7 and intensity!=high
    - red: sleep<5 or (sleep<6 and intensity==high)
    - yellow: everything else
    
    Returns: "green", "yellow", or "red"
    """
    intensity = str(intensity_score).strip().lower()
    
    if sleep_hours >= 7.0 and intensity != "high":
        return "green"
    elif sleep_hours < 5.0 or (sleep_hours < 6.0 and intensity == "high"):
        return "red"
    else:
        return "yellow"
