import { ArqoIconBadge, ArqoSection, ArqoTitle } from './ArqoPrimitives';
import { cultureItems } from './arqoContent';

export function ArqoCulture() {
  return (
    <ArqoSection className="bg-white">
      <div className="grid gap-14 min-[1366px]:grid-cols-[0.42fr_0.58fr] min-[1366px]:items-center">
        <ArqoTitle
          eyebrow="Cultura ARQO"
          title="Tudo comunica valor."
          subtitle="A forma como atendemos também faz parte da experiência. Porque percepção não está apenas no produto. Está na condução."
        />

        <div className="grid gap-4 sm:grid-cols-2">
          {cultureItems.map((item) => (
            <div key={item.title} className="flex items-center gap-4 rounded-[24px] border border-black/[0.07] bg-[#F8F7F3] p-5">
              <ArqoIconBadge icon={item.icon} />
              <span className="arqo-heading text-2xl font-medium tracking-[-0.035em] text-[#171715]">{item.title}</span>
            </div>
          ))}
        </div>
      </div>
    </ArqoSection>
  );
}
