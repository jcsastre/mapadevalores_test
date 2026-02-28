'use client';

import { axiogramsByWorld } from '@/lib/hartman/domain/axiogram';
import type { WorldType } from '@/lib/hartman/domain/world';

interface WorldRankingFormProps {
  world: WorldType;
  values: (number | null)[];
  onChange: (values: (number | null)[]) => void;
  isAutofillEnabled?: boolean;
}

const ALL_RANKS = Array.from({ length: 18 }, (_, i) => i + 1);

function shuffled(): number[] {
  const arr = [...ALL_RANKS];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function WorldRankingForm({ world, values, onChange, isAutofillEnabled }: WorldRankingFormProps) {
  const axiograms = axiogramsByWorld.get(world) ?? [];
  const usedValues = new Set(values.filter((v): v is number => v !== null));
  const assignedCount = usedValues.size;
  const progressPct = Math.round((assignedCount / 18) * 100);

  function handleChange(index: number, raw: string) {
    const next = [...values];
    next[index] = raw === '' ? null : Number(raw);
    onChange(next);
  }

  function handleClear(index: number) {
    const next = [...values];
    next[index] = null;
    onChange(next);
  }

  function handleClearAll() {
    onChange(Array(18).fill(null));
  }

  function handleAutoFill() {
    onChange(shuffled());
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Progress */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-xs text-zinc-500">
          <span>{assignedCount}/18 asignadas</span>
          <span>{progressPct}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
          <div
            className="h-full rounded-full bg-zinc-900 transition-all dark:bg-zinc-50"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={handleClearAll}
          className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
        >
          Limpiar todo
        </button>
        {isAutofillEnabled && (
          <button
            type="button"
            onClick={handleAutoFill}
            className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
          >
            Autocompletar al azar
          </button>
        )}
      </div>

      {/* Rows */}
      {axiograms.map((axiogram, index) => {
        const selected = values[index];
        const isAssigned = selected !== null;
        const availableOptions = ALL_RANKS.filter(
          n => !usedValues.has(n) || n === selected,
        );

        return (
          <div
            key={index}
            className={`flex items-center gap-3 rounded-lg border px-4 py-3 transition-colors ${
              isAssigned
                ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30'
                : 'border-dashed border-zinc-300 bg-white dark:border-zinc-600 dark:bg-zinc-800/50'
            }`}
          >
            <button
              type="button"
              onClick={() => handleClear(index)}
              disabled={!isAssigned}
              className="shrink-0 rounded-lg border border-zinc-300 bg-zinc-50 px-2 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:border-zinc-400 disabled:pointer-events-none disabled:opacity-0 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-600"
            >
              Limpiar
            </button>

            <select
              value={selected ?? ''}
              onChange={e => handleChange(index, e.target.value)}
              aria-label={`Rango para: ${axiogram.phrase}`}
              className={`shrink-0 rounded-lg border px-2 py-1.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-1 ${
                isAssigned
                  ? 'w-20 border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/50 dark:text-zinc-50'
                  : 'w-20 border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50'
              }`}
            >
              <option value="">—</option>
              {availableOptions.map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>

            <span className="flex-1 text-sm leading-snug text-zinc-800 sm:text-base dark:text-zinc-200">
              {axiogram.phrase}
            </span>
          </div>
        );
      })}
    </div>
  );
}
