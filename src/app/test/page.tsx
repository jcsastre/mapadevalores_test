'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { PersonalDataForm, type PersonalData } from '@/components/PersonalDataForm';
import { WorldRankingForm } from '@/components/WorldRankingForm';
import { RankingReview } from '@/components/RankingReview';
import { axiogramsByWorld } from '@/lib/hartman/domain/axiogram';

const EMPTY_RANKINGS = (): (number | null)[] => Array(18).fill(null);

function isCompleteRanking(values: (number | null)[]): boolean {
  const filled = values.filter((v): v is number => v !== null);
  if (filled.length !== 18) return false;
  return new Set(filled).size === 18;
}

function isPersonalDataComplete(data: PersonalData): boolean {
  return !!(data.clave.trim() && data.edad && data.sexo && data.estadoCivil);
}

function phrasesForWorld(world: 'EXTERNAL' | 'INTERNAL' | 'SEXUAL'): string[] {
  return (axiogramsByWorld.get(world) ?? []).map(a => a.phrase);
}

type Step =
  | 'personal'
  | 'external'
  | 'external-review'
  | 'internal'
  | 'internal-review'
  | 'sexual-choice'
  | 'sexual-ranking'
  | 'sexual-review'
  | 'confirm'
  | 'done';

function TestContent() {
  const [step, setStep] = useState<Step>('personal');
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
  const [includeSexual, setIncludeSexual] = useState<boolean | null>(null);
  const [sexualRankings, setSexualRankings] = useState<(number | null)[]>(EMPTY_RANKINGS());
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const searchParams = useSearchParams();
  const isAutofillEnabled = searchParams.get('qa') === '1';

  const STEPS: Step[] = includeSexual
    ? ['personal', 'external', 'external-review', 'internal', 'internal-review', 'sexual-choice', 'sexual-ranking', 'sexual-review', 'confirm']
    : ['personal', 'external', 'external-review', 'internal', 'internal-review', 'sexual-choice', 'confirm'];

  const currentIndex = STEPS.indexOf(step);
  const totalSteps = STEPS.length;

  function goNext() {
    setError('');
    if (step === 'personal') {
      if (!isPersonalDataComplete(personalData)) {
        setError('Completa los campos obligatorios antes de continuar');
        return;
      }
      setStep('external');
    } else if (step === 'external') {
      if (!isCompleteRanking(externalRankings)) {
        setError('Asigna los valores del 1 al 18 sin repetir antes de continuar');
        return;
      }
      setStep('external-review');
    } else if (step === 'internal') {
      if (!isCompleteRanking(internalRankings)) {
        setError('Asigna los valores del 1 al 18 sin repetir antes de continuar');
        return;
      }
      setStep('internal-review');
    } else if (step === 'sexual-choice') {
      if (includeSexual === null) {
        setError('Selecciona una opción antes de continuar');
        return;
      }
      setStep(includeSexual ? 'sexual-ranking' : 'confirm');
    } else if (step === 'sexual-ranking') {
      if (!isCompleteRanking(sexualRankings)) {
        setError('Asigna los valores del 1 al 18 sin repetir antes de continuar');
        return;
      }
      setStep('sexual-review');
    }
  }

  function goBack() {
    setError('');
    if (step === 'external') setStep('personal');
    else if (step === 'external-review') setStep('external');
    else if (step === 'internal') setStep('external-review');
    else if (step === 'internal-review') setStep('internal');
    else if (step === 'sexual-choice') setStep('internal-review');
    else if (step === 'sexual-ranking') setStep('sexual-choice');
    else if (step === 'sexual-review') setStep('sexual-ranking');
    else if (step === 'confirm') setStep(includeSexual ? 'sexual-review' : 'sexual-choice');
  }

  async function handleSubmit() {
    setError('');
    setLoading(true);

    const responses = [
      ...externalRankings as number[],
      ...internalRankings as number[],
      ...(includeSexual ? sexualRankings as number[] : []),
    ];

    try {
      const res = await fetch('/api/iahrsubmit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clave: personalData.clave.trim(),
          edad: personalData.edad,
          sexo: personalData.sexo,
          estadoCivil: personalData.estadoCivil,
          hijos: personalData.hijos || '0',
          profesión: personalData.profesión || '',
          metodoInput: 'test-online',
          responses,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? 'Error enviando el test');
        return;
      }

      setStep('done');
    } catch {
      setError('Error de conexión. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  if (step === 'done') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="flex max-w-md flex-col items-center gap-6 rounded-2xl border border-zinc-200 bg-white p-10 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="text-4xl">✓</div>
          <div className="flex flex-col gap-2">
            <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              Test enviado correctamente
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Los informes se generarán y enviarán al profesional por email.
            </p>
          </div>
          <Link
            href="/"
            className="text-sm font-medium text-zinc-900 underline dark:text-zinc-50"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  const isReviewStep = step === 'external-review' || step === 'internal-review' || step === 'sexual-review';

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-3xl px-4 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            Test de Valores Hartman
          </h1>
        </div>

        {/* Step indicator */}
        <div className="mb-8 flex items-center gap-2">
          {STEPS.map((s, i) => (
            <div
              key={s}
              className={`h-2 flex-1 rounded-full transition-colors ${
                i <= currentIndex
                  ? 'bg-zinc-900 dark:bg-zinc-50'
                  : 'bg-zinc-200 dark:bg-zinc-800'
              }`}
            />
          ))}
          <span className="ml-2 shrink-0 text-xs text-zinc-500">
            {currentIndex + 1}/{totalSteps}
          </span>
        </div>

        {/* Step content */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          {step === 'personal' && (
            <>
              <h2 className="mb-4 text-lg font-semibold text-zinc-800 dark:text-zinc-200">
                Datos personales
              </h2>
              <PersonalDataForm data={personalData} onChange={setPersonalData} isAutofillEnabled={isAutofillEnabled} />
            </>
          )}

          {step === 'external' && (
            <>
              <h2 className="mb-1 text-lg font-semibold text-zinc-800 dark:text-zinc-200">
                Mundo Externo
              </h2>
              <p className="mb-4 text-sm text-zinc-600 sm:text-base dark:text-zinc-400">
                Abajo encontrarás 18 frases. Cada una de éstas representa algo a lo cual una persona puede asignarle diferentes valores (bueno o malo). Lee cuidadosamente todas las frases y si hay alguna que no entiendes pregunta su significado. Escribe el número 1 delante de la frase que, en tu opinión, representa el valor más bueno. Indica con el número 2 la frase que consideras en segundo lugar y así sucesivamente. Enumera todas las frases utilizando un número diferente para cada una de ellas (1, 2, 3, 4,...) hasta llegar al número 18, que representará el valor que consideras lo peor. No juzgues las frases por la importancia, sino exclusivamente por la bondad o maldad que contienen. No hay tiempo límite, pero la mayoría de personas enumeran todas las frases en diez minutos.
              </p>
              <WorldRankingForm world="EXTERNAL" values={externalRankings} onChange={setExternalRankings} isAutofillEnabled={isAutofillEnabled} />
            </>
          )}

          {step === 'external-review' && (
            <RankingReview
              title="Mundo Externo"
              rankings={externalRankings}
              phrases={phrasesForWorld('EXTERNAL')}
              onConfirm={() => { setError(''); setStep('internal'); }}
              onBack={() => { setError(''); setStep('external'); }}
            />
          )}

          {step === 'internal' && (
            <>
              <h2 className="mb-1 text-lg font-semibold text-zinc-800 dark:text-zinc-200">
                Mundo Interno
              </h2>
              <p className="mb-4 text-sm text-zinc-600 sm:text-base dark:text-zinc-400">
                Abajo encontrarás 18 frases. Asigna valores del 1 al 18 de acuerdo con la frase que represente el mayor valor (1) es decir con la que usted esté más de ACUERDO, hasta el número 18 que representa la frase con la que usted esté más en DESACUERDO. No puede faltar ningún número de la escala 1 al 18 y tampoco puede repetirse ningún número. Concéntrate en tu tarea y decide rápidamente qué número vas a asignar a cada una de las frases.
              </p>
              <WorldRankingForm world="INTERNAL" values={internalRankings} onChange={setInternalRankings} isAutofillEnabled={isAutofillEnabled} />
            </>
          )}

          {step === 'internal-review' && (
            <RankingReview
              title="Mundo Interno"
              rankings={internalRankings}
              phrases={phrasesForWorld('INTERNAL')}
              onConfirm={() => { setError(''); setStep('sexual-choice'); }}
              onBack={() => { setError(''); setStep('internal'); }}
            />
          )}

          {step === 'sexual-choice' && (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-1">
                <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200">
                  Mundo Sexual
                </h2>
                <p className="text-sm text-zinc-600 sm:text-base dark:text-zinc-400">
                  ¿Deseas completar también el Mundo Sexual?
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setIncludeSexual(true); setError(''); }}
                  className={`flex h-12 flex-1 items-center justify-center rounded-xl border text-sm font-medium transition-colors ${
                    includeSexual === true
                      ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-50 dark:bg-zinc-50 dark:text-zinc-900'
                      : 'border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50'
                  }`}
                >
                  Sí
                </button>
                <button
                  type="button"
                  onClick={() => { setIncludeSexual(false); setError(''); }}
                  className={`flex h-12 flex-1 items-center justify-center rounded-xl border text-sm font-medium transition-colors ${
                    includeSexual === false
                      ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-50 dark:bg-zinc-50 dark:text-zinc-900'
                      : 'border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50'
                  }`}
                >
                  No
                </button>
              </div>
            </div>
          )}

          {step === 'sexual-ranking' && (
            <>
              <h2 className="mb-1 text-lg font-semibold text-zinc-800 dark:text-zinc-200">
                Mundo Sexual
              </h2>
              <p className="mb-4 text-sm text-zinc-600 sm:text-base dark:text-zinc-400">
                Abajo encontrarás 18 frases. Asigna valores del 1 al 18 de acuerdo con la frase que represente el mayor valor (1) es decir con la que usted esté más de ACUERDO, hasta el número 18 que representa la frase con la que usted esté más en DESACUERDO. No puede faltar ningún número de la escala 1 al 18 y tampoco puede repetirse ningún número. Concéntrate en tu tarea y decide rápidamente qué número vas a asignar a cada una de las frases.
              </p>
              <WorldRankingForm world="SEXUAL" values={sexualRankings} onChange={setSexualRankings} isAutofillEnabled={isAutofillEnabled} />
            </>
          )}

          {step === 'sexual-review' && (
            <RankingReview
              title="Mundo Sexual"
              rankings={sexualRankings}
              phrases={phrasesForWorld('SEXUAL')}
              onConfirm={() => { setError(''); setStep('confirm'); }}
              onBack={() => { setError(''); setStep('sexual-ranking'); }}
            />
          )}

          {step === 'confirm' && (
            <div className="flex flex-col gap-4">
              <h2 className="text-base font-semibold text-zinc-800 dark:text-zinc-200">
                Confirmar envío
              </h2>
              <div className="rounded-lg bg-zinc-50 p-4 text-sm text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                <p><span className="font-medium">Clave:</span> {personalData.clave}</p>
                <p><span className="font-medium">Edad:</span> {personalData.edad}</p>
                <p><span className="font-medium">Sexo:</span> {personalData.sexo}</p>
                <p><span className="font-medium">Estado civil:</span> {personalData.estadoCivil}</p>
                {personalData.hijos && <p><span className="font-medium">Hijos:</span> {personalData.hijos}</p>}
                {personalData.profesión && <p><span className="font-medium">Profesión:</span> {personalData.profesión}</p>}
                <p className="mt-2"><span className="font-medium">Mundos completados:</span> Externo, Interno{includeSexual ? ', Sexual' : ''}</p>
              </div>
              <p className="text-sm text-zinc-500">
                Al enviar, los informes se generarán y se enviarán al profesional por email.
              </p>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">
            {error}
          </p>
        )}

        {/* Navigation — hidden on review steps (they have their own buttons) */}
        {!isReviewStep && (
          <div className="mt-6 flex justify-between gap-4">
            <button
              type="button"
              onClick={goBack}
              disabled={step === 'personal'}
              className="flex h-12 items-center justify-center rounded-xl border border-zinc-300 px-6 text-base font-medium text-zinc-700 transition-colors hover:bg-zinc-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 disabled:opacity-0 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Atrás
            </button>

            {step === 'confirm' ? (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="flex h-12 flex-1 items-center justify-center rounded-xl bg-zinc-900 text-base font-medium text-white transition-colors hover:bg-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                {loading ? 'Enviando…' : 'Enviar test'}
              </button>
            ) : (
              <button
                type="button"
                onClick={goNext}
                className="flex h-12 flex-1 items-center justify-center rounded-xl bg-zinc-900 text-base font-medium text-white transition-colors hover:bg-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                Siguiente
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function TestPage() {
  return (
    <Suspense>
      <TestContent />
    </Suspense>
  );
}
