import { focusAreas, specialties } from './sevenContent';
import { Reveal, SectionHeader } from './SevenPrimitives';

export function SevenFocus() {
  return (
    <section className="bg-[#F7F7F8] px-5 py-24 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow="Nosso foco"
          title="Projetos imobiliários que exigem leitura estratégica e execução completa."
        />
        <div className="mt-14 grid items-stretch gap-5 min-[1366px]:grid-cols-2">
          <Reveal className="h-full">
            <div className="h-full rounded-[34px] border border-black/[0.06] bg-white p-8 shadow-[0_24px_70px_rgba(17,17,20,0.08)]">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#E76912]">Atuação principal</p>
              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {focusAreas.map((area) => (
                  <div key={area} className="rounded-2xl bg-[#F7F7F8] px-4 py-4 text-base font-semibold text-[#222226]">
                    {area}
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
          <Reveal className="h-full">
            <div className="h-full rounded-[34px] border border-black/[0.06] bg-[#111114] p-8 text-white shadow-[0_24px_70px_rgba(17,17,20,0.16)]">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#FF9B45]">Especialidades</p>
              <div className="mt-8 space-y-3">
                {specialties.map((specialty) => (
                  <div key={specialty} className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-4 text-base font-semibold">
                    {specialty}
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
