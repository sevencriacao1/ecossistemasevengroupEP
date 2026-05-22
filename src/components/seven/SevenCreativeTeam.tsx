import { creativeTeam } from './sevenContent';
import { AssetFrame, IconBadge, PremiumCard, Reveal, SectionHeader } from './SevenPrimitives';

export function SevenCreativeTeam() {
  return (
    <section className="bg-white px-5 py-24 sm:px-8 lg:px-10">
      <div className="mx-auto flex min-h-[100svh] max-w-7xl flex-col justify-center">
        <SectionHeader
          eyebrow="Equipe criativa"
          title="Branding, autoridade, estética e presença digital."
          description="A equipe criativa conecta visual, campanha, conteúdo e comunicação institucional sem competir com a estratégia central da operação."
        />
        <div className="mt-14 grid gap-5 min-[1366px]:grid-cols-2">
            {creativeTeam.map((member) => (
              <Reveal key={member.name}>
                <PremiumCard className="flex h-full min-h-[auto] flex-col min-[1366px]:min-h-[560px]">
                  <div className="mb-6 grid grid-cols-3 gap-3">
                    {member.images.map((image, index) => (
                      <AssetFrame
                        key={image}
                        src={image}
                        alt={`${member.name} ${index + 1}`}
                        initials={member.initials}
                        label={member.role}
                        className="h-[clamp(9rem,20vw,13.75rem)]"
                      />
                    ))}
                  </div>
                  <IconBadge icon={member.icon} />
                  <p className="mt-7 text-xs font-semibold uppercase tracking-[0.22em] text-[#E76912]">{member.role}</p>
                  <h3 className="mt-2 text-3xl font-semibold tracking-[-0.045em] text-[#111114]">{member.name}</h3>
                  <p className="mt-4 text-base leading-7 text-[#666670]">{member.description}</p>
                </PremiumCard>
              </Reveal>
            ))}
        </div>
      </div>
    </section>
  );
}
