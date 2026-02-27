'use client';

interface RankingReviewProps {
  title: string;
  rankings: (number | null)[];
  phrases: string[];
  onConfirm: () => void;
  onBack: () => void;
}

export function RankingReview({ title, rankings, phrases, onConfirm, onBack }: RankingReviewProps) {
  const ordered = rankings
    .map((rank, i) => ({ rank: rank as number, phrase: phrases[i] }))
    .sort((a, b) => a.rank - b.rank);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-semibold text-zinc-800 dark:text-zinc-200">
          {title} — Tu ordenación
        </h2>
        <p className="text-sm text-zinc-500">
          Revisa el orden que asignaste. Puedes confirmar o volver a modificar.
        </p>
      </div>

      <ol className="flex flex-col gap-2">
        {ordered.map(({ rank, phrase }) => (
          <li
            key={rank}
            className="flex items-start gap-3 rounded-lg border border-zinc-100 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <span className="w-7 shrink-0 text-right text-sm font-semibold text-zinc-400 dark:text-zinc-500">
              {rank}.
            </span>
            <span className="text-sm leading-snug text-zinc-800 sm:text-base dark:text-zinc-200">{phrase}</span>
          </li>
        ))}
      </ol>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex h-12 flex-1 items-center justify-center rounded-xl border border-zinc-300 px-6 text-base font-medium text-zinc-700 transition-colors hover:bg-zinc-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          Volver a modificar
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="flex h-12 flex-1 items-center justify-center rounded-xl bg-zinc-900 text-base font-medium text-white transition-colors hover:bg-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Confirmar y continuar
        </button>
      </div>
    </div>
  );
}
