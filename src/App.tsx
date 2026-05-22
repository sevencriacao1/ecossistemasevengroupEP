import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

const Login = lazy(() => import('./pages/Login').then((module) => ({ default: module.Login })));
const Home = lazy(() => import('./pages/Home').then((module) => ({ default: module.Home })));
const SevenGroupPage = lazy(() => import('./pages/SevenGroupPage').then((module) => ({ default: module.SevenGroupPage })));
const ArqoPage = lazy(() => import('./pages/ArqoPage').then((module) => ({ default: module.ArqoPage })));
const CertificateValidation = lazy(() => import('./pages/CertificateValidation').then((module) => ({ default: module.CertificateValidation })));
const DashboardRouter = lazy(() => import('./pages/dashboard/DashboardRouter').then((module) => ({ default: module.DashboardRouter })));
const AdminDashboard = lazy(() => import('./pages/dashboard/AdminDashboard').then((module) => ({ default: module.AdminDashboard })));
const CollaboratorDashboard = lazy(() => import('./pages/dashboard/CollaboratorDashboard').then((module) => ({ default: module.CollaboratorDashboard })));

function RouteFallback() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0F0F10] px-6 text-white">
      <div className="flex items-center gap-3 text-sm font-medium uppercase tracking-[0.22em] text-white/70">
        <span className="h-2.5 w-2.5 rounded-full bg-[#ff6a00]" />
        Ecossistema Seven
      </div>
    </main>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/validar-certificado" element={<CertificateValidation />} />

            <Route
              path="/home"
              element={(
                <ProtectedRoute>
                  <Home />
                </ProtectedRoute>
              )}
            />

            <Route
              path="/sevengroup"
              element={(
                <ProtectedRoute>
                  <SevenGroupPage />
                </ProtectedRoute>
              )}
            />

            <Route
              path="/seven"
              element={(
                <ProtectedRoute>
                  <SevenGroupPage />
                </ProtectedRoute>
              )}
            />

            <Route
              path="/arqo"
              element={(
                <ProtectedRoute>
                  <ArqoPage />
                </ProtectedRoute>
              )}
            />

            <Route
              path="/dashboard"
              element={(
                <ProtectedRoute>
                  <DashboardRouter />
                </ProtectedRoute>
              )}
            />
            <Route
              path="/dashboard/admin/*"
              element={(
                <ProtectedRoute requiredRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              )}
            />
            <Route
              path="/dashboard/colaborador/*"
              element={(
                <ProtectedRoute requiredRole="colaborador">
                  <CollaboratorDashboard />
                </ProtectedRoute>
              )}
            />
            <Route path="/modulos" element={<Navigate to="/home" replace />} />
            <Route path="/onboarding" element={<Navigate to="/home" replace />} />
            <Route path="/guia/:guideId" element={<Navigate to="/home" replace />} />
            <Route path="/admin/*" element={<Navigate to="/home" replace />} />
            <Route path="/" element={<Navigate to="/home" replace />} />
            <Route path="*" element={<Navigate to="/home" replace />} />
          </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  );
}

export default App;
