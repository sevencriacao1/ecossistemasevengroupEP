import { useLocation, useNavigate } from 'react-router-dom';
import { SevenEntryTransition } from '../components/SevenEntryTransition';
import { useAuth } from '../contexts/AuthContext';

export function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();
  const routeState = location.state as { showChoices?: boolean; dashboardUnavailable?: boolean } | null;
  const showChoices = Boolean(routeState?.showChoices);
  const notice = routeState?.dashboardUnavailable
    ? 'Dashboard indisponivel porque seu perfil ainda nao esta completo.'
    : undefined;

  const handleLogout = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  return <SevenEntryTransition onLogout={handleLogout} initialChoices={showChoices} notice={notice} />;
}
