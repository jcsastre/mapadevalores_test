'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PasswordGate } from '@/components/PasswordGate';
import { PersonalDataForm, type PersonalData } from '@/components/PersonalDataForm';
import { WorldRankingsInput } from '@/components/WorldRankingsInput';
import { SubmissionsTable } from '@/components/SubmissionsTable';
import { downloadBase64 } from '@/lib/download-utils';

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

function AdminForm({ password }: { password: string }) {
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

  const sexualHasValues = hasAnyValue(sexualRankings);

  function validate(): string | null {
    if (!personalData.clave.trim()) return 'La clave es obligatoria';
    if (!personalData.edad) return 'La edad es obligatoria';
    if (!personalData.sexo) return 'El sexo es obligatorio';
    if (!personalData.estadoCivil) return 'El estado civil es obligatorio';
    if (!isCompleteRanking(externalRankings)) return 'El Mundo Externo requiere los 18 valores del 1 al 18 sin repetir';
    if (!isCompleteRanking(internalRankings)) return 'El Mundo Interno requiere los 18 valores del 1 al 18 sin repetir';
    if (sexualHasValues && !isCompleteRanking(sexualRankings)) return 'El Mundo Sexual tiene valores pero no son válidos: se necesitan los 18 valores del 1 al 18 sin repetir';
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
      request: {
        clave: personalData.clave.trim(),
        edad: personalData.edad,
        sexo: personalData.sexo,
        estadoCivil: personalData.estadoCivil,
        hijos: personalData.hijos || '0',
        profesión: personalData.profesión || '',
        metodoInput: 'admin',
        responses,
      },
      reportType: 'COMPLETE',
      wordType: 'COMPLETE',
    };

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? 'Error generando informes');
        return;
      }

      const data = await res.json();
      downloadBase64(data.pdf, `${data.filename}.pdf`, 'application/pdf');
      downloadBase64(data.word, `${data.filename}.docx`, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      if (data.json) {
        downloadBase64(data.json, `${data.filename}_datos.json`, 'application/json');
      }

      setSuccess('Informes descargados correctamente.');
    } catch {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      {/* Personal data */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-4 text-base font-semibold text-zinc-800 dark:text-zinc-200">
          Datos personales
        </h2>
        <PersonalDataForm data={personalData} onChange={setPersonalData} />
      </section>

      {/* External world */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-1 text-base font-semibold text-zinc-800 dark:text-zinc-200">
          Mundo Externo <span className="text-red-500">*</span>
        </h2>
        <p className="mb-2 text-xs text-zinc-500">18 números del 1 al 18 sin repetir, separados por espacios o comas</p>
        <WorldRankingsInput values={externalRankings} onChange={setExternalRankings} />
      </section>

      {/* Internal world */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-1 text-base font-semibold text-zinc-800 dark:text-zinc-200">
          Mundo Interno <span className="text-red-500">*</span>
        </h2>
        <p className="mb-2 text-xs text-zinc-500">18 números del 1 al 18 sin repetir, separados por espacios o comas</p>
        <WorldRankingsInput values={internalRankings} onChange={setInternalRankings} />
      </section>

      {/* Sexual world */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-1 text-base font-semibold text-zinc-800 dark:text-zinc-200">
          Mundo Sexual <span className="text-zinc-400 font-normal text-sm">(opcional)</span>
        </h2>
        <p className="mb-2 text-xs text-zinc-500">Si introduces valores, deben ser los 18 números del 1 al 18 sin repetir</p>
        <WorldRankingsInput values={sexualRankings} onChange={setSexualRankings} />
      </section>

      {/* Error / success */}
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
        {loading ? 'Generando informes...' : 'Generar informes'}
      </button>
    </form>
  );
}

type Tab = 'entrada' | 'tests';

function AdminDashboard({ password }: { password: string }) {
  const [activeTab, setActiveTab] = useState<Tab>('tests');

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-8 flex items-center gap-4">
          <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
            ← Inicio
          </Link>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            Modo Profesional
          </h1>
        </div>

        {/* Tabs — segmented control */}
        <div className="mb-8 flex gap-1 rounded-xl bg-zinc-200/60 p-1 dark:bg-zinc-800">
          <button
            onClick={() => setActiveTab('tests')}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              activeTab === 'tests'
                ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-600 dark:text-zinc-50'
                : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            📋 Tests recibidos
          </button>
          <button
            onClick={() => setActiveTab('entrada')}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              activeTab === 'entrada'
                ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-600 dark:text-zinc-50'
                : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            ✏️ Entrada manual
          </button>
        </div>

        {activeTab === 'entrada' && <AdminForm password={password} />}
        {activeTab === 'tests' && <SubmissionsTable password={password} />}
      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <PasswordGate>
      {(password) => <AdminDashboard password={password} />}
    </PasswordGate>
  );
}
