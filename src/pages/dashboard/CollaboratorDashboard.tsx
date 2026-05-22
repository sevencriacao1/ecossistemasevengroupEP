import { ReactNode, useEffect, useMemo, useState } from 'react';
import { ArrowRight, Award, BookOpen, CheckCircle2, Download, Eye, Home, LogOut, PlayCircle, ShieldCheck, X } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { VideoPlayer } from '../../components/VideoPlayer';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { createCertificateValidationCode } from '../../lib/certificateValidation';
import { supabase } from '../../lib/supabase';
import {
  calculateCourseWorkloadMinutes,
  fetchCertificates,
  fetchCourseFailures,
  fetchLearningTree,
  fetchProgress,
  fetchQuizAttempts,
  fetchQuizzes,
  getCompletedModuleCount,
  getCourseProgress,
  getCertificateUrl,
  getLessonAttachmentUrl,
  getLessonVideoUrl,
  getModuleProgress,
  getStorageImageUrl,
  isCourseCompleted,
  submitQuizAttempt,
  uploadCertificatePng,
  upsertCertificate,
  upsertLessonProgress,
} from '../../services/learningService';
import { Certificate, CourseFailure, CourseTree, LessonProgress, Quiz, QuizAttempt } from '../../types/learning';

function getCourseLessons(course: CourseTree) {
  return course.modules.flatMap((moduleItem) => moduleItem.lessons);
}

function findFirstLesson(course?: CourseTree | null) {
  return course ? getCourseLessons(course)[0] ?? null : null;
}

function getLessonProgress(progress: LessonProgress[], lessonId: string) {
  return progress.find((item) => item.lesson_id === lessonId);
}

function optimisticCompletedProgress(progress: LessonProgress[], userId: string, lessonId: string): LessonProgress[] {
  const completedAt = new Date().toISOString();
  const nextItem: LessonProgress = {
    id: '',
    user_id: userId,
    lesson_id: lessonId,
    progress: 100,
    completed: true,
    completed_at: completedAt,
    created_at: completedAt,
    updated_at: completedAt,
  };

  return [
    ...progress.filter((item) => item.lesson_id !== lessonId),
    nextItem,
  ];
}

function getRouteId(pathname: string, segment: 'cursos' | 'aulas' | 'certificados') {
  const parts = pathname.split('/').filter(Boolean);
  const index = parts.indexOf(segment);
  return index >= 0 ? parts[index + 1] : '';
}

function getModuleForLesson(course: CourseTree | null, lessonId: string) {
  return course?.modules.find((moduleItem) => moduleItem.lessons.some((lesson) => lesson.id === lessonId)) ?? null;
}

function getCourseStartDate(course: CourseTree, progress: LessonProgress[]) {
  const lessonIds = new Set(getCourseLessons(course).map((lesson) => lesson.id));
  const dates = progress
    .filter((item) => lessonIds.has(item.lesson_id))
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

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

async function createCertificateBlob({
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
function AppTabButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  active?: boolean;
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

export function CollaboratorDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, signOut } = useAuth();
  const [courses, setCourses] = useState<CourseTree[]>([]);
  const [progress, setProgress] = useState<LessonProgress[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [quizAttempts, setQuizAttempts] = useState<QuizAttempt[]>([]);
  const [courseFailures, setCourseFailures] = useState<CourseFailure[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [certificateUrls, setCertificateUrls] = useState<Record<string, string>>({});
  const [previewCertificate, setPreviewCertificate] = useState<Certificate | null>(null);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string[]>>({});
  const [videoUrl, setVideoUrl] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [coverUrls, setCoverUrls] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const courseId = getRouteId(location.pathname, 'cursos');
  const lessonId = getRouteId(location.pathname, 'aulas');
  const certificateCourseId = getRouteId(location.pathname, 'certificados');
  const certificatesRoute = location.pathname.includes('/certificados');
  const activeCourse = courses.find((course) => course.id === courseId) ?? null;
  const certificateCourse = courses.find((course) => course.id === certificateCourseId) ?? null;
  const activeCertificate = certificates.find((certificate) => certificate.course_id === certificateCourseId) ?? null;
  const allLessons = useMemo(() => courses.flatMap(getCourseLessons), [courses]);
  const activeLesson = allLessons.find((lesson) => lesson.id === lessonId) ?? null;
  const courseForLesson = courses.find((course) => getCourseLessons(course).some((lesson) => lesson.id === activeLesson?.id)) ?? null;
  const completedCount = progress.filter((item) => item.completed).length;
  const globalProgress = courses.length
    ? Math.round(courses.reduce((sum, course) => sum + getCourseProgress(course, progress, quizzes, quizAttempts), 0) / courses.length)
    : 0;
  const lastProgress = [...progress].sort((a, b) => (b.updated_at || '').localeCompare(a.updated_at || ''))[0];
  const continueLesson = allLessons.find((lesson) => lesson.id === lastProgress?.lesson_id)
    ?? findFirstLesson(activeCourse)
    ?? allLessons[0]
    ?? null;
  const sidebarCourse = activeCourse ?? certificateCourse ?? courseForLesson;
  const sidebarCertificate = sidebarCourse ? certificates.find((certificate) => certificate.course_id === sidebarCourse.id) ?? null : null;
  const certificateCardPath = sidebarCourse && sidebarCertificate
    ? `/dashboard/colaborador/certificados/${sidebarCourse.id}`
    : '/dashboard/colaborador/certificados';

  const refresh = async () => {
    if (!profile) return;
    const nextCourses = await fetchLearningTree();
    const companyCourses = nextCourses.filter((course) => course.company === profile.company);
    const preferModernSchema = companyCourses.some((course) => !course.id.startsWith('legacy-'));
    const moduleIds = companyCourses.flatMap((course) => course.modules.map((moduleItem) => moduleItem.id));
    const [nextProgress, nextQuizzes, nextAttempts, nextFailures, nextCertificates] = await Promise.all([
      fetchProgress(profile.id, preferModernSchema),
      fetchQuizzes(moduleIds),
      fetchQuizAttempts(profile.id),
      fetchCourseFailures(profile.id),
      fetchCertificates(profile.id),
    ]);
    setCourses(companyCourses);
    setProgress(nextProgress);
    setQuizzes(nextQuizzes);
    setQuizAttempts(nextAttempts);
    setCourseFailures(nextFailures);
    setCertificates(nextCertificates);
  };

  useEffect(() => {
    refresh()
      .catch((nextError: unknown) => {
        setError(nextError instanceof Error ? nextError.message : 'Não foi possível carregar suas aulas.');
      })
      .finally(() => setIsLoading(false));
  }, [profile?.id]);

  useEffect(() => {
    const loadCovers = async () => {
      const entries = await Promise.all(
        courses.map(async (course) => [course.id, await getStorageImageUrl('course-covers', course.cover_url)] as const)
      );
      setCoverUrls(Object.fromEntries(entries));
    };

    void loadCovers();
  }, [courses]);

  useEffect(() => {
    const loadCertificates = async () => {
      const entries = await Promise.all(
        certificates.map(async (certificate) => [certificate.id, await getCertificateUrl(certificate.certificate_url)] as const)
      );
      setCertificateUrls(Object.fromEntries(entries));
    };

    void loadCertificates();
  }, [certificates]);

  useEffect(() => {
    if (!activeLesson?.video_url) {
      setVideoUrl('');
      return;
    }

    getLessonVideoUrl(activeLesson.video_url)
      .then(setVideoUrl)
      .catch(() => setVideoUrl(''));
  }, [activeLesson]);

  useEffect(() => {
    if (!activeLesson?.attachment_url) {
      setAttachmentUrl('');
      return;
    }

    getLessonAttachmentUrl(activeLesson.attachment_url)
      .then(setAttachmentUrl)
      .catch(() => setAttachmentUrl(''));
  }, [activeLesson]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  const openContinueLesson = (course?: CourseTree | null) => {
    const target = course
      ? getCourseLessons(course).find((lesson) => !getLessonProgress(progress, lesson.id)?.completed) ?? findFirstLesson(course)
      : continueLesson;

    if (target) navigate(`/dashboard/colaborador/aulas/${target.id}`);
  };

  const downloadCertificate = async (certificate: Certificate) => {
    const url = certificateUrls[certificate.id];
    if (!url) return;

    const response = await fetch(url);
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = `certificado-${certificate.course_id}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(objectUrl);
  };

  const ensureCertificate = async (course: CourseTree, nextProgress: LessonProgress[] = progress, nextAttempts: QuizAttempt[] = quizAttempts) => {
    if (!profile) return;
    if (certificates.some((certificate) => certificate.course_id === course.id)) return;

    const courseQuizzes = quizzes.filter((quiz) => quiz.is_active && course.modules.some((moduleItem) => moduleItem.id === quiz.module_id));
    if (!isCourseCompleted(course, nextProgress, courseQuizzes, nextAttempts)) return;

    const workloadMinutes = calculateCourseWorkloadMinutes(course, courseQuizzes);
    const startedAt = getCourseStartDate(course, nextProgress);
    const completedAt = new Date().toISOString();
    const validationCode = createCertificateValidationCode(profile.full_name || profile.username, course.title, completedAt);
    const blob = await createCertificateBlob({
      userName: profile.full_name || profile.username,
      course,
      workloadMinutes,
      startedAt,
      completedAt,
    });
    const certificatePath = await uploadCertificatePng(blob, {
      company: profile.company,
      courseTitle: course.title,
      userName: profile.full_name || profile.username,
      userId: profile.id,
    });
    const certificate = await upsertCertificate({
      userId: profile.id,
      courseId: course.id,
      certificateUrl: certificatePath,
      workloadMinutes,
      startedAt,
      completedAt,
      validationCode,
    });
    setCertificates((current) => [certificate, ...current.filter((item) => item.id !== certificate.id && item.course_id !== course.id)]);
    return certificate;
  };

  const completeLesson = async () => {
    if (!profile || !activeLesson) return;
    await upsertLessonProgress(profile.id, activeLesson.id, 100);
    const nextProgress = optimisticCompletedProgress(progress, profile.id, activeLesson.id);

    const currentCourse = courseForLesson;
    const currentModule = getModuleForLesson(currentCourse, activeLesson.id);
    const isLastLessonInModule = Boolean(currentModule && currentModule.lessons[currentModule.lessons.length - 1]?.id === activeLesson.id);
    const moduleQuiz = currentModule ? quizzes.find((quiz) => quiz.module_id === currentModule.id && quiz.is_active) : null;
    const quizPassed = moduleQuiz ? quizAttempts.some((attempt) => attempt.quiz_id === moduleQuiz.id && attempt.passed) : true;

    if (moduleQuiz && isLastLessonInModule && !quizPassed) {
      setActiveQuiz(moduleQuiz);
      setQuizAnswers({});
      await refresh();
      return;
    }

    await refresh();
    const lessons = currentCourse ? getCourseLessons(currentCourse) : allLessons;
    const currentIndex = lessons.findIndex((lesson) => lesson.id === activeLesson.id);
    const nextLesson = lessons[currentIndex + 1];

    if (currentCourse) {
      try {
        await ensureCertificate(currentCourse, nextProgress);
      } catch (certificateError) {
        setError(`A aula foi concluída, mas não foi possível emitir o certificado agora. ${getErrorMessage(certificateError, '')}`.trim());
      }
      await refresh();
    }

    if (nextLesson) {
      navigate(`/dashboard/colaborador/aulas/${nextLesson.id}`);
    } else if (currentCourse) {
      navigate(`/dashboard/colaborador/cursos/${currentCourse.id}`);
    } else {
      navigate('/dashboard/colaborador');
    }
  };

  const submitActiveQuiz = async () => {
    if (!profile || !activeQuiz || !courseForLesson) return;
    const missingAnswer = activeQuiz.questions.some((question) => (quizAnswers[question.id] ?? []).length === 0);
    if (missingAnswer) {
      setError('Responda todas as perguntas antes de enviar a prova.');
      return;
    }

    try {
      setError('');
      const result = await submitQuizAttempt({
        quiz: activeQuiz,
        course: courseForLesson,
        userId: profile.id,
        answers: quizAnswers,
      });
      setActiveQuiz(null);
      setQuizAnswers({});

      if (!result.passed) {
        await refresh();
        navigate(`/dashboard/colaborador/cursos/${courseForLesson.id}`);
        return;
      }

      const nextAttempts = await fetchQuizAttempts(profile.id);
      setQuizAttempts(nextAttempts);
      const nextProgress = activeLesson ? optimisticCompletedProgress(progress, profile.id, activeLesson.id) : progress;
      try {
        await ensureCertificate(courseForLesson, nextProgress, nextAttempts);
      } catch (certificateError) {
        setError(`Prova concluída, mas não foi possível emitir o certificado agora. ${getErrorMessage(certificateError, '')}`.trim());
      }
      await refresh();
      const lessons = getCourseLessons(courseForLesson);
      const currentIndex = activeLesson ? lessons.findIndex((lesson) => lesson.id === activeLesson.id) : -1;
      const nextLesson = lessons[currentIndex + 1];
      navigate(nextLesson ? `/dashboard/colaborador/aulas/${nextLesson.id}` : `/dashboard/colaborador/cursos/${courseForLesson.id}`);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Nao foi possivel enviar a prova.');
    }
  };

  return (
    <main className="safe-page-x relative min-h-screen bg-[#F2F2F7] pb-28 text-[#111114] lg:bg-[#F7F7F8] lg:pb-0">
      <header className="sticky top-0 z-40 border-b border-white/70 bg-[#F2F2F7]/86 px-5 pb-3 pt-[calc(env(safe-area-inset-top)+0.75rem)] backdrop-blur-2xl lg:border-[#E4E4E8] lg:bg-white lg:px-0 lg:py-0 lg:backdrop-blur-0">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 lg:px-5 lg:py-5 sm:lg:px-8">
          <button type="button" onClick={() => navigate('/home')} className="flex items-center gap-3 text-left">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] bg-white shadow-[0_10px_26px_rgba(17,17,20,0.08)] lg:h-auto lg:w-auto lg:rounded-none lg:bg-transparent lg:shadow-none">
              <img src="/assets/seven/Logo%20N.webp" alt="" className="h-8 w-8 object-contain lg:h-10 lg:w-10" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold">Ecossistema Seven</span>
              <span className="block truncate text-xs text-[#8A8A92]">Portal do colaborador</span>
            </span>
          </button>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => navigate('/home')} aria-label="Home" className="hidden h-10 w-10 items-center justify-center rounded-md border border-[#E1E1E5] text-[#666670] transition hover:border-primary hover:text-primary lg:flex">
              <Home className="h-4 w-4" />
            </button>
            <button type="button" onClick={handleSignOut} aria-label="Sair" className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-white text-[#666670] shadow-[0_10px_26px_rgba(17,17,20,0.08)] transition hover:border-primary hover:text-primary lg:h-10 lg:w-10 lg:rounded-md lg:border lg:border-[#E1E1E5] lg:bg-transparent lg:shadow-none">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-5 px-4 py-5 sm:px-8 lg:gap-6 lg:py-7 min-[1366px]:grid-cols-[minmax(280px,340px)_minmax(0,1fr)]">
        <aside className="grid grid-cols-2 gap-3 min-[1366px]:block min-[1366px]:space-y-4">
          <article className="col-span-2 rounded-[28px] border border-white/70 bg-[#111114] p-5 text-white shadow-[0_20px_48px_rgba(17,17,20,0.18)] min-[1366px]:hidden">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/54">Progresso geral</p>
            <div className="mt-4 flex items-end justify-between gap-4">
              <div>
                <p className="text-5xl font-semibold tracking-[-0.07em]">{globalProgress}%</p>
                <p className="mt-2 text-sm leading-6 text-white/62">
                  {completedCount} de {allLessons.length} aulas concluÃ­das
                </p>
              </div>
              <button
                type="button"
                onClick={() => openContinueLesson()}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] bg-white text-[#111114]"
                aria-label="Continuar aula"
              >
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/18">
              <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, globalProgress)}%` }} />
            </div>
          </article>
          {[
            { label: 'Empresa', value: profile?.company ?? 'Seven', icon: ShieldCheck },
            { label: 'Cursos disponíveis', value: courses.length, icon: BookOpen },
            { label: 'Aulas concluídas', value: completedCount, icon: CheckCircle2 },
            { label: 'Progresso geral', value: `${globalProgress}%`, icon: PlayCircle },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.label} className="rounded-[24px] border border-white/70 bg-white/86 p-4 shadow-[0_18px_42px_rgba(17,17,20,0.06)] backdrop-blur-2xl lg:rounded-lg lg:border-[#E6E6EA] lg:bg-white lg:p-5">
                <Icon className="h-5 w-5 text-primary" />
                <p className="mt-4 text-2xl font-semibold tracking-[-0.04em] lg:mt-5">{item.value}</p>
                <p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-[#8A8A92] sm:text-xs">{item.label}</p>
              </article>
            );
          })}
          {certificates.length > 0 && (
            <button
              type="button"
              onClick={() => navigate(certificateCardPath)}
              className="rounded-[24px] border border-white/70 bg-white/86 p-4 text-left shadow-[0_18px_42px_rgba(17,17,20,0.06)] backdrop-blur-2xl transition hover:border-primary/40 lg:rounded-lg lg:border-[#E6E6EA] lg:bg-white lg:p-5"
            >
              <Award className="h-5 w-5 text-primary" />
              <p className="mt-4 text-2xl font-semibold tracking-[-0.04em] lg:mt-5">{certificates.length}</p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-[#8A8A92] sm:text-xs">Certificados</p>
            </button>
          )}
          <button
            type="button"
            onClick={() => navigate('/dashboard/colaborador')}
            className="rounded-[24px] border border-white/70 bg-white/86 p-4 text-left shadow-[0_18px_42px_rgba(17,17,20,0.06)] backdrop-blur-2xl transition hover:border-primary/40 lg:rounded-lg lg:border-[#E6E6EA] lg:bg-white lg:p-5"
          >
            <BookOpen className="h-5 w-5 text-primary" />
            <p className="mt-4 text-2xl font-semibold tracking-[-0.04em] lg:mt-5">{courses.length}</p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-[#8A8A92] sm:text-xs">Ver cursos</p>
          </button>
        </aside>

        <div className="space-y-5 lg:space-y-6">
          {error && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

          {certificatesRoute && certificateCourse && activeCertificate && (
            <section className="rounded-[28px] border border-white/70 bg-white/86 p-5 shadow-[0_18px_42px_rgba(17,17,20,0.06)] backdrop-blur-2xl lg:rounded-lg lg:border-[#E6E6EA] lg:bg-white">
              <button type="button" onClick={() => navigate('/dashboard/colaborador/certificados')} className="mb-4 text-sm font-semibold text-primary">
                Voltar aos certificados
              </button>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Certificado emitido</p>
              <h1 className="mt-2 text-[2rem] font-semibold leading-[0.98] tracking-[-0.055em] sm:text-3xl">{certificateCourse.title}</h1>
              <div className="mt-6 overflow-hidden rounded-[24px] border border-[#ECECEF] bg-[#FAFAFB] lg:rounded-lg">
                {certificateUrls[activeCertificate.id] ? (
                  <img src={certificateUrls[activeCertificate.id]} alt={`Certificado ${certificateCourse.title}`} className="w-full object-contain" />
                ) : (
                  <div className="flex aspect-video items-center justify-center text-sm text-[#8A8A92]">Carregando certificado...</div>
                )}
              </div>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <Button type="button" onClick={() => setPreviewCertificate(activeCertificate)} className="rounded-[18px] py-3 lg:rounded-md">
                  <Eye className="mr-2 h-4 w-4" /> Visualizar
                </Button>
                {certificateUrls[activeCertificate.id] && (
                  <button type="button" onClick={() => void downloadCertificate(activeCertificate)} className="inline-flex items-center justify-center rounded-[18px] border border-[#D8D8DE] bg-[#F1F1F3] px-4 py-3 text-sm font-semibold text-[#111114] transition hover:border-primary lg:rounded-md">
                    <Download className="mr-2 h-4 w-4" /> Download
                  </button>
                )}
              </div>
            </section>
          )}

          {certificatesRoute && (!certificateCourseId || !activeCertificate) && (
            <section className="rounded-[28px] border border-white/70 bg-white/86 p-5 shadow-[0_18px_42px_rgba(17,17,20,0.06)] backdrop-blur-2xl lg:rounded-lg lg:border-[#E6E6EA] lg:bg-white">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Certificados</p>
              <h1 className="mt-2 text-[2rem] font-semibold leading-[0.98] tracking-[-0.055em] sm:text-3xl">Seu histórico</h1>
              <div className="mt-6 grid gap-4">
                {courses.map((course) => {
                  const certificate = certificates.find((item) => item.course_id === course.id);
                  const failure = courseFailures.find((item) => item.course_id === course.id);
                  const attempts = quizAttempts.filter((attempt) => attempt.course_id === course.id);
                  return (
                    <article key={course.id} className="rounded-[22px] border border-[#ECECEF] bg-[#FAFAFB] p-4 lg:rounded-lg">
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                          <h2 className="font-semibold">{course.title}</h2>
                          <p className="mt-1 text-sm text-[#777780]">
                            {attempts.length ? `Média de provas ${Math.round(attempts.reduce((sum, item) => sum + item.score, 0) / attempts.length)}%` : 'Sem provas concluídas'}
                          </p>
                          {failure && <p className="mt-1 text-sm font-semibold text-red-700">Reprovado x{failure.failure_count}</p>}
                        </div>
                        {certificate && certificateUrls[certificate.id] ? (
                          <button type="button" onClick={() => navigate(`/dashboard/colaborador/certificados/${course.id}`)} className="rounded-[16px] bg-primary px-4 py-2 text-sm font-semibold text-white lg:rounded-md">
                            Ver certificado
                          </button>
                        ) : (
                          <span className="rounded-[16px] border border-[#D8D8DE] px-4 py-2 text-sm font-semibold text-[#777780] lg:rounded-md">Ainda não emitido</span>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          )}

          {!certificatesRoute && !courseId && !lessonId && (
            <section className="rounded-[28px] border border-white/70 bg-white/86 p-5 shadow-[0_18px_42px_rgba(17,17,20,0.06)] backdrop-blur-2xl lg:rounded-lg lg:border-[#E6E6EA] lg:bg-white">
              <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{profile?.company}</p>
                  <h1 className="mt-2 text-[2rem] font-semibold leading-[0.98] tracking-[-0.055em] sm:text-3xl">Cursos disponíveis</h1>
                  <p className="mt-2 text-sm leading-6 text-[#666670]">Escolha um curso para ver as aulas disponíveis.</p>
                </div>
                <Button type="button" onClick={() => openContinueLesson()} className="rounded-[18px] py-3 lg:rounded-md">
                  Continuar de onde parou <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>

              <CourseCards
                isLoading={isLoading}
                courses={courses}
                progress={progress}
                quizzes={quizzes}
                attempts={quizAttempts}
                coverUrls={coverUrls}
                onOpenCourse={(course) => navigate(`/dashboard/colaborador/cursos/${course.id}`)}
              />
            </section>
          )}

          {activeCourse && !lessonId && (
            <section className="rounded-[28px] border border-white/70 bg-white/86 p-5 shadow-[0_18px_42px_rgba(17,17,20,0.06)] backdrop-blur-2xl lg:rounded-lg lg:border-[#E6E6EA] lg:bg-white">
              <button type="button" onClick={() => navigate('/dashboard/colaborador')} className="mb-4 text-sm font-semibold text-primary">
                Voltar aos cursos
              </button>
              <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{activeCourse.company}</p>
                  <h1 className="mt-2 text-[2rem] font-semibold leading-[0.98] tracking-[-0.055em] sm:text-3xl">{activeCourse.title}</h1>
                  <p className="mt-2 text-sm leading-6 text-[#666670]">{activeCourse.description || 'Curso de onboarding interno.'}</p>
                </div>
                <Button type="button" onClick={() => openContinueLesson(activeCourse)} className="rounded-[18px] py-3 lg:rounded-md">
                  Continuar aula <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
              <div className="mt-6 space-y-4">
                {activeCourse.modules.map((moduleItem) => {
                  const moduleProgress = getModuleProgress(moduleItem, progress, quizzes, quizAttempts);
                  const moduleQuiz = quizzes.find((quiz) => quiz.module_id === moduleItem.id && quiz.is_active);
                  const quizPassed = moduleQuiz ? quizAttempts.some((attempt) => attempt.quiz_id === moduleQuiz.id && attempt.passed) : false;

                  return (
                    <article key={moduleItem.id} className="rounded-[24px] border border-[#ECECEF] bg-[#FAFAFB] p-4 lg:rounded-lg">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <h2 className="font-semibold">{moduleItem.order_index}. {moduleItem.title}</h2>
                        <span className="text-sm font-semibold text-primary">{moduleProgress}% do módulo</span>
                      </div>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#EFEFF2]">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${moduleProgress}%` }} />
                      </div>
                      {moduleQuiz && (
                        <p className={`mt-3 text-sm font-semibold ${quizPassed ? 'text-emerald-700' : 'text-[#8A8A92]'}`}>
                          {quizPassed ? 'Prova concluída' : 'Prova pendente'}
                        </p>
                      )}
                      <div className="mt-3 grid gap-2">
                        {moduleItem.lessons.map((lesson) => {
                          const lessonProgress = getLessonProgress(progress, lesson.id);
                          return (
                            <button
                              type="button"
                              key={lesson.id}
                              onClick={() => navigate(`/dashboard/colaborador/aulas/${lesson.id}`)}
                              className="flex flex-col gap-3 rounded-[18px] border border-[#ECECEF] bg-white px-3 py-3 text-left text-sm transition hover:border-primary/40 sm:flex-row sm:items-center sm:justify-between lg:rounded-md"
                            >
                              <span className="flex items-center gap-2">
                                <PlayCircle className="h-4 w-4 text-primary" />
                                {lesson.title}
                              </span>
                              <span className={lessonProgress?.completed ? 'text-emerald-700' : 'text-[#8A8A92]'}>
                                {lessonProgress?.completed ? 'concluída' : `${lessonProgress?.progress ?? 0}%`}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          )}

          {activeLesson && lessonId && (
            <section className="rounded-[28px] border border-white/70 bg-white/86 p-5 shadow-[0_18px_42px_rgba(17,17,20,0.06)] backdrop-blur-2xl lg:rounded-lg lg:border-[#E6E6EA] lg:bg-white">
              <button
                type="button"
                onClick={() => navigate(courseForLesson ? `/dashboard/colaborador/cursos/${courseForLesson.id}` : '/dashboard/colaborador')}
                className="mb-4 text-sm font-semibold text-primary"
              >
                Voltar ao curso
              </button>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Aula</p>
              <h1 className="mt-2 text-[2rem] font-semibold leading-[0.98] tracking-[-0.055em] sm:text-3xl">{activeLesson.title}</h1>
              <p className="mt-2 text-sm leading-6 text-[#666670]">{activeLesson.description || 'Sem descrição.'}</p>

              <div className="mt-6 overflow-hidden rounded-[24px] border border-[#ECECEF] bg-black lg:rounded-lg">
                {videoUrl ? (
                  <VideoPlayer src={videoUrl} title={activeLesson.title} className="aspect-video w-full" />
                ) : (
                  <div className="flex aspect-video items-center justify-center px-5 text-center text-sm leading-6 text-white/70">
                    Vídeo indisponível agora. O texto da aula continua disponível.
                  </div>
                )}
              </div>

              <div className="mt-5 rounded-[20px] border border-[#ECECEF] bg-[#FAFAFB] p-4 lg:rounded-md">
                <p className="whitespace-pre-line text-sm leading-7 text-[#55555D]">
                  {activeLesson.content || 'Conteúdo textual ainda não cadastrado para esta aula.'}
                </p>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                {attachmentUrl && (
                  <a href={attachmentUrl} className="inline-flex items-center rounded-[16px] border border-[#D8D8DE] bg-[#F1F1F3] px-4 py-2 text-sm font-semibold text-[#111114] transition hover:border-primary lg:rounded-md">
                    <Download className="mr-2 h-4 w-4" />
                    Baixar anexo
                  </a>
                )}
                <Button type="button" onClick={completeLesson} className="rounded-[18px] py-3 lg:rounded-md">
                  Concluir aula
                </Button>
              </div>
            </section>
          )}
        </div>
      </section>
      {activeQuiz && (
        <div className="fixed inset-0 z-[140] flex items-end justify-center bg-[#111114]/60 px-3 pb-3 pt-10 backdrop-blur-sm sm:items-center sm:px-4 sm:py-6">
          <section className="max-h-[92svh] w-full max-w-3xl overflow-y-auto rounded-[28px] border border-white/15 bg-white p-5 text-[#111114] shadow-[0_26px_80px_rgba(0,0,0,0.28)] sm:rounded-xl">
            <header className="flex items-start justify-between gap-4 border-b border-[#ECECEF] pb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Prova do modulo</p>
                <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em]">{activeQuiz.title}</h2>
                <p className="mt-2 text-sm leading-6 text-[#666670]">Nota minima 70%. Esta tentativa fecha o ciclo atual do curso.</p>
              </div>
              <button type="button" onClick={() => setActiveQuiz(null)} aria-label="Fechar prova" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[15px] border border-[#E6E6EA] bg-[#F7F7F8] text-[#62626A] sm:rounded-md">
                <LogOut className="h-4 w-4 rotate-180" />
              </button>
            </header>

            <div className="mt-5 grid gap-4">
              {activeQuiz.questions.map((question, index) => (
                <article key={question.id} className="rounded-[22px] border border-[#ECECEF] bg-[#FAFAFB] p-4 lg:rounded-lg">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <h3 className="text-base font-semibold leading-6">{index + 1}. {question.question}</h3>
                    <span className="w-fit rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#777780] shadow-[0_8px_20px_rgba(17,17,20,0.05)]">
                      {question.type === 'multiple' ? 'Multipla escolha' : 'Objetiva'}
                    </span>
                  </div>
                  <div className="mt-4 grid gap-2">
                    {question.options.map((option) => {
                      const checked = (quizAnswers[question.id] ?? []).includes(option.id);
                      return (
                        <label key={option.id} className="flex cursor-pointer items-start gap-3 rounded-[16px] border border-[#E6E6EA] bg-white px-3 py-3 text-sm leading-6 transition hover:border-primary/40 lg:rounded-md">
                          <input
                            type={question.type === 'multiple' ? 'checkbox' : 'radio'}
                            name={question.id}
                            checked={checked}
                            onChange={() => setQuizAnswers((current) => {
                              const currentAnswers = current[question.id] ?? [];
                              if (question.type === 'single') {
                                return { ...current, [question.id]: [option.id] };
                              }
                              return {
                                ...current,
                                [question.id]: checked
                                  ? currentAnswers.filter((answerId) => answerId !== option.id)
                                  : [...currentAnswers, option.id],
                              };
                            })}
                            className="mt-1 h-4 w-4 accent-primary"
                          />
                          <span>{option.text}</span>
                        </label>
                      );
                    })}
                  </div>
                </article>
              ))}
            </div>

            <div className="sticky bottom-0 -mx-5 -mb-5 mt-5 border-t border-[#ECECEF] bg-white/94 px-5 py-4 backdrop-blur-xl">
              <Button type="button" onClick={submitActiveQuiz} className="w-full rounded-[18px] py-3 lg:rounded-md">
                Enviar prova
              </Button>
            </div>
          </section>
        </div>
      )}

      {previewCertificate && certificateUrls[previewCertificate.id] && (
        <div className="fixed inset-0 z-[150] flex items-end justify-center bg-[#111114]/70 px-3 pb-3 pt-10 backdrop-blur-sm sm:items-center sm:px-4 sm:py-6">
          <section className="flex max-h-[92svh] w-full max-w-6xl flex-col overflow-hidden rounded-[28px] border border-white/10 bg-white shadow-[0_28px_90px_rgba(0,0,0,0.28)] sm:rounded-xl">
            <header className="flex items-center justify-between gap-4 border-b border-[#ECECEF] px-5 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8A8A92]">Visualização</p>
                <h2 className="mt-1 text-lg font-semibold">Certificado</h2>
              </div>
              <button type="button" onClick={() => setPreviewCertificate(null)} aria-label="Fechar certificado" className="flex h-10 w-10 items-center justify-center rounded-[15px] border border-[#E6E6EA] bg-[#F7F7F8] text-[#62626A] sm:rounded-md">
                <X className="h-4 w-4" />
              </button>
            </header>
            <div className="min-h-0 flex-1 overflow-auto bg-[#F4F4F6] p-3 sm:p-5">
              <img src={certificateUrls[previewCertificate.id]} alt="Certificado" className="mx-auto max-h-[76svh] max-w-full rounded-lg object-contain shadow-[0_18px_46px_rgba(17,17,20,0.16)]" />
            </div>
          </section>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/70 bg-[#F9F9FB]/88 px-4 pb-[calc(env(safe-area-inset-bottom)+0.65rem)] pt-2 shadow-[0_-18px_44px_rgba(17,17,20,0.12)] backdrop-blur-2xl lg:hidden" aria-label="Navegação colaborador">
        <div className="mx-auto flex max-w-md gap-1 rounded-[24px] border border-black/[0.04] bg-white/78 p-2">
          <AppTabButton active={!certificatesRoute && !courseId && !lessonId} label="Cursos" icon={<BookOpen className="h-4 w-4" />} onClick={() => navigate('/dashboard/colaborador')} />
          <AppTabButton active={Boolean(lessonId)} label="Aula" icon={<PlayCircle className="h-4 w-4" />} onClick={() => openContinueLesson()} />
          <AppTabButton label="Home" icon={<Home className="h-4 w-4" />} onClick={() => navigate('/home')} />
          <AppTabButton label="Sair" icon={<LogOut className="h-4 w-4" />} onClick={handleSignOut} />
        </div>
      </nav>
    </main>
  );
}

function CourseCards({
  isLoading,
  courses,
  progress,
  quizzes,
  attempts,
  coverUrls,
  onOpenCourse,
}: {
  isLoading: boolean;
  courses: CourseTree[];
  progress: LessonProgress[];
  quizzes: Quiz[];
  attempts: QuizAttempt[];
  coverUrls: Record<string, string>;
  onOpenCourse: (course: CourseTree) => void;
}) {
  return (
    <div className="mt-6 grid gap-4 lg:grid-cols-2">
      {isLoading ? (
        <p className="text-sm text-[#8A8A92]">Carregando conteúdos...</p>
      ) : courses.length === 0 ? (
        <p className="text-sm text-[#8A8A92]">Nenhum curso ativo para sua empresa ainda.</p>
      ) : courses.map((course) => {
        const courseProgress = getCourseProgress(course, progress, quizzes, attempts);
        const completedModules = getCompletedModuleCount(course, progress, quizzes, attempts);
        const coverUrl = coverUrls[course.id];
        return (
          <button
            type="button"
            key={course.id}
            onClick={() => onOpenCourse(course)}
            className="overflow-hidden rounded-[26px] border border-[#ECECEF] bg-[#FAFAFB] text-left shadow-[0_16px_34px_rgba(17,17,20,0.05)] transition hover:border-primary/40 lg:rounded-lg lg:shadow-none"
          >
            <div className="aspect-[3/2] bg-[#ECECEF]">
              {coverUrl ? (
                <img src={coverUrl} alt={course.title} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-sm font-semibold text-[#8A8A92]">Sem capa</div>
              )}
            </div>
            <div className="p-4">
              <h2 className="text-lg font-semibold leading-tight tracking-[-0.025em]">{course.title}</h2>
              <p className="mt-2 text-sm leading-6 text-[#666670]">{course.description || 'Curso de onboarding interno.'}</p>
              <p className="mt-3 text-sm text-[#8A8A92]">{completedModules} de {course.modules.length} módulos concluídos</p>
              <div className="mt-4 flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-primary">{courseProgress}% concluído</span>
                <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-[#666670] shadow-[0_8px_20px_rgba(17,17,20,0.05)] lg:bg-transparent lg:p-0 lg:shadow-none">Acessar</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#EFEFF2]">
                <div className="h-full rounded-full bg-primary" style={{ width: `${courseProgress}%` }} />
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
