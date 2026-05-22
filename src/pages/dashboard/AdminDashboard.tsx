import { FormEvent, ReactNode, useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  BookOpen,
  Award,
  ClipboardList,
  Eye,
  Trash2,
  Edit3,
  FileText,
  History,
  Home,
  LogOut,
  Plus,
  Settings,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { VideoPlayer } from '../../components/VideoPlayer';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../contexts/AuthContext';
import { createCertificateValidationCode } from '../../lib/certificateValidation';
import { supabase } from '../../lib/supabase';
import {
  calculateCourseWorkloadMinutes,
  calculateReadiness,
  createAdminAuditLog,
  createCourse,
  createLesson,
  createManagedUser,
  createModule,
  deleteCertificate,
  deleteCourse,
  deleteLesson,
  deleteManagedUser,
  deleteModule,
  fetchAdminAuditLogs,
  fetchAllProgress,
  fetchCertificates,
  fetchCourseFailures,
  fetchLearningTree,
  fetchQuizAttempts,
  fetchQuizzes,
  fetchUsers,
  getCompletedModuleCount,
  getCourseProgress,
  getModuleProgress,
  getVideoFileDuration,
  isCourseCompleted,
  listManagedAuthUsers,
  syncManagedUserProfile,
  updateLesson,
  updateManagedUser,
  updateCourse,
  updateModule,
  getLessonAttachmentUrl,
  getLessonVideoUrl,
  getStorageImageUrl,
  markAdminAuditLogReverted,
  removeStorageObject,
  saveModuleQuiz,
  uploadCertificatePng,
  uploadCourseCover,
  uploadLessonAttachment,
  uploadLessonVideo,
  uploadProfileImage,
  upsertCertificate,
} from '../../services/learningService';
import { AdminAuditCategory, AdminAuditLog, Certificate, Company, CourseFailure, CourseTree, Lesson, LessonProgress, ManagedAuthUser, Quiz, QuizAttempt, QuizOption, QuizQuestionType, UserProfile, UserRole, UserStatus } from '../../types/learning';

type AdminRoute = 'inicio' | 'cursos' | 'progress' | 'settings' | 'history';
type ModalName = 'course' | 'editCourse' | 'module' | 'editModule' | 'lesson' | 'editLesson' | 'user' | 'editUser' | 'quiz' | null;
type PreviewMedia = {
  title: string;
  url: string;
  fileName?: string;
  type: 'image' | 'video' | 'file';
};
type QuizQuestionDraft = {
  id: string;
  question: string;
  type: QuizQuestionType;
  options: QuizOption[];
  order_index: number;
};

const companyOptions: Company[] = ['Seven', 'ARQO'];
const roleOptions: UserRole[] = ['admin', 'colaborador'];
const statusOptions: UserStatus[] = ['ativo', 'inativo'];
const auditFilterOptions: Array<{ id: AdminAuditCategory | 'todos'; label: string }> = [
  { id: 'todos', label: 'Todos' },
  { id: 'usuarios', label: 'Usuários' },
  { id: 'admins', label: 'Admins' },
  { id: 'colaboradores', label: 'Colaboradores' },
  { id: 'conteudo', label: 'Conteúdo' },
  { id: 'midia', label: 'Mídia' },
  { id: 'certificados', label: 'Certificados' },
  { id: 'sistema', label: 'Sistema' },
];
const inputClass = 'h-10 rounded-md border border-[#D8D8DE] bg-white px-3 py-2 text-sm text-[#111114] placeholder-transparent outline-none transition focus:border-primary focus:ring-primary';
const textInputClass = 'rounded-md border border-[#D8D8DE] bg-white px-3 py-2 text-sm text-[#111114] placeholder-transparent outline-none transition focus:border-primary';
const emptyCourseForm = { company: 'Seven' as Company, title: '', description: '', cover_url: '' };
const emptyLessonForm = { title: '', description: '', content: '', order_index: 1 };
const emptyUserForm = {
  email: '',
  password: '',
  username: '',
  fullName: '',
  role: 'colaborador' as UserRole,
  company: 'Seven' as Company,
  status: 'ativo' as UserStatus,
  avatarUrl: '',
};

function emptyModuleForm(orderIndex = 1) {
  return { title: '', description: '', order_index: orderIndex, has_quiz: false };
}

function emptyQuizQuestion(orderIndex = 1): QuizQuestionDraft {
  return {
    id: crypto.randomUUID(),
    question: '',
    type: 'single',
    order_index: orderIndex,
    options: Array.from({ length: 3 }, (_, index) => ({
      id: crypto.randomUUID(),
      text: '',
      isCorrect: index === 0,
    })),
  };
}

function getCourseLessons(course: CourseTree) {
  return course.modules.flatMap((moduleItem) => moduleItem.lessons);
}

function getCourseStartDateForUser(course: CourseTree, progress: LessonProgress[], userId: string) {
  const lessonIds = new Set(getCourseLessons(course).map((lesson) => lesson.id));
  const dates = progress
    .filter((item) => item.user_id === userId && lessonIds.has(item.lesson_id))
    .map((item) => item.created_at)
    .sort();
  return dates[0] ?? null;
}

function formatCertificateWorkload(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  if (hours && remaining) return `${hours}h${remaining.toString().padStart(2, '0')}`;
  if (hours) return `${hours}h`;
  return `${minutes} minutos`;
}

async function renderCertificateBlob({
  userName,
  course,
  workloadMinutes,
  startedAt,
  completedAt,
}: {
  userName: string;
  course: CourseTree;
  workloadMinutes: number;
  startedAt: string | null;
  completedAt: string | null;
}) {
  const completionDate = completedAt ?? new Date().toISOString();
  const dateFormatter = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;

  if (!accessToken) {
    throw new Error('Sessão expirada. Faça login novamente.');
  }

  const response = await fetch('/api/render-certificate', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userName,
      courseName: course.title,
      workload: formatCertificateWorkload(workloadMinutes),
      city: 'Dourados - MS',
      startedAt,
      completedAt: completionDate,
      completionDate: dateFormatter.format(new Date(completionDate)),
      validationCode: createCertificateValidationCode(userName, course.title, completionDate),
      logoUrl: new URL('/assets/arqo/Logo%20Preferencial%20%E2%80%A2%20Arqo.webp', window.location.origin).toString(),
      signatureUrl: new URL('/assets/seven/assign_gilson%2005.svg', window.location.origin).toString(),
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Nao foi possivel renderizar o certificado.');
  }

  return response.blob();
}

function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-[26px] border border-[#E6E6EA] bg-white shadow-[0_16px_38px_rgba(17,17,20,0.05)] lg:rounded-lg ${className}`}>
      {children}
    </section>
  );
}

function resolveRoute(pathname: string): AdminRoute {
  if (pathname.includes('/cursos')) return 'cursos';
  if (pathname.includes('/progresso')) return 'progress';
  if (pathname.includes('/settings')) return 'settings';
  if (pathname.includes('/historico')) return 'history';
  return 'inicio';
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8A8A92]">{label}</span>
      {children}
    </label>
  );
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center bg-[#111114]/55 px-3 pb-3 pt-10 backdrop-blur-sm sm:items-center sm:px-4 sm:py-6">
      <section className="max-h-[92svh] w-full max-w-3xl overflow-y-auto rounded-[28px] border border-[#E6E6EA] bg-white p-5 text-[#111114] shadow-[0_24px_70px_rgba(17,17,20,0.18)] sm:rounded-lg">
        <header className="mb-5 flex items-center justify-between gap-4 border-b border-[#ECECEF] pb-4">
          <h2 className="text-xl font-semibold">{title}</h2>
          <button type="button" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-[15px] border border-[#E6E6EA] bg-[#F7F7F8] text-[#62626A] sm:h-9 sm:w-9 sm:rounded-md sm:bg-white">
            <X className="h-4 w-4" />
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}

function FormSection({
  title,
  description,
  children,
  className = '',
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-[22px] border border-[#ECECEF] bg-[#FAFAFB] p-4 lg:rounded-lg ${className}`}>
      <div className="mb-4">
        <h3 className="text-base font-semibold tracking-[-0.02em] text-[#111114]">{title}</h3>
        {description && <p className="mt-1 text-sm leading-5 text-[#777780]">{description}</p>}
      </div>
      <div className="grid gap-4">{children}</div>
    </section>
  );
}

function FormActions({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="sticky bottom-0 -mx-5 -mb-5 border-t border-[#ECECEF] bg-white/92 px-5 py-4 backdrop-blur-xl">
      {children}
    </div>
  );
}

function SelectField<T extends string>({
  value,
  options,
  onChange,
  disabled,
}: {
  value: T;
  options: T[];
  onChange: (value: T) => void;
  disabled?: boolean;
}) {
  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value as T)}
      className="h-10 w-full rounded-md border border-[#D8D8DE] bg-white px-3 text-sm text-[#111114] outline-none transition focus:border-primary disabled:bg-[#F1F1F3] disabled:text-[#8A8A92]"
    >
      {options.map((option) => <option key={option} value={option}>{option}</option>)}
    </select>
  );
}

function FilePicker({
  label,
  accept,
  helper,
  onChange,
}: {
  label: string;
  accept?: string;
  helper?: string;
  onChange: (file: File | null) => void;
}) {
  return (
    <label className="flex min-h-24 cursor-pointer flex-col items-center justify-center rounded-[20px] border border-dashed border-[#CFCFD6] bg-[#FAFAFB] px-4 py-5 text-center transition hover:border-primary hover:bg-primary/5 lg:rounded-lg">
      <UploadIcon />
      <span className="mt-2 text-sm font-semibold text-[#111114]">{label}</span>
      {helper && <span className="mt-1 text-xs leading-5 text-[#8A8A92]">{helper}</span>}
      <input
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(event) => onChange(event.target.files?.[0] ?? null)}
      />
    </label>
  );
}

function ToggleSwitch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center justify-between gap-4 rounded-[18px] border border-[#E6E6EA] bg-white px-4 py-3 text-left lg:rounded-md"
    >
      <span className="text-sm font-semibold text-[#111114]">{label}</span>
      <span className={`relative h-7 w-12 rounded-full transition ${checked ? 'bg-primary' : 'bg-[#D9D9DE]'}`}>
        <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${checked ? 'left-6' : 'left-1'}`} />
      </span>
    </button>
  );
}

function MediaPreview({
  title,
  url,
  fileName,
  type,
}: {
  title: string;
  url: string;
  fileName?: string;
  type: 'image' | 'video' | 'file';
}) {
  if (!url) return null;

  return (
    <div className="overflow-hidden rounded-[20px] border border-[#E6E6EA] bg-[#FAFAFB] lg:rounded-lg">
      <div className="flex items-center justify-between gap-3 border-b border-[#ECECEF] px-4 py-3">
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8A8A92]">{title}</span>
        {fileName && <span className="max-w-[52%] truncate text-xs font-semibold text-[#666670]">{fileName}</span>}
      </div>
      {type === 'image' ? (
        <div className="aspect-[16/10] bg-[#ECECEF]">
          <img src={url} alt={title} className="h-full w-full object-cover" loading="lazy" decoding="async" />
        </div>
      ) : type === 'video' ? (
        <VideoPlayer src={url} title={title} className="aspect-video w-full" />
      ) : (
        <div className="flex items-center justify-between gap-4 px-4 py-4">
          <div>
            <p className="text-sm font-semibold text-[#111114]">{fileName || 'Arquivo anexado'}</p>
            <p className="mt-1 text-xs text-[#8A8A92]">Material disponível para esta aula.</p>
          </div>
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="shrink-0 rounded-[14px] border border-[#D8D8DE] bg-white px-3 py-2 text-xs font-semibold text-[#111114] lg:rounded-md"
          >
            Abrir
          </a>
        </div>
      )}
    </div>
  );
}

function CurrentMediaActions({
  title,
  fileName,
  onView,
  onRemove,
}: {
  title: string;
  fileName?: string;
  onView: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[20px] border border-[#E6E6EA] bg-white p-3 lg:rounded-lg">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8A8A92]">{title}</p>
        <p className="mt-1 truncate text-sm font-semibold text-[#111114]">{fileName || 'Mídia atual'}</p>
      </div>
      <div className="flex shrink-0 gap-2">
        <button
          type="button"
          onClick={onView}
          aria-label={`Visualizar ${title}`}
          title={`Visualizar ${title}`}
          className="flex h-10 w-10 items-center justify-center rounded-[14px] border border-[#D8D8DE] bg-[#F7F7F8] text-[#111114] transition hover:border-primary hover:text-primary lg:rounded-md"
        >
          <Eye className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Excluir ${title}`}
          title={`Excluir ${title}`}
          className="flex h-10 w-10 items-center justify-center rounded-[14px] border border-red-200 bg-red-50 text-red-600 transition hover:border-red-300 hover:bg-red-100 lg:rounded-md"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function ProfilePictureCanvas({
  imageUrl,
  name,
  fileName,
  onView,
  onRemove,
}: {
  imageUrl: string;
  name: string;
  fileName?: string;
  onView?: () => void;
  onRemove?: () => void;
}) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || 'U';

  return (
    <div className="rounded-[24px] border border-[#E6E6EA] bg-white p-4 text-center lg:rounded-lg">
      <div className="mx-auto flex aspect-square w-full max-w-[176px] items-center justify-center overflow-hidden rounded-full border border-[#ECECEF] bg-[#F1F1F3] text-4xl font-semibold text-primary shadow-inner">
        {imageUrl ? (
          <img src={imageUrl} alt={name || 'Foto do usuário'} className="h-full w-full object-cover" loading="lazy" decoding="async" />
        ) : (
          <span>{initials}</span>
        )}
      </div>
      <p className="mt-3 truncate text-sm font-semibold text-[#111114]">{fileName || (imageUrl ? 'Foto atual' : 'Sem foto')}</p>
      {(onView || onRemove) && (
        <div className="mt-3 flex justify-center gap-2">
          {onView && (
            <button
              type="button"
              onClick={onView}
              aria-label="Visualizar foto"
              title="Visualizar foto"
              className="flex h-10 w-10 items-center justify-center rounded-[14px] border border-[#D8D8DE] bg-[#F7F7F8] text-[#111114] transition hover:border-primary hover:text-primary lg:rounded-md"
            >
              <Eye className="h-4 w-4" />
            </button>
          )}
          {onRemove && (
            <button
              type="button"
              onClick={onRemove}
              aria-label="Excluir foto"
              title="Excluir foto"
              className="flex h-10 w-10 items-center justify-center rounded-[14px] border border-red-200 bg-red-50 text-red-600 transition hover:border-red-300 hover:bg-red-100 lg:rounded-md"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function MediaViewerModal({
  media,
  onClose,
}: {
  media: PreviewMedia;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[180] flex items-end justify-center bg-[#111114]/70 px-3 pb-3 pt-10 backdrop-blur-sm sm:items-center sm:px-4 sm:py-6">
      <section className="flex max-h-[92svh] w-full max-w-5xl flex-col overflow-hidden rounded-[28px] border border-white/10 bg-white text-[#111114] shadow-[0_28px_90px_rgba(0,0,0,0.28)] sm:rounded-xl">
        <header className="flex items-center justify-between gap-4 border-b border-[#ECECEF] px-5 py-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8A8A92]">Visualização</p>
            <h2 className="mt-1 truncate text-lg font-semibold">{media.title}</h2>
            {media.fileName && <p className="mt-1 truncate text-xs font-semibold text-[#777780]">{media.fileName}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar visualização"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[15px] border border-[#E6E6EA] bg-[#F7F7F8] text-[#62626A] sm:rounded-md"
          >
            <X className="h-4 w-4" />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-auto bg-[#F4F4F6] p-3 sm:p-5">
          {media.type === 'image' ? (
            <div className="flex min-h-[52svh] items-center justify-center">
              <img src={media.url} alt={media.title} className="max-h-[72svh] max-w-full rounded-lg object-contain shadow-[0_18px_46px_rgba(17,17,20,0.16)]" />
            </div>
          ) : media.type === 'video' ? (
            <VideoPlayer src={media.url} title={media.title} autoPlay className="mx-auto aspect-video max-h-[72svh] w-full max-w-4xl rounded-lg" />
          ) : (
            <div className="h-[72svh] overflow-hidden rounded-lg border border-[#D8D8DE] bg-white">
              <iframe src={media.url} title={media.title} className="h-full w-full" />
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function previewTypeFor(file: File | null, url: string): 'image' | 'video' | 'file' {
  const source = file?.type || url;
  if (/image\//.test(source) || /\.(png|jpe?g|webp|gif|avif|svg)(\?|$)/i.test(source)) return 'image';
  if (/video\//.test(source) || /\.(mp4|webm|mov|m4v)(\?|$)/i.test(source)) return 'video';
  return 'file';
}

function fileLabel(file: File | null, path?: string | null) {
  if (file?.name) return file.name;
  if (!path) return undefined;
  return decodeURIComponent(path.split('/').pop() || path);
}

function UploadProgress({ value }: { value: number }) {
  if (value <= 0) return null;

  return (
    <div className="rounded-lg border border-[#E6E6EA] bg-[#FAFAFB] p-3">
      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.14em] text-[#8A8A92]">
        <span>Enviando arquivo</span>
        <span>{value}%</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#E7E7EC]">
        <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function IconButton({
  label,
  children,
  onClick,
}: {
  label: string;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="inline-flex h-10 w-10 items-center justify-center rounded-[14px] border border-[#D8D8DE] bg-[#F1F1F3] text-[#111114] transition hover:border-primary hover:bg-white lg:rounded-md"
    >
      {children}
    </button>
  );
}

function InfoBadge({ value, tone }: { value: string; tone: 'role' | 'company' | 'status' }) {
  const styles = {
    role: value === 'admin' ? 'bg-[#111114] text-white' : 'bg-primary/10 text-primary',
    company: value === 'ARQO' ? 'bg-[#F2EBDD] text-[#8A6722]' : 'bg-[#F3F3F5] text-[#111114]',
    status: value === 'ativo' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700',
  };

  return (
    <span className={`inline-flex w-fit items-center rounded-md px-2.5 py-1 text-xs font-semibold ${styles[tone]}`}>
      {value}
    </span>
  );
}

function Toast({ message, type }: { message: string; type: 'success' | 'error' }) {
  if (!message) return null;

  return (
    <div
      role="status"
      className={`fixed bottom-4 left-4 right-4 z-[180] rounded-lg border px-4 py-3 text-sm font-medium shadow-[0_18px_45px_rgba(17,17,20,0.16)] sm:bottom-6 sm:left-auto sm:right-6 sm:max-w-sm ${
        type === 'error'
          ? 'border-red-200 bg-red-50 text-red-700'
          : 'border-emerald-200 bg-emerald-50 text-emerald-700'
      }`}
    >
      {message}
    </div>
  );
}

function UploadIcon() {
  return (
    <span className="flex h-9 w-9 items-center justify-center rounded-md bg-white text-primary shadow-[0_8px_20px_rgba(17,17,20,0.08)]">
      <Plus className="h-4 w-4" />
    </span>
  );
}

function AppTabButton({
  active,
  icon,
  label,
  onClick,
}: {
  active?: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-[18px] px-2 py-2 text-[11px] font-semibold transition ${
        active ? 'bg-[#111114] text-white shadow-[0_10px_24px_rgba(17,17,20,0.18)]' : 'text-[#777780] hover:bg-[#F4F4F5] hover:text-[#111114]'
      }`}
    >
      {icon}
      <span className="max-w-full truncate">{label}</span>
    </button>
  );
}

function progressForUser(
  user: UserProfile,
  progress: LessonProgress[],
  courses: CourseTree[],
  quizzes: Quiz[],
  attempts: QuizAttempt[]
) {
  const userProgress = progress.filter((item) => item.user_id === user.id);
  const userAttempts = attempts.filter((item) => item.user_id === user.id);
  const companyCourses = courses.filter((course) => course.company === user.company);
  const modules = companyCourses.flatMap((course) => course.modules);
  const coursePercents = companyCourses.map((course) => getCourseProgress(course, userProgress, quizzes, userAttempts));
  const completed = companyCourses.reduce((sum, course) => (
    sum + getCompletedModuleCount(course, userProgress, quizzes, userAttempts)
  ), 0);
  const percent = coursePercents.length
    ? Math.round(coursePercents.reduce((sum, item) => sum + item, 0) / coursePercents.length)
    : Math.round(userProgress.reduce((sum, item) => sum + item.progress, 0) / Math.max(userProgress.length, 1));
  const latest = [...userProgress].sort((a, b) => (b.updated_at || b.created_at).localeCompare(a.updated_at || a.created_at))[0];
  const currentModule = modules.find((moduleItem) => (
    moduleItem.id === latest?.lesson_id
    || moduleItem.lessons.some((lesson) => lesson.id === latest?.lesson_id)
  ));

  return {
    percent: Number.isFinite(percent) ? percent : 0,
    currentModule: currentModule?.title ?? 'Não iniciado',
    completed,
    total: modules.length,
  };
}

export function AdminDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const route = resolveRoute(location.pathname);
  const { profile, signOut } = useAuth();
  const [courses, setCourses] = useState<CourseTree[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [progress, setProgress] = useState<LessonProgress[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [quizAttempts, setQuizAttempts] = useState<QuizAttempt[]>([]);
  const [courseFailures, setCourseFailures] = useState<CourseFailure[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [authUsers, setAuthUsers] = useState<ManagedAuthUser[]>([]);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');
  const [modal, setModal] = useState<ModalName>(null);
  const [pendingDeleteUser, setPendingDeleteUser] = useState<UserProfile | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedModuleId, setSelectedModuleId] = useState('');
  const [editingCourse, setEditingCourse] = useState<CourseTree | null>(null);
  const [editingModule, setEditingModule] = useState<CourseTree['modules'][number] | null>(null);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [courseForm, setCourseForm] = useState(emptyCourseForm);
  const [moduleForm, setModuleForm] = useState(emptyModuleForm());
  const [quizModule, setQuizModule] = useState<CourseTree['modules'][number] | null>(null);
  const [quizTitle, setQuizTitle] = useState('Prova do módulo');
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestionDraft[]>([emptyQuizQuestion()]);
  const [lessonForm, setLessonForm] = useState(emptyLessonForm);
  const [lessonVideo, setLessonVideo] = useState<File | null>(null);
  const [lessonAttachment, setLessonAttachment] = useState<File | null>(null);
  const [removeLessonVideo, setRemoveLessonVideo] = useState(false);
  const [removeLessonAttachment, setRemoveLessonAttachment] = useState(false);
  const [courseCoverFile, setCourseCoverFile] = useState<File | null>(null);
  const [removeCourseCover, setRemoveCourseCover] = useState(false);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [removeProfileImage, setRemoveProfileImage] = useState(false);
  const [profileImages, setProfileImages] = useState<Record<string, string>>({});
  const [courseCoverPreview, setCourseCoverPreview] = useState('');
  const [profileImagePreview, setProfileImagePreview] = useState('');
  const [lessonVideoPreview, setLessonVideoPreview] = useState('');
  const [lessonAttachmentPreview, setLessonAttachmentPreview] = useState('');
  const [previewMedia, setPreviewMedia] = useState<PreviewMedia | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [regeneratingCertificateKey, setRegeneratingCertificateKey] = useState('');
  const [deletingCertificateKey, setDeletingCertificateKey] = useState('');
  const [deletingUserId, setDeletingUserId] = useState('');
  const [revertingLogId, setRevertingLogId] = useState('');
  const [userForm, setUserForm] = useState(emptyUserForm);

  const refresh = async () => {
    setError('');
    const nextCourses = await fetchLearningTree();
    const preferModernSchema = nextCourses.some((course) => !course.id.startsWith('legacy-'));
    const moduleIds = nextCourses.flatMap((course) => course.modules.map((moduleItem) => moduleItem.id));
    const [nextUsers, nextProgress, nextQuizzes, nextAttempts, nextFailures, nextCertificates, nextAuditLogs] = await Promise.all([
      fetchUsers(),
      fetchAllProgress(preferModernSchema),
      fetchQuizzes(moduleIds),
      fetchQuizAttempts(),
      fetchCourseFailures(),
      fetchCertificates(),
      fetchAdminAuditLogs(),
    ]);
    const nextAuthUsers = await listManagedAuthUsers().catch(() => []);
    setCourses(nextCourses);
    setUsers(nextUsers);
    setProgress(nextProgress);
    setQuizzes(nextQuizzes);
    setQuizAttempts(nextAttempts);
    setCourseFailures(nextFailures);
    setCertificates(nextCertificates);
    setAuditLogs(nextAuditLogs);
    setAuthUsers(nextAuthUsers);
    setSelectedCourseId((current) => current || nextCourses[0]?.id || '');
  };

  useEffect(() => {
    refresh()
      .catch((nextError: unknown) => setError(nextError instanceof Error ? nextError.message : 'Não foi possível carregar o dashboard.'))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (!feedback && !error) return undefined;

    const timer = window.setTimeout(() => {
      setFeedback('');
      setError('');
    }, 2000);

    return () => window.clearTimeout(timer);
  }, [error, feedback]);

  useEffect(() => {
    const loadProfileImages = async () => {
      const entries = await Promise.all(
        users.map(async (user) => [user.id, await getStorageImageUrl('profile-images', user.avatar_url)] as const)
      );
      setProfileImages(Object.fromEntries(entries));
    };

    void loadProfileImages();
  }, [users]);

  useEffect(() => {
    if (courseCoverFile) {
      const previewUrl = URL.createObjectURL(courseCoverFile);
      setCourseCoverPreview(previewUrl);
      return () => URL.revokeObjectURL(previewUrl);
    }

    if (removeCourseCover) {
      setCourseCoverPreview('');
      return undefined;
    }

    if (!courseForm.cover_url) {
      setCourseCoverPreview('');
      return undefined;
    }

    let isMounted = true;
    getStorageImageUrl('course-covers', courseForm.cover_url)
      .then((url) => {
        if (isMounted) setCourseCoverPreview(url);
      })
      .catch(() => {
        if (isMounted) setCourseCoverPreview('');
      });

    return () => {
      isMounted = false;
    };
  }, [courseCoverFile, courseForm.cover_url, removeCourseCover]);

  useEffect(() => {
    if (profileImageFile) {
      const previewUrl = URL.createObjectURL(profileImageFile);
      setProfileImagePreview(previewUrl);
      return () => URL.revokeObjectURL(previewUrl);
    }

    if (removeProfileImage) {
      setProfileImagePreview('');
      return undefined;
    }

    if (!userForm.avatarUrl) {
      setProfileImagePreview('');
      return undefined;
    }

    let isMounted = true;
    getStorageImageUrl('profile-images', userForm.avatarUrl)
      .then((url) => {
        if (isMounted) setProfileImagePreview(url);
      })
      .catch(() => {
        if (isMounted) setProfileImagePreview('');
      });

    return () => {
      isMounted = false;
    };
  }, [profileImageFile, removeProfileImage, userForm.avatarUrl]);

  useEffect(() => {
    if (lessonVideo) {
      const previewUrl = URL.createObjectURL(lessonVideo);
      setLessonVideoPreview(previewUrl);
      return () => URL.revokeObjectURL(previewUrl);
    }

    if (removeLessonVideo) {
      setLessonVideoPreview('');
      return undefined;
    }

    if (!editingLesson?.video_url) {
      setLessonVideoPreview('');
      return undefined;
    }

    let isMounted = true;
    getLessonVideoUrl(editingLesson.video_url)
      .then((url) => {
        if (isMounted) setLessonVideoPreview(url);
      })
      .catch(() => {
        if (isMounted) setLessonVideoPreview('');
      });

    return () => {
      isMounted = false;
    };
  }, [editingLesson?.video_url, lessonVideo, removeLessonVideo]);

  useEffect(() => {
    if (lessonAttachment) {
      const previewUrl = URL.createObjectURL(lessonAttachment);
      setLessonAttachmentPreview(previewUrl);
      return () => URL.revokeObjectURL(previewUrl);
    }

    if (removeLessonAttachment) {
      setLessonAttachmentPreview('');
      return undefined;
    }

    if (!editingLesson?.attachment_url) {
      setLessonAttachmentPreview('');
      return undefined;
    }

    let isMounted = true;
    getLessonAttachmentUrl(editingLesson.attachment_url)
      .then((url) => {
        if (isMounted) setLessonAttachmentPreview(url);
      })
      .catch(() => {
        if (isMounted) setLessonAttachmentPreview('');
      });

    return () => {
      isMounted = false;
    };
  }, [editingLesson?.attachment_url, lessonAttachment, removeLessonAttachment]);

  const selectedCourse = courses.find((course) => course.id === selectedCourseId) ?? courses[0];
  const selectedModule = selectedCourse?.modules.find((moduleItem) => moduleItem.id === selectedModuleId) ?? null;
  const selectedCourseOrder = selectedCourse ? courses.findIndex((course) => course.id === selectedCourse.id) + 1 : 1;
  const selectedModuleOrder = selectedCourse?.modules.findIndex((moduleItem) => moduleItem.id === selectedModule?.id) ?? 0;
  const lessonMediaContext = {
    company: selectedCourse?.company ?? 'Seven' as Company,
    courseOrder: selectedCourseOrder || 1,
    moduleOrder: selectedModuleOrder + 1 || 1,
    lessonOrder: lessonForm.order_index || 1,
  };
  const collaborators = users.filter((user) => user.role === 'colaborador');
  const admins = users.filter((user) => user.role === 'admin');
  const missingProfiles = authUsers.filter((authUser) => !authUser.has_profile);
  const totalLessons = courses.reduce((sum, course) => sum + course.modules.reduce((moduleSum, moduleItem) => moduleSum + moduleItem.lessons.length, 0), 0);
  const averageProgress = collaborators.length
    ? Math.round(collaborators.reduce((sum, user) => sum + progressForUser(user, progress, courses, quizzes, quizAttempts).percent, 0) / collaborators.length)
    : 0;
  const hasCurrentLessonVideo = modal === 'editLesson' && Boolean(editingLesson?.video_url) && !removeLessonVideo;
  const hasCurrentLessonAttachment = modal === 'editLesson' && Boolean(editingLesson?.attachment_url) && !removeLessonAttachment;
  const hasCurrentProfileImage = modal === 'editUser' && Boolean(userForm.avatarUrl) && !removeProfileImage;
  const hasCurrentCourseCover = modal === 'editCourse' && Boolean(courseForm.cover_url) && !removeCourseCover;
  const routeTitle = route === 'inicio'
    ? 'Início'
    : route === 'cursos'
      ? 'Cursos'
      : route === 'progress'
        ? 'Progresso'
        : route === 'history'
          ? 'Histórico'
          : 'Configurações';

  const resetCourseDraft = () => {
    setEditingCourse(null);
    setCourseForm(emptyCourseForm);
    setCourseCoverFile(null);
    setCourseCoverPreview('');
    setRemoveCourseCover(false);
  };

  const resetModuleDraft = (orderIndex = (selectedCourse?.modules.length ?? 0) + 1) => {
    setEditingModule(null);
    setModuleForm(emptyModuleForm(orderIndex));
  };

  const resetLessonDraft = (orderIndex = (selectedModule?.lessons.length ?? 0) + 1) => {
    setEditingLesson(null);
    setLessonForm({ ...emptyLessonForm, order_index: orderIndex });
    setLessonVideo(null);
    setLessonAttachment(null);
    setLessonVideoPreview('');
    setLessonAttachmentPreview('');
    setRemoveLessonVideo(false);
    setRemoveLessonAttachment(false);
  };

  const resetUserDraft = () => {
    setEditingUser(null);
    setUserForm(emptyUserForm);
    setProfileImageFile(null);
    setProfileImagePreview('');
    setRemoveProfileImage(false);
  };

  const closeModal = () => {
    setModal(null);
    setPreviewMedia(null);
    resetCourseDraft();
    resetModuleDraft();
    resetLessonDraft();
    resetUserDraft();
    setQuizModule(null);
    setUploadProgress(0);
  };

  const closeDeleteUserModal = () => {
    if (deletingUserId) return;
    setPendingDeleteUser(null);
  };

  const withUploadProgress = async <T,>(uploadTask: () => Promise<T>) => {
    setUploadProgress(8);
    const timer = window.setInterval(() => {
      setUploadProgress((current) => Math.min(92, current + 12));
    }, 220);

    try {
      const result = await uploadTask();
      setUploadProgress(100);
      return result;
    } finally {
      window.clearInterval(timer);
      window.setTimeout(() => setUploadProgress(0), 650);
    }
  };

  const openPreview = (media: PreviewMedia) => {
    setPreviewMedia(media);
  };

  const actorName = profile?.full_name || profile?.username || profile?.email || 'Administrador';

  const recordAuditLog = async (values: {
    category: AdminAuditCategory;
    action: string;
    targetId?: string | null;
    targetType?: string | null;
    targetName?: string | null;
    company?: Company | null;
    message: string;
    metadata?: Record<string, unknown>;
  }) => {
    try {
      const createdLog = await createAdminAuditLog({
        actorId: profile?.id ?? null,
        actorName,
        ...values,
      });
      setAuditLogs(await fetchAdminAuditLogs());
      return createdLog;
    } catch (auditError) {
      console.warn('Falha ao registrar histórico administrativo.', auditError);
      return null;
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  const handleRevertAuditLog = async (log: AdminAuditLog) => {
    if (!log.target_id || log.reverted_at) return;
    const label = log.target_name || log.message;
    if (!window.confirm(`Reverter esta ação do histórico?\n\n${log.message}`)) return;

    try {
      setRevertingLogId(log.id);
      const metadata = log.metadata;

      if (log.action === 'create_course') {
        await deleteCourse(log.target_id);
      } else if (log.action === 'create_module') {
        await deleteModule(log.target_id);
      } else if (log.action === 'create_lesson') {
        await deleteLesson(log.target_id);
      } else if (log.action === 'update_course') {
        const previousCourse = metadataRecord(metadata, 'previous_course');
        await updateCourse(log.target_id, {
          company: previousCourse.company === 'ARQO' ? 'ARQO' : 'Seven',
          title: metadataString(previousCourse, 'title', label),
          description: metadataString(previousCourse, 'description'),
          cover_url: metadataNullableString(previousCourse, 'cover_url'),
          is_active: previousCourse.is_active !== false,
        });
      } else if (log.action === 'update_module') {
        const previousModule = metadataRecord(metadata, 'previous_module');
        await updateModule(log.target_id, {
          title: metadataString(previousModule, 'title', label),
          description: metadataString(previousModule, 'description'),
          order_index: metadataNumber(previousModule, 'order_index', 1),
          has_quiz: previousModule.has_quiz === true,
        });
      } else if (log.action === 'update_lesson') {
        const previousLesson = metadataRecord(metadata, 'previous_lesson');
        await updateLesson(log.target_id, {
          title: metadataString(previousLesson, 'title', label),
          description: metadataString(previousLesson, 'description'),
          content: metadataString(previousLesson, 'content'),
          order_index: metadataNumber(previousLesson, 'order_index', 1),
          video_url: metadataNullableString(previousLesson, 'video_url'),
          video_duration_seconds: metadataNullableNumber(previousLesson, 'video_duration_seconds'),
          attachment_url: metadataNullableString(previousLesson, 'attachment_url'),
        });
      } else {
        throw new Error('Esta ação ainda não pode ser revertida automaticamente.');
      }

      const revertLog = await recordAuditLog({
        category: 'sistema',
        action: `revert_${log.action}`,
        targetId: log.target_id,
        targetType: log.target_type,
        targetName: log.target_name,
        company: log.company,
        message: `${actorName} reverteu a ação: ${log.message}`,
        metadata: { reverted_log_id: log.id, original_action: log.action },
      });
      await markAdminAuditLogReverted(log.id, {
        revertedBy: profile?.id ?? null,
        revertLogId: revertLog?.id ?? null,
      });
      await refresh();
      setFeedback('Ação revertida com sucesso.');
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Não foi possível reverter esta ação.');
    } finally {
      setRevertingLogId('');
    }
  };

  const submitCourse = async (event: FormEvent) => {
    event.preventDefault();
    try {
      if (!courseCoverFile) {
        throw new Error('Anexe uma capa de curso com no máximo 600x400 px.');
      }
      const coverUrl = courseCoverFile
        ? await withUploadProgress(() => uploadCourseCover(courseCoverFile, { company: courseForm.company, title: courseForm.title }))
        : courseForm.cover_url;
      const createdCourse = await createCourse({ ...courseForm, cover_url: coverUrl });
      setSelectedCourseId(createdCourse.id);
      await recordAuditLog({
        category: 'conteudo',
        action: 'create_course',
        targetId: createdCourse.id,
        targetType: 'course',
        targetName: createdCourse.title,
        company: createdCourse.company,
        message: `${actorName} criou o curso ${createdCourse.title} para empresa ${createdCourse.company}.`,
        metadata: { cover_url: coverUrl },
      });
      if (coverUrl) {
        await recordAuditLog({
          category: 'midia',
          action: 'upload_course_cover',
          targetId: createdCourse.id,
          targetType: 'course',
          targetName: createdCourse.title,
          company: createdCourse.company,
          message: `${actorName} adicionou uma capa no curso ${createdCourse.title}.`,
          metadata: { cover_url: coverUrl },
        });
      }
      resetCourseDraft();
      await refresh();
      setFeedback('Curso criado com sucesso.');
      closeModal();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Erro ao criar curso.');
    }
  };

  const submitCourseEdit = async (event: FormEvent) => {
    event.preventDefault();
    if (!editingCourse) return;
    try {
      const previousCoverUrl = editingCourse.cover_url;
      const coverUrl = courseCoverFile
        ? await withUploadProgress(() => uploadCourseCover(courseCoverFile, { company: courseForm.company, title: courseForm.title }))
        : removeCourseCover
          ? null
          : courseForm.cover_url;
      await updateCourse(editingCourse.id, { ...courseForm, cover_url: coverUrl });
      if ((removeCourseCover || courseCoverFile) && previousCoverUrl && previousCoverUrl !== coverUrl) {
        await removeStorageObject('course-covers', previousCoverUrl);
      }
      await recordAuditLog({
        category: 'conteudo',
        action: 'update_course',
        targetId: editingCourse.id,
        targetType: 'course',
        targetName: courseForm.title,
        company: courseForm.company,
        message: `${actorName} atualizou o curso ${courseForm.title}.`,
        metadata: {
          previous_course: {
            company: editingCourse.company,
            title: editingCourse.title,
            description: editingCourse.description ?? '',
            cover_url: editingCourse.cover_url ?? null,
            is_active: editingCourse.is_active,
          },
        },
      });
      if (courseCoverFile || removeCourseCover) {
        await recordAuditLog({
          category: 'midia',
          action: courseCoverFile ? 'upload_course_cover' : 'remove_course_cover',
          targetId: editingCourse.id,
          targetType: 'course',
          targetName: courseForm.title,
          company: courseForm.company,
          message: courseCoverFile
            ? `${actorName} adicionou uma capa no curso ${courseForm.title}.`
            : `${actorName} removeu a capa do curso ${courseForm.title}.`,
          metadata: { previous_cover_url: previousCoverUrl, cover_url: coverUrl },
        });
      }
      await refresh();
      setFeedback('Curso atualizado.');
      closeModal();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Erro ao editar curso.');
    }
  };

  const handleDeleteCourse = async (course: CourseTree) => {
    if (!window.confirm(`Excluir o curso "${course.title}" e seus módulos/aulas?`)) return;
    try {
      await deleteCourse(course.id);
      setSelectedCourseId('');
      await recordAuditLog({
        category: 'conteudo',
        action: 'delete_course',
        targetId: course.id,
        targetType: 'course',
        targetName: course.title,
        company: course.company,
        message: `${actorName} excluiu o curso ${course.title}.`,
        metadata: { modules: course.modules.length },
      });
      await refresh();
      setFeedback('Curso excluído.');
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Erro ao excluir curso.');
    }
  };

  const submitModule = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedCourse) return;
    try {
      const createdModule = await createModule({ ...moduleForm, course_id: selectedCourse.id, company: selectedCourse.company });
      await recordAuditLog({
        category: 'conteudo',
        action: 'create_module',
        targetId: createdModule.id,
        targetType: 'module',
        targetName: createdModule.title,
        company: selectedCourse.company,
        message: `${actorName} criou o módulo ${createdModule.title} no curso ${selectedCourse.title}.`,
        metadata: { course_id: selectedCourse.id, order_index: moduleForm.order_index, has_quiz: moduleForm.has_quiz },
      });
      resetModuleDraft(moduleForm.order_index + 1);
      await refresh();
      setFeedback('Módulo criado com sucesso.');
      closeModal();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Erro ao criar módulo.');
    }
  };

  const submitModuleEdit = async (event: FormEvent) => {
    event.preventDefault();
    if (!editingModule) return;
    try {
      await updateModule(editingModule.id, moduleForm);
      await recordAuditLog({
        category: 'conteudo',
        action: 'update_module',
        targetId: editingModule.id,
        targetType: 'module',
        targetName: moduleForm.title,
        company: selectedCourse?.company ?? null,
        message: `${actorName} atualizou o módulo ${moduleForm.title}.`,
        metadata: {
          previous_module: {
            title: editingModule.title,
            description: editingModule.description ?? '',
            order_index: editingModule.order_index,
            has_quiz: editingModule.has_quiz === true,
          },
          has_quiz: moduleForm.has_quiz,
        },
      });
      await refresh();
      setFeedback('Módulo atualizado.');
      closeModal();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Erro ao editar módulo.');
    }
  };

  const handleDeleteModule = async (moduleItem: CourseTree['modules'][number]) => {
    if (!window.confirm(`Excluir o módulo "${moduleItem.title}" e suas aulas?`)) return;
    try {
      await deleteModule(moduleItem.id);
      await recordAuditLog({
        category: 'conteudo',
        action: 'delete_module',
        targetId: moduleItem.id,
        targetType: 'module',
        targetName: moduleItem.title,
        company: selectedCourse?.company ?? null,
        message: `${actorName} excluiu o módulo ${moduleItem.title}.`,
        metadata: { lessons: moduleItem.lessons.length },
      });
      await refresh();
      setFeedback('Módulo excluído.');
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Erro ao excluir módulo.');
    }
  };

  const openQuizEditor = (moduleItem: CourseTree['modules'][number]) => {
    const quiz = quizzes.find((item) => item.module_id === moduleItem.id);
    setQuizModule(moduleItem);
    setQuizTitle(quiz?.title ?? `Prova - ${moduleItem.title}`);
    setQuizQuestions(
      quiz?.questions.length
        ? quiz.questions.map((question, index) => ({
          id: question.id,
          question: question.question,
          type: question.type,
          order_index: index + 1,
          options: question.options.length >= 3 ? question.options : emptyQuizQuestion(index + 1).options,
        }))
        : [emptyQuizQuestion()]
    );
    setModal('quiz');
  };

  const submitQuiz = async (event: FormEvent) => {
    event.preventDefault();
    if (!quizModule) return;

    try {
      await saveModuleQuiz({
        moduleId: quizModule.id,
        title: quizTitle,
        isActive: true,
        questions: quizQuestions.map((question, index) => ({ ...question, order_index: index + 1 })),
      });
      await recordAuditLog({
        category: 'conteudo',
        action: 'save_quiz',
        targetId: quizModule.id,
        targetType: 'quiz',
        targetName: quizTitle,
        company: selectedCourse?.company ?? null,
        message: `${actorName} salvou a prova ${quizTitle}.`,
        metadata: { module_id: quizModule.id, questions: quizQuestions.length },
      });
      await refresh();
      setFeedback('Prova salva com sucesso.');
      closeModal();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Erro ao salvar prova.');
    }
  };

  const submitLesson = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedModuleId) return;
    try {
      const videoPath = lessonVideo ? await withUploadProgress(() => uploadLessonVideo(lessonVideo, lessonMediaContext)) : null;
      const videoDuration = lessonVideo ? await getVideoFileDuration(lessonVideo) : null;
      const attachmentPath = lessonAttachment ? await withUploadProgress(() => uploadLessonAttachment(lessonAttachment, lessonMediaContext)) : null;
      const createdLesson = await createLesson({ ...lessonForm, module_id: selectedModuleId, video_url: videoPath, attachment_url: attachmentPath, video_duration_seconds: videoDuration });
      await recordAuditLog({
        category: 'conteudo',
        action: 'create_lesson',
        targetId: createdLesson.id,
        targetType: 'lesson',
        targetName: createdLesson.title,
        company: selectedCourse?.company ?? null,
        message: `${actorName} criou a aula ${createdLesson.title}.`,
        metadata: { module_id: selectedModuleId, order_index: lessonForm.order_index },
      });
      if (videoPath) {
        await recordAuditLog({
          category: 'midia',
          action: 'upload_lesson_video',
          targetId: createdLesson.id,
          targetType: 'lesson',
          targetName: createdLesson.title,
          company: selectedCourse?.company ?? null,
          message: `${actorName} adicionou um vídeo na aula ${createdLesson.title}.`,
          metadata: { video_url: videoPath },
        });
      }
      if (attachmentPath) {
        await recordAuditLog({
          category: 'midia',
          action: 'upload_lesson_attachment',
          targetId: createdLesson.id,
          targetType: 'lesson',
          targetName: createdLesson.title,
          company: selectedCourse?.company ?? null,
          message: `${actorName} adicionou um anexo na aula ${createdLesson.title}.`,
          metadata: { attachment_url: attachmentPath },
        });
      }
      resetLessonDraft(lessonForm.order_index + 1);
      await refresh();
      setFeedback('Aula criada com sucesso.');
      closeModal();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Erro ao criar aula.');
    }
  };

  const submitLessonEdit = async (event: FormEvent) => {
    event.preventDefault();
    if (!editingLesson) return;
    try {
      const previousVideoUrl = editingLesson.video_url;
      const previousAttachmentUrl = editingLesson.attachment_url;
      const videoPath = lessonVideo
        ? await withUploadProgress(() => uploadLessonVideo(lessonVideo, lessonMediaContext))
        : removeLessonVideo
          ? null
          : editingLesson.video_url;
      const videoDuration = lessonVideo
        ? await getVideoFileDuration(lessonVideo)
        : removeLessonVideo
          ? null
          : editingLesson.video_duration_seconds;
      const attachmentPath = lessonAttachment
        ? await withUploadProgress(() => uploadLessonAttachment(lessonAttachment, lessonMediaContext))
        : removeLessonAttachment
          ? null
          : editingLesson.attachment_url;
      await updateLesson(editingLesson.id, {
        title: lessonForm.title,
        description: lessonForm.description,
        content: lessonForm.content,
        order_index: lessonForm.order_index,
        video_url: videoPath,
        video_duration_seconds: videoDuration,
        attachment_url: attachmentPath,
      });
      if ((removeLessonVideo || lessonVideo) && previousVideoUrl && previousVideoUrl !== videoPath) {
        await removeStorageObject('lesson-videos', previousVideoUrl);
      }
      if ((removeLessonAttachment || lessonAttachment) && previousAttachmentUrl && previousAttachmentUrl !== attachmentPath) {
        await removeStorageObject('lesson-attachments', previousAttachmentUrl);
      }
      await recordAuditLog({
        category: 'conteudo',
        action: 'update_lesson',
        targetId: editingLesson.id,
        targetType: 'lesson',
        targetName: lessonForm.title,
        company: selectedCourse?.company ?? null,
        message: `${actorName} atualizou a aula ${lessonForm.title}.`,
        metadata: {
          previous_lesson: {
            title: editingLesson.title,
            description: editingLesson.description ?? '',
            content: editingLesson.content ?? '',
            order_index: editingLesson.order_index,
            video_url: previousVideoUrl,
            video_duration_seconds: editingLesson.video_duration_seconds ?? null,
            attachment_url: previousAttachmentUrl,
          },
        },
      });
      if (lessonVideo || removeLessonVideo) {
        await recordAuditLog({
          category: 'midia',
          action: lessonVideo ? 'upload_lesson_video' : 'remove_lesson_video',
          targetId: editingLesson.id,
          targetType: 'lesson',
          targetName: lessonForm.title,
          company: selectedCourse?.company ?? null,
          message: lessonVideo
            ? `${actorName} adicionou um vídeo na aula ${lessonForm.title}.`
            : `${actorName} removeu o vídeo da aula ${lessonForm.title}.`,
          metadata: { previous_video_url: previousVideoUrl, video_url: videoPath },
        });
      }
      if (lessonAttachment || removeLessonAttachment) {
        await recordAuditLog({
          category: 'midia',
          action: lessonAttachment ? 'upload_lesson_attachment' : 'remove_lesson_attachment',
          targetId: editingLesson.id,
          targetType: 'lesson',
          targetName: lessonForm.title,
          company: selectedCourse?.company ?? null,
          message: lessonAttachment
            ? `${actorName} adicionou um anexo na aula ${lessonForm.title}.`
            : `${actorName} removeu o anexo da aula ${lessonForm.title}.`,
          metadata: { previous_attachment_url: previousAttachmentUrl, attachment_url: attachmentPath },
        });
      }
      await refresh();
      setFeedback('Aula atualizada.');
      closeModal();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Erro ao editar aula.');
    }
  };

  const submitUser = async (event: FormEvent) => {
    event.preventDefault();
    try {
      const avatarUrl = profileImageFile
        ? await withUploadProgress(() => uploadProfileImage(profileImageFile, { fullName: userForm.fullName || userForm.username, company: userForm.company }))
        : userForm.avatarUrl;
      const createdUser = await createManagedUser({ ...userForm, avatarUrl }) as { id?: string } | null;
      if (avatarUrl) {
        await recordAuditLog({
          category: 'midia',
          action: 'upload_profile_image',
          targetId: createdUser?.id ?? null,
          targetType: 'profile',
          targetName: userForm.fullName || userForm.username,
          company: userForm.company,
          message: `${actorName} adicionou uma foto no perfil do(a) ${userForm.role === 'admin' ? 'administrador(a)' : 'colaborador(a)'} ${userForm.fullName || userForm.username}.`,
          metadata: { avatar_url: avatarUrl, role: userForm.role },
        });
      }
      resetUserDraft();
      await refresh();
      setFeedback('Usuário criado pela função segura.');
      closeModal();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'A função admin-users ainda não está implantada ou retornou erro.');
    }
  };

  const submitUserEdit = async (event: FormEvent) => {
    event.preventDefault();
    if (!editingUser) return;
    try {
      const previousAvatarUrl = editingUser.avatar_url;
      const avatarUrl = profileImageFile
        ? await withUploadProgress(() => uploadProfileImage(profileImageFile, { fullName: userForm.fullName || userForm.username, company: userForm.role === 'admin' ? 'Seven' : userForm.company }))
        : removeProfileImage
          ? null
          : userForm.avatarUrl;
      await updateManagedUser({
        id: editingUser.id,
        email: userForm.email,
        password: userForm.password || undefined,
        username: userForm.username,
        fullName: userForm.fullName,
        role: userForm.role,
        company: userForm.role === 'admin' ? 'Seven' : userForm.company,
        status: userForm.status,
        avatarUrl,
      });
      if ((removeProfileImage || profileImageFile) && previousAvatarUrl && previousAvatarUrl !== avatarUrl) {
        await removeStorageObject('profile-images', previousAvatarUrl);
      }
      if (profileImageFile || removeProfileImage) {
        await recordAuditLog({
          category: 'midia',
          action: profileImageFile ? 'upload_profile_image' : 'remove_profile_image',
          targetId: editingUser.id,
          targetType: 'profile',
          targetName: userForm.fullName || userForm.username,
          company: userForm.role === 'admin' ? 'Seven' : userForm.company,
          message: profileImageFile
            ? `${actorName} adicionou uma foto no perfil do(a) ${userForm.role === 'admin' ? 'administrador(a)' : 'colaborador(a)'} ${userForm.fullName || userForm.username}.`
            : `${actorName} removeu a foto do perfil de ${userForm.fullName || userForm.username}.`,
          metadata: { previous_avatar_url: previousAvatarUrl, avatar_url: avatarUrl, role: userForm.role },
        });
      }
      await refresh();
      setFeedback('Usuário atualizado.');
      closeModal();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Erro ao editar usuário.');
    }
  };

  const handleSyncProfile = async (id: string) => {
    try {
      await syncManagedUserProfile(id);
      await refresh();
      setFeedback('Perfil sincronizado com Authentication.');
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Não foi possível sincronizar o perfil.');
    }
  };

  const handleDeleteUser = async (user: UserProfile) => {
    if (!profile) return;
    if (user.id === profile.id) {
      setError('Você não pode excluir o próprio cadastro enquanto está logado.');
      return;
    }

    setPendingDeleteUser(user);
  };

  const confirmDeleteUser = async () => {
    if (!pendingDeleteUser) return;

    try {
      setDeletingUserId(pendingDeleteUser.id);
      await deleteManagedUser(pendingDeleteUser.id);
      if (pendingDeleteUser.avatar_url) {
        await removeStorageObject('profile-images', pendingDeleteUser.avatar_url);
        await recordAuditLog({
          category: 'midia',
          action: 'remove_profile_image',
          targetId: pendingDeleteUser.id,
          targetType: 'profile',
          targetName: pendingDeleteUser.full_name || pendingDeleteUser.username,
          company: pendingDeleteUser.company,
          message: `${actorName} removeu a foto do perfil de ${pendingDeleteUser.full_name || pendingDeleteUser.username}.`,
          metadata: { avatar_url: pendingDeleteUser.avatar_url, role: pendingDeleteUser.role },
        });
      }
      await refresh();
      setFeedback('Usuário foi excluído do banco de dados.');
      setPendingDeleteUser(null);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Não foi possível excluir o usuário.');
    } finally {
      setDeletingUserId('');
    }
  };

  const handleRegenerateCertificate = async (user: UserProfile, course: CourseTree, certificate?: Certificate | null) => {
    const key = `${user.id}:${course.id}`;
    setRegeneratingCertificateKey(key);
    setError('');
    setFeedback('');

    try {
      const courseQuizzes = quizzes.filter((quiz) => quiz.is_active && course.modules.some((moduleItem) => moduleItem.id === quiz.module_id));
      const workloadMinutes = calculateCourseWorkloadMinutes(course, courseQuizzes);
      const startedAt = getCourseStartDateForUser(course, progress, user.id);
      const completedAt = certificate?.completed_at ?? new Date().toISOString();
      const validationCode = createCertificateValidationCode(user.full_name || user.username, course.title, completedAt);
      const blob = await renderCertificateBlob({
        userName: user.full_name || user.username,
        course,
        workloadMinutes,
        startedAt,
        completedAt,
      });
      const certificatePath = await uploadCertificatePng(blob, {
        company: user.company,
        courseTitle: course.title,
        userName: user.full_name || user.username,
        userId: user.id,
      });
      const nextCertificate = await upsertCertificate({
        userId: user.id,
        courseId: course.id,
        certificateUrl: certificatePath,
        workloadMinutes,
        startedAt,
        completedAt,
        validationCode,
      });

      if (certificate?.certificate_url && certificate.certificate_url !== certificatePath) {
        await removeStorageObject('certificates', certificate.certificate_url).catch(() => undefined);
      }

      await recordAuditLog({
        category: 'certificados',
        action: certificate ? 'regenerate_certificate' : 'generate_certificate',
        targetId: nextCertificate.id,
        targetType: 'certificate',
        targetName: user.full_name || user.username,
        company: user.company,
        message: certificate
          ? `${actorName} regerou o certificado de ${user.full_name || user.username} no curso ${course.title}.`
          : `${actorName} gerou o certificado de ${user.full_name || user.username} no curso ${course.title}.`,
        metadata: { course_id: course.id, certificate_url: certificatePath },
      });
      setCertificates((current) => [nextCertificate, ...current.filter((item) => !(item.user_id === user.id && item.course_id === course.id))]);
      await refresh();
      setFeedback(certificate ? 'Certificado regerado com sucesso.' : 'Certificado gerado com sucesso.');
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Nao foi possivel regerar o certificado.');
    } finally {
      setRegeneratingCertificateKey('');
    }
  };

  const handleDeleteCertificate = async (user: UserProfile, course: CourseTree, certificate: Certificate) => {
    const label = user.full_name || user.username || user.email || 'este colaborador';
    if (!window.confirm(`Apagar o certificado de ${label} no curso "${course.title}"? Esta acao remove o PNG do Supabase.`)) return;

    const key = `${user.id}:${course.id}`;
    setDeletingCertificateKey(key);
    setError('');
    setFeedback('');

    try {
      if (certificate.certificate_url) {
        await removeStorageObject('certificates', certificate.certificate_url);
      }
      await deleteCertificate(certificate.id);
      await recordAuditLog({
        category: 'certificados',
        action: 'delete_certificate',
        targetId: certificate.id,
        targetType: 'certificate',
        targetName: user.full_name || user.username,
        company: user.company,
        message: `${actorName} excluiu o certificado de ${user.full_name || user.username} no curso ${course.title}.`,
        metadata: { course_id: course.id, certificate_url: certificate.certificate_url },
      });
      setCertificates((current) => current.filter((item) => item.id !== certificate.id));
      setFeedback('Certificado apagado do colaborador.');
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Nao foi possivel apagar o certificado.');
    } finally {
      setDeletingCertificateKey('');
    }
  };

  const openCourseCreator = () => {
    resetCourseDraft();
    setModal('course');
  };

  const openModuleCreator = () => {
    resetModuleDraft((selectedCourse?.modules.length ?? 0) + 1);
    setModal('module');
  };

  const openLessonCreator = (moduleItem: CourseTree['modules'][number]) => {
    setSelectedModuleId(moduleItem.id);
    resetLessonDraft(moduleItem.lessons.length + 1);
    setModal('lesson');
  };

  const openUserCreator = () => {
    resetUserDraft();
    setModal('user');
  };

  const openCourseEditor = (course: CourseTree) => {
    setEditingCourse(course);
    setCourseCoverFile(null);
    setRemoveCourseCover(false);
    setCourseForm({
      company: course.company,
      title: course.title,
      description: course.description ?? '',
      cover_url: course.cover_url ?? '',
    });
    setModal('editCourse');
  };

  const openModuleEditor = (moduleItem: CourseTree['modules'][number]) => {
    setEditingModule(moduleItem);
    setModuleForm({
      title: moduleItem.title,
      description: moduleItem.description ?? '',
      order_index: moduleItem.order_index,
      has_quiz: moduleItem.has_quiz === true,
    });
    setModal('editModule');
  };

  const openLessonEditor = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setLessonVideo(null);
    setLessonAttachment(null);
    setRemoveLessonVideo(false);
    setRemoveLessonAttachment(false);
    setLessonForm({
      title: lesson.title,
      description: lesson.description ?? '',
      content: lesson.content ?? '',
      order_index: lesson.order_index,
    });
    setModal('editLesson');
  };

  const openUserEditor = (user: UserProfile) => {
    setEditingUser(user);
    setProfileImageFile(null);
    setRemoveProfileImage(false);
    setUserForm({
      email: user.email ?? '',
      password: '',
      username: user.username,
      fullName: user.full_name ?? '',
      role: user.role,
      company: user.company,
      status: user.status,
      avatarUrl: user.avatar_url ?? '',
    });
    setModal('editUser');
  };

  if (location.pathname === '/dashboard/admin/') {
    return <Navigate to="/dashboard/admin" replace />;
  }

  return (
    <main className="safe-page-x relative min-h-screen bg-[#F2F2F7] pb-28 text-[#111114] lg:bg-[#F7F7F8] lg:pb-0">
      <header className="sticky top-0 z-40 border-b border-white/70 bg-[#F2F2F7]/86 px-5 pb-3 pt-[calc(env(safe-area-inset-top)+0.75rem)] backdrop-blur-2xl lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <button type="button" onClick={() => navigate('/home')} className="flex min-w-0 items-center gap-3 text-left">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] bg-white shadow-[0_10px_26px_rgba(17,17,20,0.08)]">
              <img src="/assets/seven/Logo%20N.webp" alt="" className="h-7 w-7 object-contain" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">Admin</span>
              <span className="block truncate text-lg font-semibold tracking-[-0.04em]">
                {routeTitle}
              </span>
            </span>
          </button>
          <button
            type="button"
            onClick={handleSignOut}
            aria-label="Sair"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] bg-white text-[#666670] shadow-[0_10px_26px_rgba(17,17,20,0.08)]"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>
      <div className="grid min-h-screen lg:grid-cols-[minmax(208px,236px)_minmax(0,1fr)] min-[1366px]:grid-cols-[minmax(240px,280px)_minmax(0,1fr)]">
        <aside className="hidden flex-col border-b border-[#E4E4E8] bg-white px-4 py-5 shadow-[8px_0_28px_rgba(17,17,20,0.04)] lg:flex lg:min-h-screen lg:border-b-0 lg:border-r min-[1366px]:px-5">
          <div>
            <button type="button" onClick={() => navigate('/home')} className="flex items-center gap-3 text-left">
              <img src="/assets/seven/Logo%20N.webp" alt="" className="h-9 w-9 object-contain" />
              <span>
                <span className="block text-sm font-semibold">Ecossistema Seven</span>
                <span className="block text-xs text-[#8A8A92]">Admin Dashboard</span>
              </span>
            </button>
          </div>

          <nav className="mt-8 grid gap-2 lg:flex-1 lg:content-start">
            {[
              { id: 'inicio' as const, label: 'Início', href: '/dashboard/admin', icon: BarChart3 },
              { id: 'cursos' as const, label: 'Cursos', href: '/dashboard/admin/cursos', icon: BookOpen },
              { id: 'progress' as const, label: 'Progresso', href: '/dashboard/admin/progresso', icon: Award },
              { id: 'history' as const, label: 'Histórico', href: '/dashboard/admin/historico', icon: History },
              { id: 'settings' as const, label: 'Configurações', href: '/dashboard/admin/settings', icon: Settings },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigate(item.href)}
                  className={`flex items-center gap-3 rounded-md px-4 py-3 text-left text-sm font-semibold transition ${
                    route === item.id ? 'bg-primary text-white shadow-[0_12px_30px_rgba(223,117,13,0.18)]' : 'text-[#5F5F66] hover:bg-[#F4F4F5] hover:text-[#111114]'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>
          <button
            type="button"
            onClick={handleSignOut}
            className="mt-8 flex h-11 w-full items-center justify-center gap-2 rounded-md border border-[#E1E1E5] bg-white text-sm font-semibold text-[#666670] transition hover:border-primary hover:text-primary lg:mt-auto"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </aside>

        <section className="min-w-0 px-4 py-5 sm:px-8 lg:px-6 lg:py-6 min-[1366px]:px-10">
          <header className="mb-5 rounded-[28px] border border-white/70 bg-white/82 p-5 shadow-[0_18px_42px_rgba(17,17,20,0.06)] backdrop-blur-2xl md:flex md:flex-col md:gap-4 lg:mb-7 min-[1366px]:flex-row min-[1366px]:items-end min-[1366px]:justify-between min-[1366px]:rounded-none min-[1366px]:border-b min-[1366px]:border-l-0 min-[1366px]:border-r-0 min-[1366px]:border-t-0 min-[1366px]:bg-transparent min-[1366px]:p-0 min-[1366px]:pb-6 min-[1366px]:shadow-none min-[1366px]:backdrop-blur-0">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Admin</p>
              <h1 className="mt-2 text-[2rem] font-semibold leading-[0.98] tracking-[-0.055em] sm:text-4xl">
                {routeTitle}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#666670]">
                {profile?.full_name || profile?.username}, a plataforma nova segue isolada da home institucional.
              </p>
            </div>
            <Button type="button" variant="secondary" onClick={() => navigate('/home')} className="mt-4 w-full rounded-[18px] border-[#D8D8DE] bg-[#E8E8ED] text-[#111114] hover:bg-[#DDDEE5] md:mt-0 md:w-auto lg:rounded-md">
              Voltar para home
            </Button>
          </header>

          {isLoading ? (
            <div className="flex min-h-[360px] items-center justify-center rounded-[28px] bg-white/82 text-[#8A8A92] shadow-[0_18px_42px_rgba(17,17,20,0.05)] lg:bg-transparent lg:shadow-none">Carregando dashboard...</div>
          ) : route === 'inicio' ? (
            <div className="space-y-6 lg:space-y-7">
              <section className="hidden grid-cols-2 gap-3 lg:grid lg:grid-cols-2 min-[1366px]:grid-cols-4">
                {[
                  { label: 'Colaboradores', value: collaborators.length, icon: Users },
                  { label: 'Cursos', value: courses.length, icon: BookOpen },
                  { label: 'Aulas', value: totalLessons, icon: FileText },
                  { label: 'Média geral', value: `${averageProgress}%`, icon: BarChart3 },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <article key={item.label} className="rounded-[24px] border border-white/70 bg-white/86 p-4 shadow-[0_18px_42px_rgba(17,17,20,0.06)] backdrop-blur-2xl lg:rounded-lg lg:border-[#E6E6EA] lg:bg-white lg:p-5">
                      <Icon className="h-5 w-5 text-primary" />
                      <p className="mt-4 text-2xl font-semibold tracking-[-0.04em]">{item.value}</p>
                      <p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-[#8A8A92] sm:text-xs">{item.label}</p>
                    </article>
                  );
                })}
              </section>
              <CollaboratorGroup
                title="Colaboradores Seven Group"
                company="Seven"
                users={collaborators.filter((user) => user.company === 'Seven')}
                courses={courses}
                progress={progress}
                quizzes={quizzes}
                attempts={quizAttempts}
                profileImages={profileImages}
              />
              <CollaboratorGroup
                title="Colaboradores ARQO"
                company="ARQO"
                users={collaborators.filter((user) => user.company === 'ARQO')}
                courses={courses}
                progress={progress}
                quizzes={quizzes}
                attempts={quizAttempts}
                profileImages={profileImages}
              />
            </div>
          ) : route === 'cursos' ? (
            <div className="grid gap-5 min-[1366px]:grid-cols-[minmax(280px,320px)_minmax(0,1fr)] min-[1366px]:gap-7">
              <aside className="space-y-3 lg:space-y-4">
                <Button type="button" onClick={openCourseCreator} className="w-full rounded-[18px] py-3 lg:rounded-md">
                  <Plus className="mr-2 h-4 w-4" /> Criar curso
                </Button>
                {courses.map((course) => {
                  const readiness = calculateReadiness(course);
                  return (
                    <button
                      type="button"
                      key={course.id}
                      onClick={() => setSelectedCourseId(course.id)}
                      className={`w-full rounded-[22px] border p-4 text-left transition lg:rounded-lg ${selectedCourse?.id === course.id ? 'border-primary bg-white shadow-[0_16px_34px_rgba(223,117,13,0.14)] ring-2 ring-primary/10' : 'border-white/70 bg-white/78 shadow-[0_12px_28px_rgba(17,17,20,0.04)] hover:border-primary/40'}`}
                    >
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{course.company}</p>
                      <h2 className="mt-2 font-semibold">{course.title}</h2>
                      <p className="mt-2 text-xs text-[#8A8A92]">Prontidão {readiness.score}%</p>
                    </button>
                  );
                })}
              </aside>

              <Panel className="p-5">
                {selectedCourse ? (
                  <>
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{selectedCourse.company}</p>
                        <h2 className="mt-2 text-2xl font-semibold leading-tight tracking-[-0.035em]">{selectedCourse.title}</h2>
                        <p className="mt-2 text-sm leading-6 text-[#666670]">{selectedCourse.description || 'Sem descrição.'}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <IconButton label="Editar curso" onClick={() => openCourseEditor(selectedCourse)}>
                          <Edit3 className="h-4 w-4" />
                        </IconButton>
                        <IconButton label="Excluir curso" onClick={() => void handleDeleteCourse(selectedCourse)}>
                          <Trash2 className="h-4 w-4" />
                        </IconButton>
                        <IconButton label="Inserir módulo" onClick={openModuleCreator}>
                          <Plus className="h-4 w-4" />
                        </IconButton>
                      </div>
                    </div>

                    <div className="mt-6 space-y-4">
                      {selectedCourse.modules.map((moduleItem) => (
                        <article key={moduleItem.id} className="rounded-[22px] border border-[#ECECEF] bg-[#FAFAFB] p-4 lg:rounded-lg">
                          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div>
                              <h3 className="font-semibold">{moduleItem.order_index}. {moduleItem.title}</h3>
                              <p className="mt-1 text-sm text-[#666670]">{moduleItem.description || 'Sem descrição.'}</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <IconButton label="Editar módulo" onClick={() => openModuleEditor(moduleItem)}>
                                <Edit3 className="h-4 w-4" />
                              </IconButton>
                              {moduleItem.has_quiz && (
                                <IconButton label="Editar prova" onClick={() => openQuizEditor(moduleItem)}>
                                  <ClipboardList className="h-4 w-4" />
                                </IconButton>
                              )}
                              <IconButton label="Excluir módulo" onClick={() => void handleDeleteModule(moduleItem)}>
                                <Trash2 className="h-4 w-4" />
                              </IconButton>
                              <IconButton label="Criar aula" onClick={() => openLessonCreator(moduleItem)}>
                                <Plus className="h-4 w-4" />
                              </IconButton>
                            </div>
                          </div>

                          <div className="mt-4 grid gap-2">
                            {moduleItem.lessons.map((lesson) => (
                              <div key={lesson.id} className="flex flex-col gap-3 rounded-[16px] border border-[#ECECEF] bg-white px-3 py-3 text-sm sm:flex-row sm:items-center sm:justify-between lg:rounded-md">
                                <span>{lesson.order_index}. {lesson.title}</span>
                                <IconButton label="Editar aula" onClick={() => openLessonEditor(lesson)}>
                                  <Edit3 className="h-4 w-4" />
                                </IconButton>
                              </div>
                            ))}
                          </div>
                        </article>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-[#666670]">Crie um curso para iniciar o ambiente de configuração.</p>
                )}
              </Panel>
            </div>
          ) : route === 'progress' ? (
            <ProgressDashboard
              users={collaborators}
              courses={courses}
              progress={progress}
              quizzes={quizzes}
              attempts={quizAttempts}
              failures={courseFailures}
              certificates={certificates}
              regeneratingCertificateKey={regeneratingCertificateKey}
              deletingCertificateKey={deletingCertificateKey}
              onRegenerateCertificate={handleRegenerateCertificate}
              onDeleteCertificate={handleDeleteCertificate}
            />
          ) : route === 'history' ? (
            <AdminAuditHistory logs={auditLogs} revertingLogId={revertingLogId} onRevert={handleRevertAuditLog} />
          ) : (
            <div className="space-y-6 lg:space-y-7">
              {missingProfiles.length > 0 && (
                <section className="rounded-[24px] border border-amber-200 bg-amber-50 p-5 lg:rounded-lg">
                  <h2 className="font-semibold text-amber-900">Usuários em Authentication sem profile</h2>
                  <p className="mt-2 text-sm leading-6 text-amber-800">
                    Eles existem no Supabase Auth, mas não aparecem nas listas porque a dashboard lê `public.profiles`.
                  </p>
                  <div className="mt-4 grid gap-3">
                    {missingProfiles.map((authUser) => (
                      <article key={authUser.id} className="flex flex-col gap-3 rounded-md border border-amber-200 bg-white p-4 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="font-semibold">{authUser.full_name || authUser.email || authUser.id}</p>
                          <p className="text-xs text-amber-800">{authUser.email || authUser.id}</p>
                        </div>
                        <Button type="button" variant="secondary" onClick={() => void handleSyncProfile(authUser.id)} className="rounded-md">
                          Sincronizar profile
                        </Button>
                      </article>
                    ))}
                  </div>
                </section>
              )}

              <div className="flex justify-end">
                <Button type="button" onClick={openUserCreator} className="w-full rounded-[18px] py-3 sm:w-auto lg:rounded-md">
                  <Plus className="mr-2 h-4 w-4" /> Criar usuário
                </Button>
              </div>

              <UserCanvas title="Admins" icon={<ShieldCheck className="h-5 w-5 text-primary" />} users={admins} onEdit={openUserEditor} onDelete={handleDeleteUser} currentUserId={profile?.id} admin />
              <UserCanvas title="Colaboradores" icon={<Users className="h-5 w-5 text-primary" />} users={collaborators} onEdit={openUserEditor} onDelete={handleDeleteUser} currentUserId={profile?.id} />
            </div>
          )}
        </section>
      </div>

      {(modal === 'course' || modal === 'editCourse') && (
        <Modal title={modal === 'course' ? 'Criar curso' : 'Editar curso'} onClose={closeModal}>
          <form onSubmit={modal === 'course' ? submitCourse : submitCourseEdit} className="grid gap-5">
            <FormSection title="Identificação" description="Nome, empresa e resumo que aparecem na lista de cursos.">
              <div className="grid gap-4 sm:grid-cols-[160px_minmax(0,1fr)]">
                <Field label="Empresa"><SelectField value={courseForm.company} options={companyOptions} onChange={(company) => setCourseForm((current) => ({ ...current, company }))} /></Field>
                <Field label="Título"><Input className={inputClass} value={courseForm.title} onChange={(event) => setCourseForm((current) => ({ ...current, title: event.target.value }))} required /></Field>
              </div>
              <Field label="Descrição"><textarea value={courseForm.description} onChange={(event) => setCourseForm((current) => ({ ...current, description: event.target.value }))} className={`${textInputClass} min-h-24`} /></Field>
            </FormSection>

            <FormSection title="Capa do curso" description="Veja a capa atual ou exclua para inserir uma nova imagem.">
              {hasCurrentCourseCover && courseCoverPreview ? (
                <CurrentMediaActions
                  title="Capa atual"
                  fileName={fileLabel(null, courseForm.cover_url)}
                  onView={() => openPreview({
                    title: 'Capa atual',
                    url: courseCoverPreview,
                    fileName: fileLabel(null, courseForm.cover_url),
                    type: 'image',
                  })}
                  onRemove={() => {
                    setRemoveCourseCover(true);
                    setCourseCoverFile(null);
                  }}
                />
              ) : (
                <>
                  {courseCoverFile && courseCoverPreview ? (
                    <CurrentMediaActions
                      title="Capa selecionada"
                      fileName={courseCoverFile.name}
                      onView={() => openPreview({
                        title: 'Capa selecionada',
                        url: courseCoverPreview,
                        fileName: courseCoverFile.name,
                        type: 'image',
                      })}
                      onRemove={() => setCourseCoverFile(null)}
                    />
                  ) : (
                    <>
                      <MediaPreview
                        title="Capa selecionada"
                        url={courseCoverPreview}
                        type="image"
                      />
                      <FilePicker
                        label="Anexar capa do curso"
                        accept="image/*"
                        helper={modal === 'editCourse' && courseForm.cover_url ? 'A capa atual foi removida. Selecione uma nova imagem ou salve sem capa.' : 'Imagem obrigatória até 600x400 px. O arquivo será renomeado ao salvar.'}
                        onChange={setCourseCoverFile}
                      />
                    </>
                  )}
                </>
              )}
            </FormSection>

            <UploadProgress value={uploadProgress} />
            <FormActions>
              <Button type="submit" className="w-full rounded-[18px] py-3 lg:rounded-md">{modal === 'course' ? 'Salvar curso' : 'Atualizar curso'}</Button>
            </FormActions>
          </form>
        </Modal>
      )}

      {(modal === 'module' || modal === 'editModule') && (
        <Modal title={modal === 'module' ? `Inserir módulo em ${selectedCourse?.title ?? 'curso'}` : 'Editar módulo'} onClose={closeModal}>
          <form onSubmit={modal === 'module' ? submitModule : submitModuleEdit} className="grid gap-5">
            <FormSection title="Dados do módulo" description="Organize o bloco de aulas dentro do curso selecionado.">
              <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_120px]">
                <Field label="Título"><Input className={inputClass} value={moduleForm.title} onChange={(event) => setModuleForm((current) => ({ ...current, title: event.target.value }))} required /></Field>
                <Field label="Ordem"><Input className={inputClass} type="number" min={1} value={moduleForm.order_index} onChange={(event) => setModuleForm((current) => ({ ...current, order_index: Number(event.target.value) }))} required /></Field>
              </div>
              <Field label="Descrição"><textarea value={moduleForm.description} onChange={(event) => setModuleForm((current) => ({ ...current, description: event.target.value }))} className={`${textInputClass} min-h-20`} /></Field>
              <ToggleSwitch
                label="Exigir prova ao finalizar módulo"
                checked={moduleForm.has_quiz}
                onChange={(has_quiz) => setModuleForm((current) => ({ ...current, has_quiz }))}
              />
              {moduleForm.has_quiz && editingModule && (
                <Button type="button" variant="secondary" onClick={() => openQuizEditor(editingModule)} className="rounded-[18px] lg:rounded-md">
                  <ClipboardList className="mr-2 h-4 w-4" /> Editar prova do módulo
                </Button>
              )}
            </FormSection>
            <FormActions>
              <Button type="submit" className="w-full rounded-[18px] py-3 lg:rounded-md">{modal === 'module' ? 'Salvar módulo' : 'Atualizar módulo'}</Button>
            </FormActions>
          </form>
        </Modal>
      )}

      {modal === 'quiz' && quizModule && (
        <Modal title={`Prova - ${quizModule.title}`} onClose={closeModal}>
          <form onSubmit={submitQuiz} className="grid gap-5">
            <FormSection title="Configuração da prova" description="Nota mínima fixa de 70%. Cada questão adiciona 2 minutos à carga horária do certificado.">
              <Field label="Título da prova">
                <Input className={inputClass} value={quizTitle} onChange={(event) => setQuizTitle(event.target.value)} required />
              </Field>
            </FormSection>

            <FormSection title="Perguntas" description="Cada pergunta precisa ter pelo menos 3 opções e uma resposta correta.">
              {quizQuestions.map((question, questionIndex) => (
                <article key={question.id} className="rounded-[18px] border border-[#E1E1E5] bg-white p-4">
                  <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <h3 className="font-semibold">Pergunta {questionIndex + 1}</h3>
                    <div className="flex gap-2">
                      <SelectField
                        value={question.type}
                        options={['single', 'multiple'] as QuizQuestionType[]}
                        onChange={(type) => setQuizQuestions((current) => current.map((item) => item.id === question.id ? {
                          ...item,
                          type,
                          options: type === 'single'
                            ? item.options.map((option, index) => ({ ...option, isCorrect: index === item.options.findIndex((candidate) => candidate.isCorrect) }))
                            : item.options,
                        } : item))}
                      />
                      <IconButton label="Excluir pergunta" onClick={() => setQuizQuestions((current) => current.filter((item) => item.id !== question.id))}>
                        <Trash2 className="h-4 w-4" />
                      </IconButton>
                    </div>
                  </div>
                  <Field label="Enunciado">
                    <textarea
                      value={question.question}
                      onChange={(event) => setQuizQuestions((current) => current.map((item) => item.id === question.id ? { ...item, question: event.target.value } : item))}
                      className={`${textInputClass} min-h-20`}
                      required
                    />
                  </Field>
                  <div className="mt-4 grid gap-3">
                    {question.options.map((option, optionIndex) => (
                      <div key={option.id} className="grid gap-2 rounded-[14px] border border-[#ECECEF] bg-[#FAFAFB] p-3">
                        <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#8A8A92]">
                          <input
                            type={question.type === 'single' ? 'radio' : 'checkbox'}
                            name={`question-${question.id}`}
                            checked={option.isCorrect}
                            onChange={(event) => setQuizQuestions((current) => current.map((item) => item.id === question.id ? {
                              ...item,
                              options: item.options.map((nextOption) => ({
                                ...nextOption,
                                isCorrect: question.type === 'single'
                                  ? nextOption.id === option.id
                                  : nextOption.id === option.id
                                    ? event.target.checked
                                    : nextOption.isCorrect,
                              })),
                            } : item))}
                          />
                          Resposta correta
                        </label>
                        <textarea
                          value={option.text}
                          onChange={(event) => setQuizQuestions((current) => current.map((item) => item.id === question.id ? {
                            ...item,
                            options: item.options.map((nextOption) => nextOption.id === option.id ? { ...nextOption, text: event.target.value } : nextOption),
                          } : item))}
                          className={`${textInputClass} min-h-16`}
                          placeholder={`Opção ${optionIndex + 1}`}
                          required
                        />
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="secondary"
                      className="rounded-[16px] lg:rounded-md"
                      onClick={() => setQuizQuestions((current) => current.map((item) => item.id === question.id ? {
                        ...item,
                        options: [...item.options, { id: crypto.randomUUID(), text: '', isCorrect: false }],
                      } : item))}
                    >
                      <Plus className="mr-2 h-4 w-4" /> Adicionar opção
                    </Button>
                  </div>
                </article>
              ))}
              <Button
                type="button"
                variant="secondary"
                className="rounded-[18px] lg:rounded-md"
                onClick={() => setQuizQuestions((current) => [...current, emptyQuizQuestion(current.length + 1)])}
              >
                <Plus className="mr-2 h-4 w-4" /> Nova pergunta
              </Button>
            </FormSection>

            <FormActions>
              <Button type="submit" className="w-full rounded-[18px] py-3 lg:rounded-md">Salvar prova</Button>
            </FormActions>
          </form>
        </Modal>
      )}

      {(modal === 'lesson' || modal === 'editLesson') && (
        <Modal title={modal === 'lesson' ? `Criar aula em ${selectedModule?.title ?? 'módulo'}` : 'Editar aula'} onClose={closeModal}>
          <form onSubmit={modal === 'lesson' ? submitLesson : submitLessonEdit} className="grid gap-5">
            <FormSection title="Dados da aula" description="Defina o título, o resumo e o texto que o colaborador vai ler.">
              <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_120px]">
                <Field label="Título"><Input className={inputClass} value={lessonForm.title} onChange={(event) => setLessonForm((current) => ({ ...current, title: event.target.value }))} required /></Field>
                <Field label="Ordem"><Input className={inputClass} type="number" min={1} value={lessonForm.order_index} onChange={(event) => setLessonForm((current) => ({ ...current, order_index: Number(event.target.value) }))} required /></Field>
              </div>
              <Field label="Descrição curta"><Input className={inputClass} value={lessonForm.description} onChange={(event) => setLessonForm((current) => ({ ...current, description: event.target.value }))} /></Field>
              <Field label="Texto da aula"><textarea value={lessonForm.content} onChange={(event) => setLessonForm((current) => ({ ...current, content: event.target.value }))} className={`${textInputClass} min-h-40`} /></Field>
            </FormSection>

            <div className="grid gap-5">
              <FormSection title="Vídeo da aula" description="Confira o vídeo atual ou escolha um novo arquivo para substituir.">
                {hasCurrentLessonVideo && lessonVideoPreview ? (
                  <CurrentMediaActions
                    title="Vídeo atual"
                    fileName={fileLabel(null, editingLesson?.video_url)}
                    onView={() => openPreview({
                      title: 'Vídeo atual',
                      url: lessonVideoPreview,
                      fileName: fileLabel(null, editingLesson?.video_url),
                      type: 'video',
                    })}
                    onRemove={() => {
                      setRemoveLessonVideo(true);
                      setLessonVideo(null);
                    }}
                  />
                ) : (
                  <>
                    <MediaPreview
                      title={lessonVideo ? 'Novo vídeo selecionado' : 'Vídeo selecionado'}
                      url={lessonVideoPreview}
                      fileName={fileLabel(lessonVideo, editingLesson?.video_url)}
                      type="video"
                    />
                    <FilePicker
                      label={lessonVideo ? lessonVideo.name : 'Anexar vídeo aula'}
                      accept="video/*"
                      helper={modal === 'editLesson' && editingLesson?.video_url ? 'A mídia atual foi removida. Selecione um novo vídeo ou salve sem vídeo.' : 'Selecione o arquivo de vídeo da aula.'}
                      onChange={setLessonVideo}
                    />
                  </>
                )}
              </FormSection>

              <FormSection title="Material de apoio" description="Opcional: PDF, imagem, planilha ou arquivo complementar.">
                {hasCurrentLessonAttachment && lessonAttachmentPreview ? (
                  <CurrentMediaActions
                    title="Anexo atual"
                    fileName={fileLabel(null, editingLesson?.attachment_url)}
                    onView={() => openPreview({
                      title: 'Anexo atual',
                      url: lessonAttachmentPreview,
                      fileName: fileLabel(null, editingLesson?.attachment_url),
                      type: previewTypeFor(null, editingLesson?.attachment_url || lessonAttachmentPreview),
                    })}
                    onRemove={() => {
                      setRemoveLessonAttachment(true);
                      setLessonAttachment(null);
                    }}
                  />
                ) : (
                  <>
                    <MediaPreview
                      title={lessonAttachment ? 'Novo anexo selecionado' : 'Anexo selecionado'}
                      url={lessonAttachmentPreview}
                      fileName={fileLabel(lessonAttachment, editingLesson?.attachment_url)}
                      type={previewTypeFor(lessonAttachment, lessonAttachmentPreview)}
                    />
                    <FilePicker
                      label={lessonAttachment ? lessonAttachment.name : 'Anexar material de apoio'}
                      helper={modal === 'editLesson' && editingLesson?.attachment_url ? 'O material atual foi removido. Selecione um novo arquivo ou salve sem anexo.' : 'PDF, imagem, planilha ou material complementar.'}
                      onChange={setLessonAttachment}
                    />
                  </>
                )}
              </FormSection>
            </div>

            <UploadProgress value={uploadProgress} />
            <FormActions>
              <Button type="submit" className="w-full rounded-[18px] py-3 lg:rounded-md">{modal === 'lesson' ? 'Salvar aula' : 'Atualizar aula'}</Button>
            </FormActions>
          </form>
        </Modal>
      )}

      {(modal === 'user' || modal === 'editUser') && (
        <Modal title={modal === 'user' ? 'Criar usuário' : 'Editar usuário'} onClose={closeModal}>
          <form onSubmit={modal === 'user' ? submitUser : submitUserEdit} className="grid gap-5">
            <FormSection title="Foto de perfil" description="Imagem exibida nos cards de acompanhamento e na área do usuário.">
              <div className="grid gap-4 md:grid-cols-[220px_minmax(0,1fr)] md:items-start">
                <ProfilePictureCanvas
                  imageUrl={profileImagePreview}
                  name={userForm.fullName || userForm.username}
                  fileName={profileImageFile?.name || (hasCurrentProfileImage ? fileLabel(null, userForm.avatarUrl) : undefined)}
                  onView={hasCurrentProfileImage && profileImagePreview ? () => openPreview({
                    title: 'Foto atual',
                    url: profileImagePreview,
                    fileName: fileLabel(null, userForm.avatarUrl),
                    type: 'image',
                  }) : undefined}
                  onRemove={hasCurrentProfileImage ? () => {
                    setRemoveProfileImage(true);
                    setProfileImageFile(null);
                  } : undefined}
                />
                {hasCurrentProfileImage ? (
                  <div className="rounded-[20px] border border-[#E6E6EA] bg-white p-4 text-sm leading-6 text-[#666670] lg:rounded-lg">
                    Use o olho para visualizar a foto atual. Para inserir uma nova imagem, exclua a foto atual primeiro.
                  </div>
                ) : (
                  <FilePicker
                    label={profileImageFile ? profileImageFile.name : 'Inserir imagem do usuário'}
                    accept="image/*"
                    helper={modal === 'editUser' && userForm.avatarUrl ? 'A foto atual foi removida. Selecione uma nova imagem ou salve sem foto.' : 'Use uma foto quadrada ou retrato para melhor enquadramento.'}
                    onChange={setProfileImageFile}
                  />
                )}
              </div>
            </FormSection>

            <FormSection title="Dados do usuário" description="Informações básicas usadas para identificar a pessoa na plataforma.">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nome"><Input className={inputClass} value={userForm.fullName} onChange={(event) => setUserForm((current) => ({ ...current, fullName: event.target.value }))} required /></Field>
                <Field label="Usuário"><Input className={inputClass} value={userForm.username} onChange={(event) => setUserForm((current) => ({ ...current, username: event.target.value }))} required /></Field>
              </div>
              <Field label="Email"><Input className={inputClass} type="email" value={userForm.email} onChange={(event) => setUserForm((current) => ({ ...current, email: event.target.value }))} required /></Field>
            </FormSection>

            <FormSection title="Acesso e permissões" description="Defina senha, perfil de acesso, empresa e status.">
              <Field label={modal === 'user' ? 'Senha' : 'Nova senha (opcional)'}>
                <Input className={inputClass} type="password" minLength={6} value={userForm.password} onChange={(event) => setUserForm((current) => ({ ...current, password: event.target.value }))} required={modal === 'user'} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Perfil"><SelectField value={userForm.role} options={roleOptions} onChange={(role) => setUserForm((current) => ({ ...current, role }))} /></Field>
                <Field label="Empresa"><SelectField value={userForm.company} options={companyOptions} disabled={userForm.role === 'admin'} onChange={(company) => setUserForm((current) => ({ ...current, company }))} /></Field>
                <Field label="Status"><SelectField value={userForm.status} options={statusOptions} onChange={(status) => setUserForm((current) => ({ ...current, status }))} /></Field>
              </div>
            </FormSection>

            <UploadProgress value={uploadProgress} />
            <FormActions>
              <Button type="submit" className="w-full rounded-[18px] py-3 lg:rounded-md">{modal === 'user' ? 'Criar usuário' : 'Salvar alterações'}</Button>
            </FormActions>
          </form>
        </Modal>
      )}
      {pendingDeleteUser && (
        <Modal title="Confirmar exclusão" onClose={closeDeleteUserModal}>
          <div className="grid gap-5">
            <div className="rounded-[22px] border border-red-100 bg-red-50/80 p-5 lg:rounded-lg">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] bg-red-100 text-red-600 lg:rounded-md">
                  <Trash2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-red-600">Ação definitiva</p>
                  <h3 className="mt-2 text-2xl font-semibold tracking-[-0.035em] text-[#111114]">
                    Excluir usuário do banco de dados?
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-[#666670]">
                    Esta operação remove o cadastro de acesso e não pode ser desfeita pela dashboard.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[22px] border border-[#ECECEF] bg-[#FAFAFB] p-4 lg:rounded-lg">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8A8A92]">Usuário selecionado</p>
              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-[#111114]">{pendingDeleteUser.full_name || pendingDeleteUser.username}</p>
                  <p className="text-sm text-[#73737C]">{pendingDeleteUser.email || pendingDeleteUser.username}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full border border-[#E6E6EA] bg-white px-3 py-1 text-xs font-semibold text-[#666670]">{pendingDeleteUser.role}</span>
                  <span className="rounded-full border border-[#E6E6EA] bg-white px-3 py-1 text-xs font-semibold text-[#666670]">{pendingDeleteUser.company}</span>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={closeDeleteUserModal}
                disabled={Boolean(deletingUserId)}
                className="inline-flex min-h-[52px] items-center justify-center rounded-[18px] border border-[#E6E6EA] bg-white px-5 text-sm font-semibold text-[#424248] transition hover:bg-[#F7F7F8] disabled:cursor-not-allowed disabled:opacity-50 lg:rounded-md"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void confirmDeleteUser()}
                disabled={Boolean(deletingUserId)}
                className="inline-flex min-h-[52px] items-center justify-center rounded-[18px] bg-red-600 px-5 text-sm font-semibold text-white shadow-[0_18px_44px_rgba(220,38,38,0.22)] transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60 lg:rounded-md"
              >
                {deletingUserId ? 'Excluindo...' : 'Excluir usuário'}
              </button>
            </div>
          </div>
        </Modal>
      )}
      {previewMedia && (
        <MediaViewerModal media={previewMedia} onClose={() => setPreviewMedia(null)} />
      )}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/70 bg-[#F9F9FB]/88 px-4 pb-[calc(env(safe-area-inset-bottom)+0.65rem)] pt-2 shadow-[0_-18px_44px_rgba(17,17,20,0.12)] backdrop-blur-2xl lg:hidden" aria-label="Navegação admin">
        <div className="mx-auto flex max-w-md gap-2 rounded-[24px] border border-black/[0.04] bg-white/78 p-2">
          <AppTabButton active={route === 'inicio'} label="Início" icon={<BarChart3 className="h-4 w-4" />} onClick={() => navigate('/dashboard/admin')} />
          <AppTabButton active={route === 'cursos'} label="Cursos" icon={<BookOpen className="h-4 w-4" />} onClick={() => navigate('/dashboard/admin/cursos')} />
          <AppTabButton active={route === 'progress'} label="Progresso" icon={<Award className="h-4 w-4" />} onClick={() => navigate('/dashboard/admin/progresso')} />
          <AppTabButton active={route === 'history'} label="Histórico" icon={<History className="h-4 w-4" />} onClick={() => navigate('/dashboard/admin/historico')} />
          <AppTabButton active={route === 'settings'} label="Usuários" icon={<Users className="h-4 w-4" />} onClick={() => navigate('/dashboard/admin/settings')} />
          <AppTabButton label="Home" icon={<Home className="h-4 w-4" />} onClick={() => navigate('/home')} />
        </div>
      </nav>
      <Toast message={error || feedback} type={error ? 'error' : 'success'} />
    </main>
  );
}

function auditCategoryLabel(category: AdminAuditCategory) {
  return auditFilterOptions.find((option) => option.id === category)?.label ?? 'Usuários';
}

function auditFilterMatches(log: AdminAuditLog, filter: AdminAuditCategory | 'todos') {
  if (filter === 'todos') return true;
  if (filter === 'usuarios') return log.category === 'usuarios' || log.category === 'admins' || log.category === 'colaboradores';
  return log.category === filter;
}

function formatAuditDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function metadataRecord(metadata: Record<string, unknown>, key: string) {
  const value = metadata[key];
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function metadataString(metadata: Record<string, unknown>, key: string, fallback = '') {
  return typeof metadata[key] === 'string' ? metadata[key] as string : fallback;
}

function metadataNullableString(metadata: Record<string, unknown>, key: string) {
  return typeof metadata[key] === 'string' ? metadata[key] as string : null;
}

function metadataNumber(metadata: Record<string, unknown>, key: string, fallback: number) {
  return typeof metadata[key] === 'number' && Number.isFinite(metadata[key]) ? metadata[key] as number : fallback;
}

function metadataNullableNumber(metadata: Record<string, unknown>, key: string) {
  return typeof metadata[key] === 'number' && Number.isFinite(metadata[key]) ? metadata[key] as number : null;
}

function canRevertAuditLog(log: AdminAuditLog) {
  if (log.reverted_at || !log.target_id) return false;
  if (log.action === 'create_course' || log.action === 'create_module' || log.action === 'create_lesson') return true;
  if (log.action === 'update_course') return Object.keys(metadataRecord(log.metadata, 'previous_course')).length > 0;
  if (log.action === 'update_module') return Object.keys(metadataRecord(log.metadata, 'previous_module')).length > 0;
  if (log.action === 'update_lesson') return Object.keys(metadataRecord(log.metadata, 'previous_lesson')).length > 0;
  return false;
}

function AdminAuditHistory({
  logs,
  revertingLogId,
  onRevert,
}: {
  logs: AdminAuditLog[];
  revertingLogId: string;
  onRevert: (log: AdminAuditLog) => Promise<void>;
}) {
  const [activeFilter, setActiveFilter] = useState<AdminAuditCategory | 'todos'>('todos');
  const filteredLogs = logs.filter((log) => auditFilterMatches(log, activeFilter));

  return (
    <div className="space-y-5">
      <Panel className="p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Histórico administrativo</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">Modificações recentes</h2>
          </div>
          <span className="w-fit rounded-full border border-[#E6E6EA] bg-[#FAFAFB] px-3 py-1 text-xs font-semibold text-[#666670]">
            {filteredLogs.length} registros
          </span>
        </div>
        <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
          {auditFilterOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setActiveFilter(option.id)}
              className={`shrink-0 rounded-full border px-3 py-2 text-xs font-semibold transition ${
                activeFilter === option.id
                  ? 'border-primary bg-primary text-white shadow-[0_12px_26px_rgba(223,117,13,0.18)]'
                  : 'border-[#E6E6EA] bg-white text-[#666670] hover:border-primary/50 hover:text-primary'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </Panel>

      <Panel className="overflow-hidden">
        {filteredLogs.length > 0 ? (
          <div className="divide-y divide-[#ECECEF]">
            {filteredLogs.map((log) => (
              <article key={log.id} className="grid gap-3 p-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                <div className="min-w-0">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">
                      {auditCategoryLabel(log.category)}
                    </span>
                    {log.company && <InfoBadge value={log.company} tone="company" />}
                    {log.reverted_at && (
                      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-700">
                        Revertido
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-semibold leading-6 text-[#111114]">{log.message}</p>
                  <p className="mt-1 text-xs text-[#8A8A92]">
                    Autor: {log.actor_name}{log.target_name ? ` · Alvo: ${log.target_name}` : ''}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 md:justify-end">
                  <time className="text-left text-xs font-semibold text-[#8A8A92] md:text-right" dateTime={log.created_at}>
                    {formatAuditDate(log.created_at)}
                  </time>
                  {canRevertAuditLog(log) && (
                    <button
                      type="button"
                      onClick={() => void onRevert(log)}
                      disabled={revertingLogId === log.id}
                      className="inline-flex h-9 items-center justify-center rounded-md border border-[#E6E6EA] bg-white px-3 text-xs font-semibold text-[#666670] transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {revertingLogId === log.id ? 'Revertendo...' : 'Reverter'}
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 p-6 text-center text-sm text-[#8A8A92]">
            <History className="h-5 w-5 text-primary" />
            Nenhuma modificação registrada ainda.
          </div>
        )}
      </Panel>
    </div>
  );
}

function ProgressDashboard({
  users,
  courses,
  progress,
  quizzes,
  attempts,
  failures,
  certificates,
  regeneratingCertificateKey,
  deletingCertificateKey,
  onRegenerateCertificate,
  onDeleteCertificate,
}: {
  users: UserProfile[];
  courses: CourseTree[];
  progress: LessonProgress[];
  quizzes: Quiz[];
  attempts: QuizAttempt[];
  failures: CourseFailure[];
  certificates: Certificate[];
  regeneratingCertificateKey: string;
  deletingCertificateKey: string;
  onRegenerateCertificate: (user: UserProfile, course: CourseTree, certificate?: Certificate | null) => Promise<void>;
  onDeleteCertificate: (user: UserProfile, course: CourseTree, certificate: Certificate) => Promise<void>;
}) {
  const [selectedUserId, setSelectedUserId] = useState(users[0]?.id ?? '');
  const selectedUser = users.find((user) => user.id === selectedUserId) ?? users[0];
  const userCourses = selectedUser ? courses.filter((course) => course.company === selectedUser.company) : [];
  const userAttempts = selectedUser ? attempts.filter((attempt) => attempt.user_id === selectedUser.id) : [];
  const userFailures = selectedUser ? failures.filter((failure) => failure.user_id === selectedUser.id) : [];
  const userCertificates = selectedUser ? certificates.filter((certificate) => certificate.user_id === selectedUser.id) : [];

  useEffect(() => {
    if (!selectedUserId && users[0]) setSelectedUserId(users[0].id);
  }, [selectedUserId, users]);

  return (
    <div className="grid gap-5 min-[1366px]:grid-cols-[minmax(260px,320px)_minmax(0,1fr)]">
      <Panel className="overflow-hidden">
        <header className="border-b border-[#ECECEF] p-5">
          <h2 className="font-semibold">Colaboradores</h2>
          <p className="mt-1 text-sm text-[#777780]">Selecione um perfil para acompanhar.</p>
        </header>
        <div className="grid max-h-[70svh] overflow-auto">
          {users.map((user) => (
            <button
              key={user.id}
              type="button"
              onClick={() => setSelectedUserId(user.id)}
              className={`border-b border-[#F0F0F2] px-5 py-4 text-left text-sm transition ${selectedUser?.id === user.id ? 'bg-primary/10 text-primary' : 'hover:bg-[#FAFAFB]'}`}
            >
              <span className="block font-semibold">{user.full_name || user.username}</span>
              <span className="mt-1 block text-xs text-[#8A8A92]">{user.company}</span>
            </button>
          ))}
        </div>
      </Panel>

      <div className="space-y-5">
        {selectedUser ? (
          <>
            <Panel className="p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Perfil individual</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">{selectedUser.full_name || selectedUser.username}</h2>
              <p className="mt-2 text-sm text-[#777780]">{selectedUser.email || selectedUser.username}</p>
            </Panel>

            {userCourses.map((course) => {
              const courseLessons = course.modules.flatMap((moduleItem) => moduleItem.lessons);
              const courseProgress = progress.filter((item) => item.user_id === selectedUser.id && courseLessons.some((lesson) => lesson.id === item.lesson_id));
              const completed = courseProgress.filter((item) => item.completed).length;
              const courseAttempts = userAttempts.filter((attempt) => attempt.course_id === course.id);
              const courseQuizzes = quizzes.filter((quiz) => quiz.is_active && course.modules.some((moduleItem) => moduleItem.id === quiz.module_id));
              const percent = getCourseProgress(course, courseProgress, courseQuizzes, courseAttempts);
              const completedModules = getCompletedModuleCount(course, courseProgress, courseQuizzes, courseAttempts);
              const average = courseAttempts.length ? Math.round(courseAttempts.reduce((sum, attempt) => sum + attempt.score, 0) / courseAttempts.length) : 0;
              const failure = userFailures.find((item) => item.course_id === course.id);
              const certificate = userCertificates.find((item) => item.course_id === course.id);
              const canGenerateCertificate = Boolean(certificate) || isCourseCompleted(course, courseProgress, courseQuizzes, courseAttempts);
              const certificateActionKey = `${selectedUser.id}:${course.id}`;
              const isRegeneratingCertificate = regeneratingCertificateKey === certificateActionKey;
              const isDeletingCertificate = deletingCertificateKey === certificateActionKey;

              return (
                <Panel key={course.id} className="p-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h3 className="text-xl font-semibold">{course.title}</h3>
                      <p className="mt-2 text-sm text-[#777780]">{completed} de {courseLessons.length} aulas concluídas</p>
                      <p className="mt-1 text-sm text-[#777780]">{completedModules} de {course.modules.length} módulos concluídos</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <InfoBadge value={`${percent}%`} tone="company" />
                      <InfoBadge value={`Média ${average}%`} tone="status" />
                      {failure && <span className="rounded-md bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">Reprovado x{failure.failure_count}</span>}
                      {certificate && <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">Certificado emitido</span>}
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={!canGenerateCertificate || isRegeneratingCertificate || isDeletingCertificate}
                      onClick={() => void onRegenerateCertificate(selectedUser, course, certificate)}
                      className="rounded-[16px] px-4 py-2 text-sm lg:rounded-md"
                    >
                      <Award className="mr-2 h-4 w-4" />
                      {isRegeneratingCertificate ? 'Regerando...' : certificate ? 'Regerar certificado' : 'Gerar certificado'}
                    </Button>
                    {certificate && (
                      <Button
                        type="button"
                        variant="secondary"
                        disabled={isRegeneratingCertificate || isDeletingCertificate}
                        onClick={() => void onDeleteCertificate(selectedUser, course, certificate)}
                        className="rounded-[16px] border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 hover:bg-red-100 lg:rounded-md"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {isDeletingCertificate ? 'Apagando...' : 'Apagar certificado'}
                      </Button>
                    )}
                    {!canGenerateCertificate && (
                      <span className="self-center text-xs font-semibold text-[#8A8A92]">Disponível quando o curso estiver 100% concluído.</span>
                    )}
                  </div>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#EFEFF2]">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
                  </div>
                  <div className="mt-5 grid gap-3">
                    {course.modules.map((moduleItem) => {
                      const moduleAttempt = courseAttempts.find((attempt) => attempt.module_id === moduleItem.id);
                      const moduleProgress = getModuleProgress(moduleItem, courseProgress, courseQuizzes, courseAttempts);
                      return (
                        <div key={moduleItem.id} className="rounded-[16px] border border-[#ECECEF] bg-[#FAFAFB] p-3 text-sm">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <span className="font-semibold">{moduleItem.title}</span>
                            <span className="font-semibold text-primary">{moduleProgress}%</span>
                            <span className={moduleAttempt?.passed ? 'text-emerald-700' : moduleAttempt ? 'text-red-700' : 'text-[#8A8A92]'}>
                              {moduleAttempt ? `Nota ${moduleAttempt.score}%` : courseQuizzes.some((quiz) => quiz.module_id === moduleItem.id) ? 'Prova pendente' : 'Sem prova'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Panel>
              );
            })}
          </>
        ) : (
          <Panel className="p-6 text-sm text-[#8A8A92]">Nenhum colaborador encontrado.</Panel>
        )}
      </div>
    </div>
  );
}

function UserCanvas({
  title,
  icon,
  users,
  onEdit,
  onDelete,
  currentUserId,
  admin = false,
}: {
  title: string;
  icon: ReactNode;
  users: UserProfile[];
  onEdit: (user: UserProfile) => void;
  onDelete: (user: UserProfile) => void;
  currentUserId?: string;
  admin?: boolean;
}) {
  return (
    <section className="overflow-hidden rounded-[26px] border border-white/70 bg-white/86 shadow-[0_18px_42px_rgba(17,17,20,0.06)] backdrop-blur-2xl lg:rounded-lg lg:border-[#E6E6EA] lg:bg-white">
      <header className="flex items-center gap-3 border-b border-[#ECECEF] px-5 py-4">
        {icon}
        <h2 className="font-semibold">{title}</h2>
      </header>
      <div className={`hidden gap-3 border-b border-[#ECECEF] px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#8A8A92] md:grid ${admin ? 'md:grid-cols-[1.2fr_0.7fr_0.7fr_0.7fr]' : 'md:grid-cols-[1.2fr_0.7fr_0.7fr_0.7fr_0.7fr]'}`}>
        <span>Usuário</span>
        <span>Role</span>
        {!admin && <span>Empresa</span>}
        <span>Status</span>
        <span>Ações</span>
      </div>
      {users.map((user) => (
        <article key={user.id} className={`grid gap-3 border-b border-[#F0F0F2] px-5 py-4 text-sm last:border-b-0 md:items-center ${admin ? 'md:grid-cols-[1.2fr_0.7fr_0.7fr_0.7fr]' : 'md:grid-cols-[1.2fr_0.7fr_0.7fr_0.7fr_0.7fr]'}`}>
          <div>
            <p className="font-semibold">{user.full_name || user.username}</p>
            <p className="text-xs text-[#8A8A92]">{user.email || user.username}</p>
          </div>
          <InfoBadge value={user.role} tone="role" />
          {!admin && <InfoBadge value={user.company} tone="company" />}
          <InfoBadge value={user.status} tone="status" />
          <div className="flex gap-2">
            <button type="button" onClick={() => onEdit(user)} aria-label={`Editar ${user.full_name || user.username}`} className="inline-flex h-10 flex-1 items-center justify-center rounded-[14px] border border-[#E6E6EA] bg-[#F7F7F8] text-[#666670] hover:border-primary hover:text-primary md:h-9 md:w-9 md:flex-none md:rounded-md md:bg-transparent">
              <Edit3 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(user)}
              disabled={user.id === currentUserId}
              aria-label={`Excluir ${user.full_name || user.username}`}
              title={user.id === currentUserId ? 'Você não pode excluir o próprio cadastro' : 'Excluir usuário'}
              className="inline-flex h-10 flex-1 items-center justify-center rounded-[14px] border border-red-200 bg-red-50 text-red-600 transition hover:border-red-300 hover:bg-red-100 disabled:cursor-not-allowed disabled:border-[#E6E6EA] disabled:bg-[#F1F1F3] disabled:text-[#B0B0B8] md:h-9 md:w-9 md:flex-none md:rounded-md"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </article>
      ))}
      {users.length === 0 && (
        <div className="flex items-center gap-2 px-5 py-6 text-sm text-[#8A8A92]">
          <FileText className="h-4 w-4" />
          Nenhum usuário encontrado.
        </div>
      )}
    </section>
  );
}

function CollaboratorGroup({
  title,
  company,
  users,
  courses,
  progress,
  quizzes,
  attempts,
  profileImages,
}: {
  title: string;
  company: Company;
  users: UserProfile[];
  courses: CourseTree[];
  progress: LessonProgress[];
  quizzes: Quiz[];
  attempts: QuizAttempt[];
  profileImages: Record<string, string>;
}) {
  const [sortMode, setSortMode] = useState<'alphabetical' | 'progress'>('alphabetical');
  const [page, setPage] = useState(1);
  const pageSize = 9;
  const sortedUsers = useMemo(() => {
    return [...users].sort((first, second) => {
      if (sortMode === 'progress') {
        return progressForUser(second, progress, courses, quizzes, attempts).percent - progressForUser(first, progress, courses, quizzes, attempts).percent;
      }

      return (first.full_name || first.username).localeCompare(second.full_name || second.username);
    });
  }, [attempts, courses, progress, quizzes, sortMode, users]);
  const totalPages = Math.max(1, Math.ceil(sortedUsers.length / pageSize));
  const pageUsers = sortedUsers.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    setPage(1);
  }, [sortMode, users.length]);

  return (
    <section>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{company}</p>
          <h2 className="mt-1 text-2xl font-semibold leading-tight tracking-[-0.045em]">{title}</h2>
        </div>
        <span className="w-fit rounded-[14px] border border-white/70 bg-white px-3 py-2 text-sm font-semibold text-[#666670] shadow-[0_10px_24px_rgba(17,17,20,0.04)] lg:rounded-md lg:border-[#E6E6EA]">
          {users.length} ativos
        </span>
      </div>
      <div className="mb-4 flex justify-end">
        <label className="flex items-center gap-2 text-sm font-semibold text-[#666670]">
          Ordenar
          <select
            value={sortMode}
            onChange={(event) => setSortMode(event.target.value as 'alphabetical' | 'progress')}
            className="h-10 rounded-md border border-[#D8D8DE] bg-white px-3 text-sm text-[#111114] outline-none focus:border-primary"
          >
            <option value="alphabetical">Ordem alfabética</option>
            <option value="progress">Progresso do curso</option>
          </select>
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2 min-[1366px]:grid-cols-3">
        {pageUsers.map((user) => {
          const userProgress = progressForUser(user, progress, courses, quizzes, attempts);
          const imageUrl = profileImages[user.id];
          return (
            <article key={user.id} className="min-h-[268px] rounded-[26px] border border-white/70 bg-white/86 p-5 shadow-[0_18px_42px_rgba(17,17,20,0.06)] backdrop-blur-2xl lg:rounded-lg lg:border-[#E6E6EA] lg:bg-white">
              <div className="flex h-full flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-[22px] bg-[#F0F0F2] text-xl font-semibold text-primary lg:rounded-lg">
                    {imageUrl ? (
                      <img src={imageUrl} alt={user.full_name || user.username} className="h-full w-full object-cover" />
                    ) : (
                      (user.full_name || user.username).slice(0, 1).toUpperCase()
                    )}
                  </div>
                  <InfoBadge value={user.status} tone="status" />
                </div>

                <div className="mt-5">
                  <h3 className="text-lg font-semibold">{user.full_name || user.username}</h3>
                  <p className="mt-1 text-sm text-[#8A8A92]">{user.email || user.username}</p>
                </div>

                <div className="mt-5 grid gap-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[#8A8A92]">Empresa</span>
                    <InfoBadge value={user.company} tone="company" />
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[#8A8A92]">Módulo atual</span>
                    <span className="max-w-[min(12rem,52vw)] truncate font-semibold">{userProgress.currentModule}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[#8A8A92]">Progresso</span>
                    <span className="font-semibold">{userProgress.percent}%</span>
                  </div>
                </div>

                <div className="mt-auto pt-5">
                  <div className="h-2 overflow-hidden rounded-full bg-[#EFEFF2]">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, userProgress.percent)}%` }} />
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {users.length === 0 && (
        <Panel className="p-6 text-sm text-[#8A8A92]">
          Nenhum colaborador designado para {company}.
        </Panel>
      )}

      {totalPages > 1 && (
        <footer className="mt-5 flex items-center justify-end gap-2">
          {Array.from({ length: totalPages }, (_, index) => index + 1).map((nextPage) => (
            <button
              key={nextPage}
              type="button"
              onClick={() => setPage(nextPage)}
              className={`h-10 min-w-10 rounded-[14px] border px-3 text-sm font-semibold lg:h-9 lg:min-w-9 lg:rounded-md ${page === nextPage ? 'border-primary bg-primary text-white' : 'border-white/70 bg-white text-[#666670] lg:border-[#D8D8DE]'}`}
            >
              {nextPage}
            </button>
          ))}
        </footer>
      )}
    </section>
  );
}
