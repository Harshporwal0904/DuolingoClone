const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface UserMe {
  id: number;
  username: string;
  total_xp: number;
  streak_count: number;
  hearts: number;
  daily_xp_goal: number;
  xp_today: number;
  gems: number;
}

export interface PathSkill {
  id: number;
  title: string;
  order_index: number;
  icon: string | null;
  status: "locked" | "available" | "completed";
  crowns: number;
}

export interface PathUnit {
  id: number;
  title: string;
  order_index: number;
  skills: PathSkill[];
}

export interface Exercise {
  id: number;
  lesson_id: number;
  order_index: number;
  type: "multiple_choice" | "translate" | "type_answer";
  prompt: string;
  options: string[] | null;
}

export interface CheckAnswerResponse {
  correct: boolean;
  correct_answer: string;
}

export interface CompleteLessonResponse {
  xp_earned: number;
  new_total_xp: number;
  streak_count: number;
  crowns: number;
  skill_status: "locked" | "available" | "completed";
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    throw new Error(`API Request failed: ${response.status} ${response.statusText} - ${errorBody}`);
  }

  return response.json();
}

export interface LeaderboardUser {
  username: string;
  total_xp: number;
  rank: number;
}

export interface UserProfile {
  username: string;
  total_xp: number;
  streak_count: number;
  created_at: string;
  crowns_count: number;
}

export const api = {
  getUserMe: () => request<UserMe>("/api/user/me", { cache: "no-store" }),
  getPath: () => request<PathUnit[]>("/api/path", { cache: "no-store" }),
  getSkillProgress: (skillId: number) => request<{ lessons_completed: number; total_lessons: number; next_lesson_id: number }>(`/api/skills/${skillId}/progress`, { cache: "no-store" }),
  refillHearts: () => request<UserMe>("/api/user/refill-hearts", { method: "POST" }),
  getLessonExercises: (lessonId: number) => request<Exercise[]>(`/api/lessons/${lessonId}`),
  checkExerciseAnswer: (lessonId: number, exerciseId: number, answer: string) =>
    request<CheckAnswerResponse>(`/api/lessons/${lessonId}/exercises/${exerciseId}/check`, {
      method: "POST",
      body: JSON.stringify({ answer }),
    }),
  completeLesson: (lessonId: number, correctCount: number, totalCount: number) =>
    request<CompleteLessonResponse>(`/api/lessons/${lessonId}/complete`, {
      method: "POST",
      body: JSON.stringify({ correct_count: correctCount, total_count: totalCount }),
    }),
  advanceDay: () => request<{ message: string; last_active_date: string }>("/api/user/advance-day", {
    method: "POST",
  }),
  getLeaderboard: () => request<LeaderboardUser[]>("/api/leaderboard", { cache: "no-store" }),
  getUserProfile: () => request<UserProfile>("/api/user/profile", { cache: "no-store" }),
};
