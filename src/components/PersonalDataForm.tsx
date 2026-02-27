'use client';

export interface PersonalData {
  clave: string;
  edad: string;
  sexo: string;
  estadoCivil: string;
  hijos: string;
  profesión: string;
}

interface PersonalDataFormProps {
  data: PersonalData;
  onChange: (data: PersonalData) => void;
}

const SEXO_OPTIONS = ['Mujer', 'Hombre', 'No binario', 'Prefiero no decirlo'];
const ESTADO_CIVIL_OPTIONS = ['Soltero/a', 'Casado/a', 'Divorciado/a', 'Viudo/a', 'Unión libre'];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function PersonalDataForm({ data, onChange }: PersonalDataFormProps) {
  function set(field: keyof PersonalData, value: string) {
    onChange({ ...data, [field]: value });
  }

  function handleAutoFill() {
    onChange({
      clave: `TEST-${Math.floor(Math.random() * 9000) + 1000}`,
      edad: String(Math.floor(Math.random() * 50) + 20),
      sexo: pick(SEXO_OPTIONS),
      estadoCivil: pick(ESTADO_CIVIL_OPTIONS),
      hijos: String(Math.floor(Math.random() * 4)),
      profesión: pick(['Médico/a', 'Ingeniero/a', 'Docente', 'Abogado/a', 'Psicólogo/a', 'Empresario/a']),
    });
  }

  const inputClass = "rounded-lg border border-zinc-300 px-3 py-2.5 text-base focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-1 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50";

  const isAutofillEnabled = process.env.NEXT_PUBLIC_ENABLE_AUTOFILL === 'true';

  return (
    <div className="flex flex-col gap-4">
      {isAutofillEnabled && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleAutoFill}
            className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
          >
            Autocompletar al azar
          </button>
        </div>
      )}
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="clave" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Clave <span className="text-red-500">*</span>
        </label>
        <input
          id="clave"
          type="text"
          value={data.clave}
          onChange={e => set('clave', e.target.value)}
          className={inputClass}
          placeholder="Identificador del evaluado…"
          autoComplete="off"
          spellCheck={false}
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="edad" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Edad <span className="text-red-500">*</span>
        </label>
        <input
          id="edad"
          type="number"
          inputMode="numeric"
          value={data.edad}
          onChange={e => set('edad', e.target.value)}
          className={inputClass}
          placeholder="Años…"
          autoComplete="off"
          min="1"
          max="120"
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="sexo" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Sexo <span className="text-red-500">*</span>
        </label>
        <select
          id="sexo"
          value={data.sexo}
          onChange={e => set('sexo', e.target.value)}
          className={inputClass}
          autoComplete="sex"
          required
        >
          <option value="">Seleccionar…</option>
          {SEXO_OPTIONS.map(o => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="estadoCivil" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Estado Civil <span className="text-red-500">*</span>
        </label>
        <select
          id="estadoCivil"
          value={data.estadoCivil}
          onChange={e => set('estadoCivil', e.target.value)}
          className={inputClass}
          autoComplete="off"
          required
        >
          <option value="">Seleccionar…</option>
          {ESTADO_CIVIL_OPTIONS.map(o => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="hijos" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Hijos
        </label>
        <input
          id="hijos"
          type="number"
          inputMode="numeric"
          value={data.hijos}
          onChange={e => set('hijos', e.target.value)}
          className={inputClass}
          placeholder="Número de hijos…"
          autoComplete="off"
          min="0"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="profesion" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Profesión
        </label>
        <input
          id="profesion"
          type="text"
          value={data.profesión}
          onChange={e => set('profesión', e.target.value)}
          className={inputClass}
          placeholder="Profesión u ocupación…"
          autoComplete="organization-title"
        />
      </div>
    </div>
    </div>
  );
}
