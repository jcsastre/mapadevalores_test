'use client';

import { useState, useEffect } from 'react';
import { PersonalDataForm, type PersonalData } from '@/components/PersonalDataForm';
import { WorldRankingsInput } from '@/components/WorldRankingsInput';

interface GroupOption { id: number; name: string; }

const EMPTY_RANKINGS = (): (number | null)[] => Array(18).fill(null);

function hasAnyValue(values: (number | null)[]): boolean {
  return values.some(v => v !== null);
}

function isCompleteRanking(values: (number | null)[]): boolean {
  const filled = values.filter((v): v is number => v !== null);
  if (filled.length !== 18) return false;
  const outOfRange = filled.filter(v => v < 1 || v > 18);
  if (outOfRange.length > 0) return false;
  return new Set(filled).size === 18;
}

export function AdminForm({ password, isAutofillEnabled }: { password: string; isAutofillEnabled: boolean }) {
  const [personalData, setPersonalData] = useState<PersonalData>({
    clave: '',
    edad: '',
    sexo: '',
    estadoCivil: '',
    hijos: '',
    profesión: '',
  });

  const [externalRankings, setExternalRankings] = useState<(number | null)[]>(EMPTY_RANKINGS());
  const [internalRankings, setInternalRankings] = useState<(number | null)[]>(EMPTY_RANKINGS());
  const [sexualRankings, setSexualRankings] = useState<(number | null)[]>(EMPTY_RANKINGS());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [groups, setGroups] = useState<GroupOption[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');

  useEffect(() => {
    fetch('/api/admin/groups', { headers: { Authorization: `Bearer ${password}` } })
      .then(r => r.ok ? r.json() : [])
      .then((data: Array<{ id: number; name: string }>) =>
        setGroups(data.map(g => ({ id: g.id, name: g.name })))
      )
      .catch(() => {});
  }, [password]);

  const sexualHasValues = hasAnyValue(sexualRankings);

  function validate(): string | null {
    if (!personalData.clave.trim()) return 'La clave es obligatoria';
    if (!personalData.edad) return 'La edad es obligatoria';
    if (!personalData.sexo) return 'El sexo es obligatorio';
    if (!personalData.estadoCivil) return 'El estado civil es obligatorio';
    if (!isCompleteRanking(externalRankings)) return 'El Mundo Externo requiere los 18 valores del 1 al 18 sin repetir';
    if (!isCompleteRanking(internalRankings)) return 'El Mundo Interno requiere los 18 valores del 1 al 18 sin repetir';
    if (sexualHasValues && !isCompleteRanking(sexualRankings)) return 'El Mundo Sexual tiene valores pero no son validos: se necesitan los 18 valores del 1 al 18 sin repetir';
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    const includeSexual = sexualHasValues && isCompleteRanking(sexualRankings);
    const responses = [
      ...externalRankings as number[],
      ...internalRankings as number[],
      ...(includeSexual ? sexualRankings as number[] : []),
    ];

    const requestBody = {
      password,
      clave: personalData.clave.trim(),
      edad: personalData.edad,
      sexo: personalData.sexo,
      estadoCivil: personalData.estadoCivil,
      hijos: personalData.hijos || '0',
      profesion: personalData.profesión || '',
      responses,
      groupId: selectedGroupId ? parseInt(selectedGroupId, 10) : null,
    };

    try {
      const res = await fetch('/api/admin/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? 'Error guardando el test');
        return;
      }

      setSuccess('Test guardado correctamente.');
      // Reset form
      setPersonalData({ clave: '', edad: '', sexo: '', estadoCivil: '', hijos: '', profesión: '' });
      setExternalRankings(EMPTY_RANKINGS());
      setInternalRankings(EMPTY_RANKINGS());
      setSexualRankings(EMPTY_RANKINGS());
      setSelectedGroupId('');
    } catch {
      setError('Error de conexion');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      {groups.length > 0 && (
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-4 text-base font-semibold text-zinc-800 dark:text-zinc-200">
            Grupo <span className="text-zinc-400 font-normal text-sm">(opcional)</span>
          </h2>
          <select
            value={selectedGroupId}
            onChange={e => setSelectedGroupId(e.target.value)}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 w-full max-w-sm"
          >
            <option value="">Sin grupo</option>
            {groups.map(g => (
              <option key={g.id} value={String(g.id)}>{g.name}</option>
            ))}
          </select>
        </section>
      )}

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-4 text-base font-semibold text-zinc-800 dark:text-zinc-200">
          Datos personales
        </h2>
        <PersonalDataForm data={personalData} onChange={setPersonalData} isAutofillEnabled={isAutofillEnabled} />
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-1 text-base font-semibold text-zinc-800 dark:text-zinc-200">
          Mundo Externo <span className="text-red-500">*</span>
        </h2>
        <p className="mb-2 text-xs text-zinc-500">18 numeros del 1 al 18 sin repetir, separados por espacios o comas</p>
        <WorldRankingsInput values={externalRankings} onChange={setExternalRankings} isAutofillEnabled={isAutofillEnabled} />
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-1 text-base font-semibold text-zinc-800 dark:text-zinc-200">
          Mundo Interno <span className="text-red-500">*</span>
        </h2>
        <p className="mb-2 text-xs text-zinc-500">18 numeros del 1 al 18 sin repetir, separados por espacios o comas</p>
        <WorldRankingsInput values={internalRankings} onChange={setInternalRankings} isAutofillEnabled={isAutofillEnabled} />
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-1 text-base font-semibold text-zinc-800 dark:text-zinc-200">
          Mundo Sexual <span className="text-zinc-400 font-normal text-sm">(opcional)</span>
        </h2>
        <p className="mb-2 text-xs text-zinc-500">Si introduces valores, deben ser los 18 numeros del 1 al 18 sin repetir</p>
        <WorldRankingsInput values={sexualRankings} onChange={setSexualRankings} isAutofillEnabled={isAutofillEnabled} />
      </section>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">
          {error}
        </p>
      )}
      {success && (
        <p className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700 dark:bg-green-950 dark:text-green-400">
          {success}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="flex h-12 items-center justify-center rounded-xl bg-zinc-900 text-base font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {loading ? 'Guardando...' : 'Guardar test'}
      </button>
    </form>
  );
}
