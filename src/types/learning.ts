export type Company = 'Seven' | 'ARQO';
export type UserRole = 'admin' | 'colaborador';
export type UserStatus = 'ativo' | 'inativo';
export type AdminAuditCategory = 'usuarios' | 'admins' | 'colaboradores' | 'conteudo' | 'midia' | 'certificados' | 'sistema';

export interface UserProfile {
  id: string;
  email: string | null;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  company: Company;
  status: UserStatus;
}

export interface ManagedAuthUser {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  company: Company;
  status: UserStatus;
  has_profile: boolean;
}

export interface AdminAuditLog {
  id: string;
  actor_id: string | null;
  actor_name: string;
  category: AdminAuditCategory;
  action: string;
  target_id: string | null;
  target_type: string | null;
  target_name: string | null;
  company: Company | null;
  message: string;
  metadata: Record<string, unknown>;
  reverted_at: string | null;
  reverted_by: string | null;
  revert_log_id: string | null;
  created_at: string;
}

export interface Course {
  id: string;
  company: Company;
  title: string;
  description: string | null;
  cover_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface LearningModule {
  id: string;
  course_id: string;
  company?: Company | null;
  title: string;
  description: string | null;
  duration?: string | null;
  has_quiz?: boolean;
  order_index: number;
  created_at: string;
  updated_at?: string;
}

export interface Lesson {
  id: string;
  module_id: string;
  title: string;
  description: string | null;
  video_url: string | null;
  attachment_url?: string | null;
  video_duration_seconds?: number | null;
  content: string | null;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface LessonProgress {
  id: string;
  user_id: string;
  lesson_id: string;
  progress: number;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at?: string;
}

export interface CourseTree extends Course {
  modules: Array<LearningModule & { lessons: Lesson[] }>;
}

export type QuizQuestionType = 'single' | 'multiple';

export interface QuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface QuizQuestion {
  id: string;
  quiz_id: string;
  question: string;
  type: QuizQuestionType;
  options: QuizOption[];
  order_index: number;
}

export interface Quiz {
  id: string;
  module_id: string;
  title: string;
  passing_score: number;
  time_per_question_minutes: number;
  is_active: boolean;
  created_at: string;
  questions: QuizQuestion[];
}

export interface QuizAttempt {
  id: string;
  quiz_id: string;
  module_id: string;
  course_id: string;
  user_id: string;
  score: number;
  passed: boolean;
  answers: Record<string, string[]>;
  attempt_number: number;
  completed_at: string;
}

export interface CourseFailure {
  id: string;
  user_id: string;
  course_id: string;
  failure_count: number;
  last_failed_at: string;
}

export interface Certificate {
  id: string;
  user_id: string;
  course_id: string;
  issued_at: string;
  certificate_url: string | null;
  workload_minutes: number;
  started_at: string | null;
  completed_at: string | null;
  validation_code: string | null;
}

export interface PublicCertificateValidation {
  certificate_id: string;
  certificate_url: string | null;
  validation_code: string;
  issued_at: string;
  completed_at: string | null;
  workload_minutes: number;
  student_name: string;
  course_title: string;
  company: Company;
}

export interface AdminMetrics {
  totalUsers: number;
  activeUsers: number;
  totalCourses: number;
  totalLessons: number;
  completedLessons: number;
  averageProgress: number;
}

export interface HealthIssue {
  id: string;
  label: string;
  severity: 'ok' | 'warning' | 'critical';
  action: string;
}

export interface ReadinessScore {
  score: number;
  missing: string[];
}
