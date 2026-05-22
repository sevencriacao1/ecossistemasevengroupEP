import { ArqoSection, ArqoTitle } from './ArqoPrimitives';
import { thinkingPoints } from './arqoContent';

export function ArqoThinking() {
  return (
    <ArqoSection className="bg-white">
      <div className="grid gap-14 min-[1366px]:grid-cols-[0.38fr_0.62fr]">
        <div className="min-[1366px]:sticky min-[1366px]:top-32 min-[1366px]:h-fit">
          <ArqoTitle eyebrow="Como a ARQO Pensa" title="Clareza antes de volume." />
        </div>

        <div className="relative space-y-0 border-l border-black/[0.08]">
          {thinkingPoints.map((point, index) => (
            <div key={point} className="relative border-b border-black/[0.06] py-8 pl-8">
              <span className="absolute -left-[5px] top-10 h-2.5 w-2.5 rounded-full bg-[#171715]" />
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.24em] text-[#969084]">0{index + 1}</p>
              <p className="arqo-heading text-2xl font-medium leading-tight tracking-[-0.035em] text-[#171715] sm:text-4xl">{point}</p>
            </div>
          ))}
        </div>
      </div>
    </ArqoSection>
  );
}
