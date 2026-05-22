import { ArqoIconBadge, ArqoSection, ArqoTitle } from './ArqoPrimitives';
import { strategicStructures } from './arqoContent';

export function ArqoStructures() {
  return (
    <ArqoSection id="estruturas" className="bg-[#F8F7F3]">
      <div className="grid gap-14 min-[1366px]:grid-cols-[0.38fr_0.62fr]">
        <div className="min-[1366px]:sticky min-[1366px]:top-32 min-[1366px]:h-fit">
          <ArqoTitle eyebrow="Estruturas Estratégicas" title="Estruturas que organizam valor antes da venda." />
        </div>

        <div className="space-y-5">
          {strategicStructures.map((item) => (
            <article
              key={item.number}
              className="group rounded-[30px] border border-black/[0.07] bg-white/70 p-6 shadow-[0_22px_70px_rgba(34,33,29,0.055)] backdrop-blur-2xl transition duration-300 hover:-translate-y-1 hover:bg-white"
            >
              <div className="grid gap-6 sm:grid-cols-[0.22fr_0.78fr] sm:items-start">
                <div>
                  <p className="arqo-heading text-6xl font-medium tracking-[-0.07em] text-[#C7C0B4] transition group-hover:text-[#171715]">
                    {item.number}
                  </p>
                </div>
                <div>
                  <div className="flex items-start justify-between gap-5">
                    <h3 className="arqo-heading text-2xl font-medium tracking-[-0.035em] text-[#171715] sm:text-3xl">{item.title}</h3>
                    <ArqoIconBadge icon={item.icon} />
                  </div>
                  <p className="mt-5 max-w-2xl text-base leading-8 text-[#625F57]">{item.description}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </ArqoSection>
  );
}
