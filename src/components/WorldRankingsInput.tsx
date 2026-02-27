'use client';

import { useState } from 'react';

interface WorldRankingsInputProps {
  values: (number | null)[];
  onChange: (values: (number | null)[]) => void;
}

function parseRankings(raw: string): (number | null)[] {
  const tokens = raw.split(/[\s,]+/).filter(Boolean);
  const result: (number | null)[] = Array(18).fill(null);
  for (let i = 0; i < Math.min(tokens.length, 18); i++) {
    const n = Number(tokens[i]);
    result[i] = isNaN(n) ? null : n;
  }
  return result;
}

function randomPermutation(): string {
  const arr = Array.from({ length: 18 }, (_, i) => i + 1);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.join(' ');
}

function validationMessage(values: (number | null)[]): { ok: boolean; msg: string } {
  const filled = values.filter((v): v is number => v !== null);
  if (filled.length === 0) return { ok: false, msg: '' };
  if (filled.length < 18) return { ok: false, msg: `${filled.length} de 18 números` };
  const outOfRange = filled.filter(v => v < 1 || v > 18);
  if (outOfRange.length > 0) return { ok: false, msg: `Valores fuera de rango (1-18): ${outOfRange.join(', ')}` };
  const seen = new Set<number>();
  const dupes: number[] = [];
  for (const v of filled) {
    if (seen.has(v)) dupes.push(v);
    seen.add(v);
  }
  if (dupes.length > 0) return { ok: false, msg: `Valores repetidos: ${[...new Set(dupes)].join(', ')}` };
  return { ok: true, msg: '18 valores válidos (1-18 sin repetir)' };
}

export function WorldRankingsInput({ values, onChange }: WorldRankingsInputProps) {
  const [text, setText] = useState(() =>
    values.filter((v): v is number => v !== null).join(' ')
  );

  function handleChange(raw: string) {
    setText(raw);
    onChange(parseRankings(raw));
  }

  function handleAutofill() {
    const generated = randomPermutation();
    setText(generated);
    onChange(parseRankings(generated));
  }

  const { ok, msg } = validationMessage(values);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={text}
          onChange={e => handleChange(e.target.value)}
          placeholder="Ej: 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18"
          className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 font-mono text-sm focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
        />
        <button
          type="button"
          onClick={handleAutofill}
          className="shrink-0 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
        >
          Autocompletar
        </button>
      </div>
      {msg && (
        <p className={`text-xs ${ok ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}>
          {ok ? '✓ ' : ''}{msg}
        </p>
      )}
    </div>
  );
}
