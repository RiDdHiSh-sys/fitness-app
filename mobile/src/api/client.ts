import axios from 'axios';

// ─── Deployed backend on Render ───────────────────────────────────────────────
export const BASE_URL = 'https://fitness-nutrition-backend-odjl.onrender.com';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    console.error('API Error:', err?.response?.data || err.message);
    return Promise.reject(err);
  }
);

export default api;

// ─── User ─────────────────────────────────────────────────────────────────────
export interface UserPayload {
  name: string;
  age: number;
  weight_kg: number;
  height_cm: number;
  goal: 'lose_weight' | 'build_muscle' | 'maintain';
}
export const createUser = (data: UserPayload) => api.post('/user', data);

// ─── Workout ──────────────────────────────────────────────────────────────────
export interface Exercise {
  name: string;
  sets: number;
  reps: number;
  weight_kg: number;
  met_value: number;
  duration_minutes?: number;
}
export const logWorkout = (user_id: string, exercises: Exercise[]) =>
  api.post('/workout', { user_id, exercises });

// ─── Meal ─────────────────────────────────────────────────────────────────────
export interface MealItem {
  name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  source?: string;
}
export const logMeal = (user_id: string, items: MealItem[]) =>
  api.post('/meal', { user_id, items });

// ─── Summary ──────────────────────────────────────────────────────────────────
export const getTodaySummary = (user_id: string) =>
  api.get(`/today-summary/${user_id}`);

// ─── AI Recommendation ────────────────────────────────────────────────────────
export const getRecommendation = (user_id: string) =>
  api.get(`/ai-recommendation/${user_id}`);

// ─── AI Chat ──────────────────────────────────────────────────────────────────
export interface ChatMessage {
  role: 'user' | 'ai';
  content: string;
  timestamp: string;
}
export const sendChatMessage = (
  user_id: string,
  message: string,
  conversation_history: ChatMessage[]
) => api.post('/chat-reply', { user_id, message, conversation_history });

// ─── Sleep & Recovery ─────────────────────────────────────────────────────────
export const logSleep = (user_id: string, sleep_hours: number) =>
  api.post('/sleep', { user_id, sleep_hours });
export const getRecoveryScore = (user_id: string) =>
  api.get(`/recovery-score/${user_id}`);

// ─── Weekly Insights ─────────────────────────────────────────────────────────
export const getWeeklyInsights = (user_id: string) =>
  api.get(`/weekly-insights/${user_id}`);

// ─── Pose Feedback ────────────────────────────────────────────────────────────
export const getPoseFeedback = (
  user_id: string,
  exercise: string,
  knee_angle: number,
  elbow_angle: number,
  back_angle: number
) =>
  api.post('/pose-feedback', { user_id, exercise, knee_angle, elbow_angle, back_angle });
