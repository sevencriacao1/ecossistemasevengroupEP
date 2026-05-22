import { supabase } from '../lib/supabase';
import {
  AdminAuditCategory,
  AdminAuditLog,
  AdminMetrics,
  Certificate,
  Company,
  CourseFailure,
  Course,
  CourseTree,
  HealthIssue,
  LearningModule,
  Lesson,
  LessonProgress,
  ManagedAuthUser,
  PublicCertificateValidation,
  Quiz,
  QuizAttempt,
  QuizOption,
  QuizQuestion,
  QuizQuestionType,
  ReadinessScore,
  UserProfile,
  UserRole,
  UserStatus,
} from '../types/learning';

type ProfileRow = Record<string, unknown>;
type AdminAuditLogRow = Record<string, unknown>;
type SupabaseMaybeError = { code?: string; message?: string; details?: string };
type QuizQuestionRow = Record<string, unknown>;

function isMissingRestResource(error: SupabaseMaybeError | null | undefined) {
  if (!error) return false;

  const text = `${error.code ?? ''} ${error.message ?? ''} ${error.details ?? ''}`.toLowerCase();
  return (
    error.code === 'PGRST205'
    || error.code === '42P01'
    || text.includes('could not find the table')
    || text.includes('does not exist')
    || text.includes('schema cache')
  );
}

function asString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

function asNullableString(value: unknown) {
  return typeof value === 'string' ? value : null;
}

function asCompany(value: unknown): Company {
  return value === 'ARQO' ? 'ARQO' : 'Seven';
}

function asRole(value: unknown): UserRole {
  return value === 'admin' ? 'admin' : 'colaborador';
}

function asStatus(value: unknown): UserStatus {
  return value === 'inativo' ? 'inativo' : 'ativo';
}

async function getSupabaseFunctionErrorMessage(error: unknown) {
  const fallback = error instanceof Error ? error.message : 'Edge Function retornou erro.';
  const context = typeof error === 'object' && error && 'context' in error
    ? (error as { context?: unknown }).context
    : null;

  if (context instanceof Response) {
    try {
      const payload = await context.clone().json() as { error?: unknown; message?: unknown };
      const message = typeof payload.error === 'string'
        ? payload.error
        : typeof payload.message === 'string'
          ? payload.message
          : '';

      if (message) return message;
    } catch {
      try {
        const message = await context.clone().text();
        if (message) return message;
      } catch {
        return fallback;
      }
    }
  }

  return fallback;
}

async function throwSupabaseFunctionError(error: unknown): Promise<never> {
  throw new Error(await getSupabaseFunctionErrorMessage(error));
}

function asQuizQuestionType(value: unknown): QuizQuestionType {
  return value === 'multiple' ? 'multiple' : 'single';
}

function normalizeOptions(value: unknown): QuizOption[] {
  return Array.isArray(value)
    ? value.map((option) => {
      const nextOption = option as Record<string, unknown>;
      return {
        id: asString(nextOption.id, crypto.randomUUID()),
        text: asString(nextOption.text),
        isCorrect: nextOption.isCorrect === true || nextOption.correct === true || nextOption.is_correct === true,
      };
    })
    : [];
}

function normalizeQuizQuestion(row: QuizQuestionRow): QuizQuestion {
  return {
    id: asString(row.id),
    quiz_id: asString(row.quiz_id),
    question: asString(row.question),
    type: asQuizQuestionType(row.type),
    options: normalizeOptions(row.options),
    order_index: Number(row.order_index ?? 1),
  };
}

function normalizeProfile(row: ProfileRow): UserProfile {
  return {
    id: asString(row.id),
    email: asNullableString(row.email),
    username: asString(row.username, asString(row.email).split('@')[0] || 'usuario'),
    full_name: asNullableString(row.full_name) ?? asNullableString(row.nome),
    avatar_url: asNullableString(row.avatar_url),
    role: asRole(row.role ?? row.nivel_acesso),
    company: asCompany(row.company ?? row.empresa),
    status: asStatus(row.status),
  };
}

function normalizeAdminAuditLog(row: AdminAuditLogRow): AdminAuditLog {
  return {
    id: asString(row.id),
    actor_id: asNullableString(row.actor_id),
    actor_name: asString(row.actor_name, 'Administrador'),
    category: asAdminAuditCategory(row.category),
    action: asString(row.action),
    target_id: asNullableString(row.target_id),
    target_type: asNullableString(row.target_type),
    target_name: asNullableString(row.target_name),
    company: typeof row.company === 'string' ? asCompany(row.company) : null,
    message: asString(row.message),
    metadata: typeof row.metadata === 'object' && row.metadata !== null && !Array.isArray(row.metadata)
      ? row.metadata as Record<string, unknown>
      : {},
    reverted_at: asNullableString(row.reverted_at),
    reverted_by: asNullableString(row.reverted_by),
    revert_log_id: asNullableString(row.revert_log_id),
    created_at: asString(row.created_at),
  };
}

function asAdminAuditCategory(value: unknown): AdminAuditCategory {
  if (
    value === 'admins'
    || value === 'colaboradores'
    || value === 'conteudo'
    || value === 'midia'
    || value === 'certificados'
    || value === 'sistema'
  ) {
    return value;
  }

  return 'usuarios';
}

function buildCourseTree(courses: Course[], modules: LearningModule[], lessons: Lesson[]): CourseTree[] {
  return courses.map((course) => ({
    ...course,
    modules: modules
      .filter((moduleItem) => moduleItem.course_id === course.id)
      .sort((a, b) => a.order_index - b.order_index)
      .map((moduleItem) => ({
        ...moduleItem,
        lessons: lessons
          .filter((lesson) => lesson.module_id === moduleItem.id)
          .sort((a, b) => a.order_index - b.order_index),
      })),
  }));
}

function buildLegacyCourseTree(modules: LearningModule[]): CourseTree[] {
  const companies = Array.from(new Set(modules.map((moduleItem) => moduleItem.company ?? 'Seven')));

  return companies.map((company) => {
    const companyModules = modules
      .filter((moduleItem) => (moduleItem.company ?? 'Seven') === company)
      .sort((a, b) => a.order_index - b.order_index);

    return {
      id: `legacy-${company}`,
      company,
      title: company === 'ARQO' ? 'Curso ARQO' : 'Curso Seven Group',
      description: 'Conteudo carregado do schema legado enquanto a plataforma completa nao foi migrada.',
      cover_url: null,
      is_active: true,
      created_at: new Date().toISOString(),
      modules: companyModules.map((moduleItem) => ({ ...moduleItem, lessons: [] })),
    };
  });
}

export function calculateReadiness(course: CourseTree): ReadinessScore {
  const missing = [
    !course.cover_url ? 'capa' : '',
    course.modules.length === 0 ? 'modulos' : '',
    course.modules.every((moduleItem) => moduleItem.lessons.length === 0) ? 'aulas' : '',
    course.modules.some((moduleItem) => moduleItem.lessons.some((lesson) => !lesson.video_url)) ? 'videos' : '',
  ].filter(Boolean);

  return {
    score: Math.max(0, Math.round(((4 - missing.length) / 4) * 100)),
    missing,
  };
}

export function buildHealthIssues(courses: CourseTree[], users: UserProfile[]): HealthIssue[] {
  const issues: HealthIssue[] = [];
  const invalidUsers = users.filter((user) => user.company !== 'Seven' && user.company !== 'ARQO');
  const incompleteUsers = users.filter((user) => !user.username || !user.role || !user.company);
  const coursesWithoutModules = courses.filter((course) => course.modules.length === 0);
  const modulesWithoutLessons = courses.flatMap((course) =>
    course.modules.filter((moduleItem) => moduleItem.lessons.length === 0)
  );
  const lessonsWithoutVideo = courses.flatMap((course) =>
    course.modules.flatMap((moduleItem) => moduleItem.lessons.filter((lesson) => !lesson.video_url))
  );

  issues.push({
    id: 'rls-shadow',
    label: 'Shadow Dashboard ativo',
    severity: 'ok',
    action: 'Dashboards novos estao isolados em /dashboard sem substituir /home.',
  });

  if (invalidUsers.length > 0) {
    issues.push({
      id: 'invalid-users',
      label: `${invalidUsers.length} usuarios com empresa invalida`,
      severity: 'critical',
      action: 'Normalizar empresa para Seven ou ARQO antes de publicar conteudos.',
    });
  }

  if (incompleteUsers.length > 0) {
    issues.push({
      id: 'incomplete-users',
      label: `${incompleteUsers.length} perfis incompletos`,
      severity: 'warning',
      action: 'Completar username, role e empresa nos perfis afetados.',
    });
  }

  if (coursesWithoutModules.length > 0) {
    issues.push({
      id: 'empty-courses',
      label: `${coursesWithoutModules.length} cursos sem modulos`,
      severity: 'warning',
      action: 'Adicionar modulos antes de liberar para colaboradores.',
    });
  }

  if (modulesWithoutLessons.length > 0) {
    issues.push({
      id: 'empty-modules',
      label: `${modulesWithoutLessons.length} modulos sem aulas`,
      severity: 'warning',
      action: 'Criar ao menos uma aula por modulo publicado.',
    });
  }

  if (lessonsWithoutVideo.length > 0) {
    issues.push({
      id: 'video-fallback',
      label: `${lessonsWithoutVideo.length} aulas sem video`,
      severity: 'warning',
      action: 'Fallback textual esta disponivel, mas o video deve ser enviado.',
    });
  }

  return issues;
}

export async function fetchUsers() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('username', { ascending: true });

  if (error) throw error;
  return (data ?? []).map((row) => normalizeProfile(row as ProfileRow));
}

export async function fetchAdminAuditLogs() {
  const { data, error } = await supabase
    .from('admin_audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(500);

  if (error) {
    if (isMissingRestResource(error)) return [];
    throw error;
  }

  return (data ?? []).map((row) => normalizeAdminAuditLog(row as AdminAuditLogRow));
}

export async function createAdminAuditLog(values: {
  actorId?: string | null;
  actorName: string;
  category: AdminAuditCategory;
  action: string;
  targetId?: string | null;
  targetType?: string | null;
  targetName?: string | null;
  company?: Company | null;
  message: string;
  metadata?: Record<string, unknown>;
}) {
  const { data, error } = await supabase
    .from('admin_audit_logs')
    .insert({
      actor_id: values.actorId ?? null,
      actor_name: values.actorName,
      category: values.category,
      action: values.action,
      target_id: values.targetId ?? null,
      target_type: values.targetType ?? null,
      target_name: values.targetName ?? null,
      company: values.company ?? null,
      message: values.message,
      metadata: values.metadata ?? {},
    })
    .select('*')
    .single();

  if (error) {
    if (isMissingRestResource(error)) return null;
    throw error;
  }

  return normalizeAdminAuditLog(data as AdminAuditLogRow);
}

export async function markAdminAuditLogReverted(id: string, values: {
  revertedBy?: string | null;
  revertLogId?: string | null;
}) {
  const { error } = await supabase
    .from('admin_audit_logs')
    .update({
      reverted_at: new Date().toISOString(),
      reverted_by: values.revertedBy ?? null,
      revert_log_id: values.revertLogId ?? null,
    })
    .eq('id', id);

  if (error) {
    if (isMissingRestResource(error)) return;
    throw error;
  }
}

export async function updateUserProfile(
  id: string,
  values: Partial<Pick<UserProfile, 'email' | 'username' | 'full_name' | 'role' | 'company' | 'status'>>
) {
  const { error } = await supabase
    .from('profiles')
    .update(values)
    .eq('id', id);

  if (error) throw error;
}

export async function createManagedUser(values: {
  email: string;
  password: string;
  fullName: string;
  username: string;
  role: UserRole;
  company?: Company;
  status?: UserStatus;
  avatarUrl?: string | null;
}) {
  const { data, error } = await supabase.functions.invoke('admin-users', {
    body: {
      action: 'create',
      email: values.email,
      password: values.password,
      full_name: values.fullName,
      username: values.username,
      role: values.role,
      company: values.company ?? 'Seven',
      status: values.status ?? 'ativo',
      avatar_url: values.avatarUrl ?? null,
    },
  });

  if (error) await throwSupabaseFunctionError(error);
  return data;
}

export async function listManagedAuthUsers() {
  const { data, error } = await supabase.functions.invoke('admin-users', {
    body: { action: 'list' },
  });

  if (error) await throwSupabaseFunctionError(error);
  return (data?.users ?? []) as ManagedAuthUser[];
}

export async function syncManagedUserProfile(id: string) {
  const { data, error } = await supabase.functions.invoke('admin-users', {
    body: { action: 'sync_profile', id },
  });

  if (error) await throwSupabaseFunctionError(error);
  return data;
}

export async function updateManagedUser(values: {
  id: string;
  email: string;
  password?: string;
  fullName: string;
  username: string;
  role: UserRole;
  company?: Company;
  status: UserStatus;
  avatarUrl?: string | null;
}) {
  const { data, error } = await supabase.functions.invoke('admin-users', {
    body: {
      action: 'update',
      id: values.id,
      email: values.email,
      password: values.password,
      full_name: values.fullName,
      username: values.username,
      role: values.role,
      company: values.company ?? 'Seven',
      status: values.status,
      avatar_url: values.avatarUrl ?? null,
    },
  });

  if (error) await throwSupabaseFunctionError(error);
  return data;
}

export async function deleteManagedUser(id: string) {
  if (!id) {
    throw new Error('Usuário sem ID. Não foi possível excluir.');
  }

  const { data, error } = await supabase.functions.invoke('admin-users', {
    body: { action: 'delete', id },
  });

  if (error) await throwSupabaseFunctionError(error);
  return data;
}

type LessonMediaContext = {
  company: Company;
  courseOrder: number;
  moduleOrder: number;
  lessonOrder: number;
};

type ProfileImageContext = {
  fullName: string;
  company: Company;
};

type CourseCoverContext = {
  company: Company;
  title: string;
};

type StorageBucket = 'profile-images' | 'course-covers' | 'lesson-videos' | 'lesson-attachments' | 'certificates';

function fileExtension(fileName: string, fallback: string) {
  const extension = fileName.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '');
  return extension || fallback;
}

function stripAccents(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function compactLabel(value: string, fallback: string) {
  const normalized = stripAccents(value)
    .replace(/&/g, ' e ')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim();

  return normalized || fallback;
}

function companyLabel(company: Company) {
  return company === 'ARQO' ? 'Arqo' : 'Seven';
}

function lessonMediaBaseName(context: LessonMediaContext) {
  return `${companyLabel(context.company)} - C${context.courseOrder}M${context.moduleOrder}A${context.lessonOrder}`;
}

function uniqueStoragePath(folder: string, baseName: string, extension: string) {
  return `${folder}/${baseName} - ${crypto.randomUUID().slice(0, 8)}.${extension}`;
}

function isStoragePath(path: string | null | undefined) {
  return Boolean(path && !/^https?:\/\//.test(path));
}

export async function removeStorageObject(bucket: StorageBucket, path: string | null | undefined) {
  if (!isStoragePath(path)) return;

  const { error } = await supabase.storage
    .from(bucket)
    .remove([path as string]);

  if (error) throw error;
}

export async function uploadProfileImage(file: File, context: ProfileImageContext) {
  const extension = fileExtension(file.name, 'jpg');
  const personName = compactLabel(context.fullName, 'Usuario');
  const baseName = `${personName} PP - ${companyLabel(context.company)}`;
  const path = uniqueStoragePath('profile-picture', baseName, extension);
  const { data, error } = await supabase.storage
    .from('profile-images')
    .upload(path, file, { upsert: false });

  if (error) throw error;
  return data.path;
}

export async function uploadCourseCover(file: File, context: CourseCoverContext) {
  await assertImageSize(file, 600, 400);
  const extension = fileExtension(file.name, 'jpg');
  const courseName = compactLabel(context.title, 'Curso');
  const path = uniqueStoragePath('course-covers', `${companyLabel(context.company)} - ${courseName} Cover`, extension);
  const { data, error } = await supabase.storage
    .from('course-covers')
    .upload(path, file, { upsert: false });

  if (error) throw error;
  return data.path;
}

export async function getStorageImageUrl(bucket: 'profile-images' | 'course-covers', path: string | null) {
  if (!path) return '';
  if (/^https?:\/\//.test(path)) return path;

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, 60 * 60);

  if (error) return '';
  return data.signedUrl;
}

async function assertImageSize(file: File, maxWidth: number, maxHeight: number) {
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('Não foi possível validar a imagem.'));
      image.src = url;
    });

    if (image.width > maxWidth || image.height > maxHeight) {
      throw new Error(`A imagem deve ter no máximo ${maxWidth}x${maxHeight}px.`);
    }
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function fetchLearningTree() {
  const modulesResponse = await supabase
    .from('modules')
    .select('*')
    .order('order_index', { ascending: true });

  if (modulesResponse.error) throw modulesResponse.error;

  const modules = ((modulesResponse.data ?? []) as Array<Record<string, unknown>>).map((moduleItem) => ({
    id: asString(moduleItem.id),
    course_id: asString(moduleItem.course_id, `legacy-${asCompany(moduleItem.company ?? moduleItem.empresa)}`),
    company: asCompany(moduleItem.company ?? moduleItem.empresa),
    title: asString(moduleItem.title, asString(moduleItem.titulo, 'Modulo')),
    description: asNullableString(moduleItem.description) ?? asNullableString(moduleItem.descricao),
    duration: asNullableString(moduleItem.duration),
    has_quiz: moduleItem.has_quiz === true,
    order_index: Number(moduleItem.order_index ?? moduleItem.ordem ?? 1),
    created_at: asString(moduleItem.created_at, new Date().toISOString()),
    updated_at: asNullableString(moduleItem.updated_at) ?? undefined,
  }));

  const coursesResponse = await supabase
    .from('courses')
    .select('*')
    .order('company')
    .order('created_at', { ascending: true });

  if (isMissingRestResource(coursesResponse.error)) {
    return buildLegacyCourseTree(modules);
  }

  if (coursesResponse.error) throw coursesResponse.error;
  const courses = (coursesResponse.data ?? []) as Course[];

  if (courses.length === 0) {
    return buildLegacyCourseTree(modules);
  }

  const lessonsResponse = await supabase
    .from('lessons')
    .select('*')
    .order('order_index', { ascending: true });

  if (isMissingRestResource(lessonsResponse.error)) {
    return buildCourseTree(courses, modules, []);
  }

  if (lessonsResponse.error) throw lessonsResponse.error;

  return buildCourseTree(
    courses,
    modules,
    (lessonsResponse.data ?? []) as Lesson[]
  );
}

function normalizeLegacyProgress(data: Array<Record<string, unknown>>): LessonProgress[] {
  return data.map((item) => ({
    id: asString(item.id),
    user_id: asString(item.user_id),
    lesson_id: asString(item.lesson_id, asString(item.module_id)),
    progress: Number(item.progress ?? item.progresso ?? 0),
    completed: item.completed === true || item.status === 'concluido',
    completed_at: asNullableString(item.completed_at),
    created_at: asString(item.created_at, asString(item.updated_at, new Date().toISOString())),
    updated_at: asNullableString(item.updated_at) ?? undefined,
  }));
}

export async function fetchProgress(userId: string, preferModernSchema = false) {
  if (preferModernSchema) {
    const lessonProgressResponse = await supabase
      .from('lesson_progress')
      .select('*')
      .eq('user_id', userId);

    if (!isMissingRestResource(lessonProgressResponse.error)) {
      if (lessonProgressResponse.error) throw lessonProgressResponse.error;
      return (lessonProgressResponse.data ?? []) as LessonProgress[];
    }
  }

  const legacyProgressResponse = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', userId);

  if (isMissingRestResource(legacyProgressResponse.error)) return [];
  if (legacyProgressResponse.error) throw legacyProgressResponse.error;

  return normalizeLegacyProgress((legacyProgressResponse.data ?? []) as Array<Record<string, unknown>>);
}

export async function upsertLessonProgress(userId: string, lessonId: string, progress: number) {
  if (!userId) throw new Error('Usuário não autenticado.');

  const { error } = await supabase.rpc('complete_lesson_progress', {
    input_lesson_id: lessonId,
    input_progress: progress,
  });

  if (error) throw error;
}

export async function createCourse(values: {
  company: Company;
  title: string;
  description: string;
  cover_url?: string;
}) {
  const { data, error } = await supabase
    .from('courses')
    .insert({
      company: values.company,
      title: values.title,
      description: values.description,
      cover_url: values.cover_url || null,
    })
    .select('*')
    .single();

  if (error) throw error;
  return data as Course;
}

export async function updateCourse(id: string, values: Partial<Course>) {
  const { error } = await supabase
    .from('courses')
    .update({ ...values, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
}

export async function deleteCourse(id: string) {
  const { error } = await supabase
    .from('courses')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function updateModule(id: string, values: Partial<LearningModule>) {
  const { error } = await supabase
    .from('modules')
    .update({ ...values, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
}

export async function deleteModule(id: string) {
  const { error } = await supabase
    .from('modules')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function createModule(values: {
  course_id: string;
  company: Company;
  title: string;
  description: string;
  order_index: number;
  has_quiz?: boolean;
}) {
  const { data, error } = await supabase
    .from('modules')
    .insert(values)
    .select('*')
    .single();

  if (error) throw error;
  return data as LearningModule;
}

export async function createLesson(values: {
  module_id: string;
  title: string;
  description: string;
  content: string;
  order_index: number;
  video_url?: string | null;
  attachment_url?: string | null;
  video_duration_seconds?: number | null;
}) {
  const { data, error } = await supabase
    .from('lessons')
    .insert(values)
    .select('*')
    .single();

  if (error) throw error;
  return data as Lesson;
}

export async function updateLesson(id: string, values: Partial<Lesson>) {
  const { error } = await supabase
    .from('lessons')
    .update({ ...values, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
}

export async function deleteLesson(id: string) {
  const { error } = await supabase
    .from('lessons')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function uploadLessonVideo(file: File, context: LessonMediaContext) {
  const extension = fileExtension(file.name, 'mp4');
  const path = uniqueStoragePath('video-aulas', lessonMediaBaseName(context), extension);
  const { data, error } = await supabase.storage
    .from('lesson-videos')
    .upload(path, file, { upsert: false });

  if (error) throw error;
  return data.path;
}

export async function getVideoFileDuration(file: File) {
  const url = URL.createObjectURL(file);
  try {
    const video = document.createElement('video');
    video.preload = 'metadata';
    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve();
      video.onerror = () => reject(new Error('Nao foi possivel validar a duracao do video.'));
      video.src = url;
    });

    return Number.isFinite(video.duration) ? Math.round(video.duration) : null;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function uploadLessonAttachment(file: File, context: LessonMediaContext) {
  const extension = fileExtension(file.name, 'pdf');
  const path = uniqueStoragePath('materiais-de-apoio', `${lessonMediaBaseName(context)} - Apoio`, extension);
  const { data, error } = await supabase.storage
    .from('lesson-attachments')
    .upload(path, file, { upsert: false });

  if (error) throw error;
  return data.path;
}

export async function getLessonVideoUrl(videoPath: string) {
  if (/^https?:\/\//.test(videoPath)) return videoPath;

  const { data, error } = await supabase.storage
    .from('lesson-videos')
    .createSignedUrl(videoPath, 60 * 30);

  if (error) throw error;
  return data.signedUrl;
}

export async function getLessonAttachmentUrl(attachmentPath: string) {
  if (/^https?:\/\//.test(attachmentPath)) return attachmentPath;

  const { data, error } = await supabase.storage
    .from('lesson-attachments')
    .createSignedUrl(attachmentPath, 60 * 30, { download: true });

  if (error) throw error;
  return data.signedUrl;
}

export async function fetchQuizzes(moduleIds?: string[]) {
  let query = supabase
    .from('quizzes')
    .select('*, quiz_questions(*)')
    .order('created_at', { ascending: true });

  if (moduleIds?.length) {
    query = query.in('module_id', moduleIds);
  }

  const { data, error } = await query;
  if (isMissingRestResource(error)) return [];
  if (error) throw error;

  return ((data ?? []) as Array<Record<string, unknown>>).map((quiz): Quiz => ({
    id: asString(quiz.id),
    module_id: asString(quiz.module_id),
    title: asString(quiz.title, 'Prova do modulo'),
    passing_score: Number(quiz.passing_score ?? 70),
    time_per_question_minutes: Number(quiz.time_per_question_minutes ?? 2),
    is_active: quiz.is_active === true,
    created_at: asString(quiz.created_at, new Date().toISOString()),
    questions: ((quiz.quiz_questions ?? []) as QuizQuestionRow[])
      .map((question) => normalizeQuizQuestion(question))
      .sort((a, b) => a.order_index - b.order_index),
  }));
}

function validateQuizQuestions(questions: Array<Omit<QuizQuestion, 'id' | 'quiz_id'>>) {
  questions.forEach((question, index) => {
    if (!question.question.trim()) throw new Error(`A pergunta ${index + 1} precisa de enunciado.`);
    if (question.options.length < 3) throw new Error(`A pergunta ${index + 1} precisa ter pelo menos 3 opcoes.`);
    const validOptions = question.options.filter((option) => option.text.trim());
    if (validOptions.length < 3) throw new Error(`A pergunta ${index + 1} precisa ter pelo menos 3 opcoes preenchidas.`);
    const correctCount = validOptions.filter((option) => option.isCorrect).length;
    if (correctCount < 1) throw new Error(`A pergunta ${index + 1} precisa ter uma resposta correta.`);
    if (question.type === 'single' && correctCount !== 1) throw new Error(`A pergunta objetiva ${index + 1} aceita apenas uma resposta correta.`);
  });
}

export async function saveModuleQuiz(values: {
  moduleId: string;
  title: string;
  isActive: boolean;
  questions: Array<Omit<QuizQuestion, 'id' | 'quiz_id'>>;
}) {
  if (values.isActive) validateQuizQuestions(values.questions);

  const existing = await fetchQuizzes([values.moduleId]);
  const existingQuiz = existing[0];
  const quizPayload = {
    module_id: values.moduleId,
    title: values.title || 'Prova do modulo',
    passing_score: 70,
    time_per_question_minutes: 2,
    is_active: values.isActive,
    updated_at: new Date().toISOString(),
  };

  const { data: quiz, error } = existingQuiz
    ? await supabase.from('quizzes').update(quizPayload).eq('id', existingQuiz.id).select('*').single()
    : await supabase.from('quizzes').insert(quizPayload).select('*').single();

  if (error) throw error;

  const quizId = asString(quiz.id);
  const deleteResponse = await supabase.from('quiz_questions').delete().eq('quiz_id', quizId);
  if (deleteResponse.error) throw deleteResponse.error;

  if (values.questions.length > 0) {
    const insertResponse = await supabase.from('quiz_questions').insert(values.questions.map((question, index) => ({
      quiz_id: quizId,
      question: question.question,
      type: question.type,
      options: question.options.map((option) => ({
        id: option.id || crypto.randomUUID(),
        text: option.text,
        isCorrect: option.isCorrect,
      })),
      order_index: index + 1,
    })));
    if (insertResponse.error) throw insertResponse.error;
  }

  await updateModule(values.moduleId, { has_quiz: values.isActive });
}

export async function fetchQuizAttempts(userId?: string) {
  let query = supabase.from('quiz_attempts').select('*').order('completed_at', { ascending: false });
  if (userId) query = query.eq('user_id', userId);

  const { data, error } = await query;
  if (isMissingRestResource(error)) return [];
  if (error) throw error;

  return (data ?? []) as QuizAttempt[];
}

export async function fetchCourseFailures(userId?: string) {
  let query = supabase.from('course_failures').select('*');
  if (userId) query = query.eq('user_id', userId);

  const { data, error } = await query;
  if (isMissingRestResource(error)) return [];
  if (error) throw error;

  return (data ?? []) as CourseFailure[];
}

export async function fetchCertificates(userId?: string) {
  let query = supabase.from('certificates').select('*').order('issued_at', { ascending: false });
  if (userId) query = query.eq('user_id', userId);

  const { data, error } = await query;
  if (isMissingRestResource(error)) return [];
  if (error) throw error;

  return (data ?? []) as Certificate[];
}

export async function getCertificateUrl(path: string | null) {
  if (!path) return '';
  if (/^https?:\/\//.test(path)) return path;

  const { data, error } = await supabase.storage
    .from('certificates')
    .createSignedUrl(path, 60 * 60);

  if (error) return '';
  return data.signedUrl;
}

export async function validateCertificateCode(code: string) {
  const normalizedCode = code.trim().toUpperCase();
  if (!normalizedCode) return null;

  const { data, error } = await supabase
    .rpc('validate_certificate_code', { input_code: normalizedCode });

  if (error) throw error;
  return (data?.[0] ?? null) as PublicCertificateValidation | null;
}

export async function resetCourseProgress(userId: string, course: CourseTree) {
  const lessonIds = course.modules.flatMap((moduleItem) => moduleItem.lessons.map((lesson) => lesson.id));
  if (lessonIds.length === 0) return;

  const { error } = await supabase
    .from('lesson_progress')
    .delete()
    .eq('user_id', userId)
    .in('lesson_id', lessonIds);

  if (error) throw error;
}

export async function registerCourseFailure(userId: string, courseId: string) {
  const current = await fetchCourseFailures(userId);
  const existing = current.find((failure) => failure.course_id === courseId);
  const failureCount = (existing?.failure_count ?? 0) + 1;

  const { error } = await supabase
    .from('course_failures')
    .upsert({
      user_id: userId,
      course_id: courseId,
      failure_count: failureCount,
      last_failed_at: new Date().toISOString(),
    }, { onConflict: 'user_id,course_id' });

  if (error) throw error;
  return failureCount;
}

export function gradeQuiz(quiz: Quiz, answers: Record<string, string[]>) {
  const total = quiz.questions.length || 1;
  const correct = quiz.questions.filter((question) => {
    const expected = question.options.filter((option) => option.isCorrect).map((option) => option.id).sort();
    const received = [...(answers[question.id] ?? [])].sort();
    return expected.length === received.length && expected.every((optionId, index) => optionId === received[index]);
  }).length;

  const score = Math.round((correct / total) * 100);
  return { score, passed: score >= quiz.passing_score };
}

export async function submitQuizAttempt(values: {
  quiz: Quiz;
  course: CourseTree;
  userId: string;
  answers: Record<string, string[]>;
}) {
  if (!values.userId || !values.course.id) throw new Error('Usuário ou curso inválido.');

  const { data, error } = await supabase
    .rpc('submit_quiz_attempt', {
      input_quiz_id: values.quiz.id,
      input_answers: values.answers,
    })
    .single();

  if (error) {
    const message = [error.message, error.details, error.hint].filter(Boolean).join(' ');
    throw new Error(message || 'Nao foi possivel enviar a prova.');
  }
  const attempt = data as QuizAttempt;
  return { score: attempt.score, passed: attempt.passed };
}

export function calculateCourseWorkloadMinutes(course: CourseTree, quizzes: Quiz[]) {
  const videoSeconds = course.modules.reduce((courseTotal, moduleItem) => (
    courseTotal + moduleItem.lessons.reduce((moduleTotal, lesson) => moduleTotal + (lesson.video_duration_seconds ?? 0), 0)
  ), 0);
  const quizMinutes = quizzes
    .filter((quiz) => quiz.is_active && course.modules.some((moduleItem) => moduleItem.id === quiz.module_id))
    .reduce((total, quiz) => total + (quiz.questions.length * quiz.time_per_question_minutes), 0);

  return Math.ceil(videoSeconds / 60) + quizMinutes;
}

export function getModuleProgress(
  moduleItem: CourseTree['modules'][number],
  progress: LessonProgress[],
  quizzes: Quiz[],
  attempts: QuizAttempt[]
) {
  const completedLessons = moduleItem.lessons.filter((lesson) => (
    progress.some((item) => item.lesson_id === lesson.id && item.completed)
  )).length;
  const lessonProgress = moduleItem.lessons.length ? completedLessons / moduleItem.lessons.length : 1;
  const moduleQuiz = quizzes.find((quiz) => quiz.module_id === moduleItem.id && quiz.is_active);

  if (!moduleQuiz) return Math.round(lessonProgress * 100);

  const quizPassed = attempts.some((attempt) => attempt.quiz_id === moduleQuiz.id && attempt.passed);
  return Math.round((lessonProgress * 50) + (quizPassed ? 50 : 0));
}

export function getCourseProgress(
  course: CourseTree,
  progress: LessonProgress[],
  quizzes: Quiz[],
  attempts: QuizAttempt[]
) {
  if (course.modules.length === 0) return 0;
  const total = course.modules.reduce((sum, moduleItem) => (
    sum + getModuleProgress(moduleItem, progress, quizzes, attempts)
  ), 0);

  return Math.round(total / course.modules.length);
}

export function getCompletedModuleCount(
  course: CourseTree,
  progress: LessonProgress[],
  quizzes: Quiz[],
  attempts: QuizAttempt[]
) {
  return course.modules.filter((moduleItem) => getModuleProgress(moduleItem, progress, quizzes, attempts) === 100).length;
}

export function isCourseCompleted(
  course: CourseTree,
  progress: LessonProgress[],
  quizzes: Quiz[],
  attempts: QuizAttempt[]
) {
  return course.modules.length > 0 && getCompletedModuleCount(course, progress, quizzes, attempts) === course.modules.length;
}

export async function uploadCertificatePng(file: Blob, context: { company: Company; courseTitle: string; userName: string; userId: string }) {
  const issuedAt = new Date().toISOString().replace(/[:.]/g, '-');
  const path = `${companyLabel(context.company)}/${compactLabel(context.courseTitle, 'Curso')}/${context.userId}/${compactLabel(context.userName, 'Colaborador')} - ${issuedAt}.png`;
  const { data, error } = await supabase.storage
    .from('certificates')
    .upload(path, file, { contentType: 'image/png', upsert: false });

  if (error) throw error;
  return data.path;
}

export async function upsertCertificate(values: {
  userId: string;
  courseId: string;
  certificateUrl: string;
  workloadMinutes: number;
  startedAt: string | null;
  completedAt: string | null;
  validationCode: string;
}) {
  const { data, error } = await supabase.rpc('issue_course_certificate', {
    input_user_id: values.userId,
    input_course_id: values.courseId,
    input_certificate_url: values.certificateUrl,
    input_workload_minutes: values.workloadMinutes,
    input_started_at: values.startedAt,
    input_completed_at: values.completedAt,
    input_validation_code: values.validationCode,
  });

  if (error) throw error;
  return data as Certificate;
}

export async function deleteCertificate(certificateId: string) {
  const { error } = await supabase
    .from('certificates')
    .delete()
    .eq('id', certificateId);

  if (error) throw error;
}

export function buildAdminMetrics(
  users: UserProfile[],
  courses: CourseTree[],
  progress: LessonProgress[]
): AdminMetrics {
  const totalLessons = courses.reduce(
    (courseTotal, course) => courseTotal + course.modules.reduce(
      (moduleTotal, moduleItem) => moduleTotal + moduleItem.lessons.length,
      0
    ),
    0
  );
  const completedLessons = progress.filter((item) => item.completed).length;
  const averageProgress = progress.length
    ? Math.round(progress.reduce((sum, item) => sum + item.progress, 0) / progress.length)
    : 0;

  return {
    totalUsers: users.length,
    activeUsers: users.filter((user) => user.status === 'ativo').length,
    totalCourses: courses.length,
    totalLessons,
    completedLessons,
    averageProgress,
  };
}

export async function fetchAllProgress(preferModernSchema = false) {
  if (preferModernSchema) {
    const lessonProgressResponse = await supabase.from('lesson_progress').select('*');
    if (!isMissingRestResource(lessonProgressResponse.error)) {
      if (lessonProgressResponse.error) throw lessonProgressResponse.error;
      return (lessonProgressResponse.data ?? []) as LessonProgress[];
    }
  }

  const legacyProgressResponse = await supabase.from('user_progress').select('*');
  if (isMissingRestResource(legacyProgressResponse.error)) return [];
  if (legacyProgressResponse.error) throw legacyProgressResponse.error;

  return normalizeLegacyProgress((legacyProgressResponse.data ?? []) as Array<Record<string, unknown>>);
}
