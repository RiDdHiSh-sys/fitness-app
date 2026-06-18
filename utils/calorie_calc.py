# MET formula: calories = MET × weight_kg × duration_hours
# Default MET values: squat(5.0), deadlift(6.0), bench_press(4.5), bicep_curl(3.5),
# shoulder_press(4.0), lat_pulldown(4.0), leg_press(4.5), plank(3.0), running(8.0), cycling(6.0)

MET_VALUES = {
    "squat": 5.0,
    "deadlift": 6.0,
    "bench_press": 4.5,
    "bicep_curl": 3.5,
    "shoulder_press": 4.0,
    "lat_pulldown": 4.0,
    "leg_press": 4.5,
    "plank": 3.0,
    "running": 8.0,
    "cycling": 6.0
}

def calculate_calories_burned(exercises: list, weight_kg: float) -> float:
    """
    Calculates total calories burned across a list of exercises for a user of weight_kg.
    
    Each exercise is a dictionary (or Pydantic model turned dict) with:
      - name: str
      - sets: int
      - reps: int
      - weight_kg: float
      - met_value: float (optional)
      - duration_minutes: float (optional, defaults to 1.5 minutes per set)
    """
    total_calories = 0.0
    
    for ex in exercises:
        # standardise exercise key format
        ex_name = ex.get("name") or ""
        name_key = ex_name.lower().strip().replace(" ", "_")
        
        # Use provided met_val or find standard MET
        met = ex.get("met_value")
        if met is None or met <= 0:
            met = MET_VALUES.get(name_key, 4.0) # default to 4.0 if not found
            
        # Get duration: use duration_minutes if provided, otherwise assume 1.5 mins per set
        duration_minutes = ex.get("duration_minutes")
        if duration_minutes is None or duration_minutes <= 0:
            sets = ex.get("sets") or 0
            # A standard set with rest takes roughly 1.5 minutes
            duration_minutes = max(1.0, sets * 1.5)
            
        duration_hours = duration_minutes / 60.0
        
        # Calorie calculation: MET * weight * duration_hours
        calories = met * weight_kg * duration_hours
        total_calories += calories
        
    return round(total_calories, 2)
