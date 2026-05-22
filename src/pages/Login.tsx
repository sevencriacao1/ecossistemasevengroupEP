import { FormEvent, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, ShieldCheck } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuth } from '../contexts/AuthContext';

export function Login() {
  const navigate = useNavigate();
  const { session, isLoading: isAuthLoading, signIn } = useAuth();

  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (session) {
      navigate('/home', { replace: true });
    }
  }, [session, navigate]);

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await signIn(login, password);
      navigate('/home', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Credenciais inválidas. Tente novamente.');
      setIsLoading(false);
    }
  };

  if (isAuthLoading) {
    return <div className="min-h-screen bg-background" />;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-4 py-6 text-[#2A2A2A] selection:bg-[#ff6a00]/25 sm:px-5 sm:py-10">
      <motion.section
        initial={{ opacity: 0, y: 18, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="grid w-full max-w-[970px] gap-7 rounded-[24px] bg-[#F7F7F7] p-5 shadow-[0_28px_80px_rgba(0,0,0,0.45)] sm:gap-8 sm:rounded-[28px] sm:p-8 lg:grid-cols-[1.08fr_1fr] lg:gap-14"
      >
        <div className="relative min-h-[220px] overflow-hidden rounded-[20px] bg-[#050505] sm:min-h-[500px] sm:rounded-[22px]">
          <img
            src="/assets/login/bg-login.webp"
            alt=""
            className="h-full min-h-[220px] w-full object-cover sm:min-h-[500px]"
            aria-hidden="true"
            loading="eager"
            fetchPriority="high"
            decoding="async"
          />
        </div>

        <div className="flex items-center px-1 pb-2 pt-1 sm:px-4 lg:px-0">
          <div className="w-full max-w-[360px] lg:ml-2">
            <div className="mb-4">
              <img
                src="/assets/login/icon-n-laranja.webp"
                alt="Seven Group"
                className="mb-4 h-12 w-12 object-contain object-left"
                loading="eager"
                decoding="async"
              />
              <h1 className="text-[30px] font-semibold uppercase leading-[0.9] tracking-[-0.04em] text-[#25272B] sm:text-[34px]">
                <span className="block font-medium">Ecossistema</span>
                <span className="block font-extrabold">Seven Group 360</span>
              </h1>
              <div className="mt-4 flex items-center gap-2 text-sm text-[#8B8B8B]">
                <span className="h-2 w-2 rounded-full bg-[#76dd28] shadow-[0_0_0_3px_rgba(118,221,40,0.12)]" />
                Acesso restrito
              </div>
            </div>

            <div className="mb-4 h-px w-full bg-[#E1E1E1]" />

            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm text-[#777777]">Usuário:</label>
                <Input
                  type="text"
                  value={login}
                  onChange={(event) => setLogin(event.target.value)}
                  placeholder="Insira seu usuário aqui"
                  required
                  className="h-[53px] rounded-md border-[#AFAFAF] bg-white px-4 text-[14px] text-[#2A2A2A] placeholder:text-[#8A8A8A] focus:border-[#ff6a00] focus:ring-[#ff6a00]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-[#777777]">Senha:</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Insira sua senha aqui"
                  required
                  minLength={6}
                  className="h-[53px] rounded-md border-[#ff6a00] bg-white px-4 text-[14px] text-[#2A2A2A] placeholder:text-[#8A8A8A] focus:border-[#ff6a00] focus:ring-[#ff6a00]"
                />
              </div>

              <Button
                type="submit"
                size="lg"
                className="mt-8 h-[52px] w-full rounded-md bg-gradient-to-r from-[#ff9b35] to-[#ff5b00] text-[17px] font-medium text-white shadow-none hover:from-[#ff9024] hover:to-[#f04f00]"
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Realizar login'}
              </Button>

              <p className="pt-1 text-center text-[11px] text-[#9A9A9A]">
                Ainda não possui uma conta? <span className="font-semibold text-[#777777]">Fale com o administrador.</span>
              </p>
            </form>
          </div>
        </div>
      </motion.section>

      <Link
        to="/validar-certificado"
        className="fixed bottom-4 left-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-medium text-white shadow-[0_14px_40px_rgba(0,0,0,0.32)] backdrop-blur-md transition hover:bg-white/16 hover:text-white focus:outline-none focus:ring-2 focus:ring-[#ff6a00]/55 sm:bottom-6 sm:left-6"
      >
        <ShieldCheck className="h-4 w-4 text-[#ff8a2a]" />
        Validar certificado
      </Link>
    </main>
  );
}
