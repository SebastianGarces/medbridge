export interface User {
  id: string;
  name: string;
  type: "patient" | "clinician";
  email?: string;
  phase?: string;
  consent_given?: boolean;
}

export interface ExerciseVideo {
  token: string;
  name: string;
  category1?: string | null;
  category2?: string | null;
  thumbnail1?: string | null;
  description?: string | null;
  video_embed_url?: string | null;
}

export interface Message {
  id: string;
  role: string;
  content: string;
  content_html: string;
  created_at: string;
  exercise_videos: ExerciseVideo[];
}

export interface Goal {
  id: string;
  goal_text: string;
  target_date?: string | null;
  progress_pct: number;
  created_at: string;
}

export interface Adherence {
  adherence_pct: number;
  streak: number;
  best_streak: number;
  sessions_completed: number;
  sessions_total: number;
}

export interface WeekDay {
  label: string;
  completed: boolean;
  is_today: boolean;
  is_future: boolean;
}

export interface GoalsPageData {
  goal: Goal | null;
  adherence: Adherence;
  week_days: WeekDay[];
}

export interface ProgramExercise {
  exercise_id: string;
  name: string;
  sets: number;
  reps: number;
  token?: string | null;
  category1: string;
  category2: string;
  thumbnail1: string;
  description: string;
  video_embed_url: string;
  completed_today: boolean;
}

export interface ExercisesPageData {
  program_videos: ProgramExercise[];
  all_videos: ExerciseVideo[];
  categories: string[];
}

export interface PatientSummary {
  id: string;
  name: string;
  phase: string;
  consent_given: boolean;
  adherence_pct?: number;
  last_interaction_at?: string | null;
  alert_count?: number;
}

export interface Alert {
  id: string;
  patient_id: string;
  severity: string;
  title: string;
  description: string;
  acknowledged: boolean;
  created_at: string;
  patient_name?: string | null;
}

export interface PhaseTransition {
  id: string;
  from_phase: string;
  to_phase: string;
  reason?: string | null;
  created_at: string;
}

export interface DashboardStats {
  active: number;
  avg_adherence: number;
  pending_alerts: number;
  dormant: number;
}

export interface DashboardData {
  patients: PatientSummary[];
  stats: DashboardStats;
}

export interface PatientDetailData {
  patient: PatientSummary;
  messages: Message[];
  transitions: PhaseTransition[];
  alert_count: number;
  goal: Goal | null;
  adherence: Adherence | null;
}

export interface PatientStatus {
  phase: string;
  consent_given: boolean;
  has_goal: boolean;
}
