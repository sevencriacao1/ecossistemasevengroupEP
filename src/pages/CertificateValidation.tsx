import { FormEvent, useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Award, CheckCircle2, Search, ShieldAlert } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { getCertificateUrl, validateCertificateCode } from '../services/learningService';
import { PublicCertificateValidation } from '../types/learning';

function formatDate(value: string | null) {
  if (!value) return 'Data não informada';
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(value));
}

export function CertificateValidation() {
  const [searchParams] = useSearchParams();
  const [code, setCode] = useState(searchParams.get('codigo') ?? '');
  const [result, setResult] = useState<PublicCertificateValidation | null>(null);
  const [certificateUrl, setCertificateUrl] = useState('');
  const [status, setStatus] = useState<'idle' | 'valid' | 'invalid' | 'error'>('idle');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const runValidation = useCallback(async (rawCode: string) => {
    const normalizedCode = rawCode.trim().toUpperCase();
    if (!normalizedCode) {
      setStatus('idle');
      setMessage('Informe o código de verificação do certificado.');
      return;
    }

    setIsLoading(true);
    setMessage('');
    setResult(null);
    setCertificateUrl('');

    try {
      const certificate = await validateCertificateCode(normalizedCode);
      if (!certificate) {
        setStatus('invalid');
        setMessage('Este certificado não possui validade na plataforma.');
        return;
      }

      const signedUrl = await getCertificateUrl(certificate.certificate_url);
      setResult(certificate);
      setCertificateUrl(signedUrl);
      setStatus('valid');
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Não foi possível validar o certificado agora.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const submit = async (event?: FormEvent) => {
    event?.preventDefault();
    await runValidation(code);
  };

  useEffect(() => {
    const queryCode = searchParams.get('codigo');
    if (!queryCode) return;
    setCode(queryCode.toUpperCase());
    void runValidation(queryCode);
  }, [runValidation, searchParams]);

  return (
    <main className="min-h-screen bg-[#F8F6F2] px-4 py-8 text-[#111111] sm:px-6 lg:px-10">
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl flex-col justify-center">
        <div className="grid gap-6 lg:grid-cols-[minmax(320px,420px)_minmax(0,1fr)] lg:items-start">
          <aside className="rounded-[28px] border border-[#C8A46B]/35 bg-white/72 p-6 shadow-[0_22px_70px_rgba(17,17,17,0.07)] backdrop-blur-xl lg:rounded-xl lg:p-8">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-full border border-[#C8A46B]/45 bg-[#F8F6F2]">
                <Award className="h-5 w-5 text-[#C8A46B]" />
              </span>
              <div>
                <h1 className="text-2xl font-semibold tracking-[-0.04em]">Validar certificado</h1>
              </div>
            </div>

            <Link
              to="/login"
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#F8F6F2] px-4 py-2 text-xs font-semibold text-[#111111] transition hover:bg-[#EEE9DF] focus:outline-none focus:ring-2 focus:ring-[#C8A46B]/40 lg:rounded-md"
            >
              <ArrowLeft className="h-4 w-4" />
              Retornar para o login
            </Link>

            <p className="mt-6 text-sm leading-7 text-[#5C5C5C]">
              Insira o código de verificação localizado no rodapé do certificado para consultar a autenticidade da emissão.
            </p>

            <form onSubmit={submit} className="mt-7 grid gap-3">
              <label className="grid gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#5C5C5C]">Código de verificação</span>
                <Input
                  value={code}
                  onChange={(event) => setCode(event.target.value.toUpperCase())}
                  placeholder="ARQO-XXXXXXXX"
                  className="h-12 rounded-[16px] border-[#C8A46B]/35 bg-white text-[#111111] placeholder:text-[#9A9287] lg:rounded-md"
                />
              </label>
              <Button type="submit" disabled={isLoading} className="rounded-[18px] bg-[#111111] py-3 text-white hover:bg-[#2A2A2A] lg:rounded-md">
                <Search className="mr-2 h-4 w-4" />
                {isLoading ? 'Validando...' : 'Validar certificado'}
              </Button>
            </form>

            {message && (
              <div className={`mt-5 rounded-[18px] border px-4 py-3 text-sm leading-6 lg:rounded-md ${
                status === 'invalid' || status === 'error'
                  ? 'border-red-200 bg-red-50 text-red-700'
                  : 'border-[#C8A46B]/30 bg-[#F8F6F2] text-[#5C5C5C]'
              }`}>
                {message}
              </div>
            )}
          </aside>

          <section className="rounded-[28px] border border-[#C8A46B]/25 bg-white/72 p-5 shadow-[0_22px_70px_rgba(17,17,17,0.07)] backdrop-blur-xl lg:rounded-xl lg:p-6">
            {status === 'valid' && result ? (
              <div>
                <div className="flex flex-col gap-3 border-b border-[#C8A46B]/20 pb-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
                      <CheckCircle2 className="h-4 w-4" />
                      Certificado válido
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">{result.student_name}</h2>
                    <p className="mt-1 text-sm text-[#5C5C5C]">{result.course_title}</p>
                  </div>
                  <div className="rounded-[18px] border border-[#C8A46B]/25 bg-[#F8F6F2] px-4 py-3 text-sm text-[#5C5C5C] lg:rounded-md">
                    Emitido em <strong className="text-[#111111]">{formatDate(result.issued_at)}</strong>
                  </div>
                </div>

                <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
                  <div className="rounded-[18px] bg-[#F8F6F2] p-4 lg:rounded-md">
                    <dt className="text-[#8A8178]">Empresa</dt>
                    <dd className="mt-1 font-semibold">{result.company}</dd>
                  </div>
                  <div className="rounded-[18px] bg-[#F8F6F2] p-4 lg:rounded-md">
                    <dt className="text-[#8A8178]">Conclusão</dt>
                    <dd className="mt-1 font-semibold">{formatDate(result.completed_at)}</dd>
                  </div>
                  <div className="rounded-[18px] bg-[#F8F6F2] p-4 lg:rounded-md">
                    <dt className="text-[#8A8178]">Código</dt>
                    <dd className="mt-1 font-semibold">{result.validation_code}</dd>
                  </div>
                </dl>

                <div className="mt-5 overflow-hidden rounded-[22px] border border-[#C8A46B]/20 bg-[#F8F6F2] lg:rounded-lg">
                  {certificateUrl ? (
                    <img src={certificateUrl} alt={`Certificado de ${result.student_name}`} className="w-full object-contain" />
                  ) : (
                    <div className="flex aspect-video items-center justify-center px-5 text-center text-sm text-[#5C5C5C]">
                      Certificado validado, mas a imagem não está disponível para visualização.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex min-h-[520px] flex-col items-center justify-center text-center">
                <span className="flex h-16 w-16 items-center justify-center rounded-full border border-[#C8A46B]/35 bg-[#F8F6F2]">
                  <ShieldAlert className="h-7 w-7 text-[#C8A46B]" />
                </span>
                <h2 className="mt-5 text-2xl font-semibold tracking-[-0.04em]">
                  {status === 'invalid' ? 'Certificado sem validade' : 'Aguardando código'}
                </h2>
                <p className="mt-3 max-w-md text-sm leading-7 text-[#5C5C5C]">
                  {status === 'invalid'
                    ? 'Não encontramos uma emissão válida para o código informado.'
                    : 'A validação pública exibirá os dados e a imagem do certificado quando o código for reconhecido.'}
                </p>
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}
