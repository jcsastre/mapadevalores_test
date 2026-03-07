'use client';

interface GroupOption {
  id: number;
  name: string;
}

interface FilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  sexo: string;
  onSexoChange: (value: string) => void;
  estadoCivil: string;
  onEstadoCivilChange: (value: string) => void;
  profesion: string;
  onProfesionChange: (value: string) => void;
  dateFrom: string;
  onDateFromChange: (value: string) => void;
  dateTo: string;
  onDateToChange: (value: string) => void;
  groups: GroupOption[];
  groupId: string;
  onGroupIdChange: (value: string) => void;
}

const SEXO_OPTIONS = ['', 'Mujer', 'Hombre', 'No binario', 'Prefiero no decirlo'];
const ESTADO_CIVIL_OPTIONS = ['', 'Soltero/a', 'Casado/a', 'Divorciado/a', 'Viudo/a', 'Union libre'];

const selectClass =
  'rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50';
const inputClass = selectClass;

export function FilterBar({
  search, onSearchChange,
  sexo, onSexoChange,
  estadoCivil, onEstadoCivilChange,
  profesion, onProfesionChange,
  dateFrom, onDateFromChange,
  dateTo, onDateToChange,
  groups, groupId, onGroupIdChange,
}: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Buscar clave</label>
        <input
          type="text"
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          placeholder="Buscar..."
          className={`${inputClass} w-40`}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Sexo</label>
        <select value={sexo} onChange={e => onSexoChange(e.target.value)} className={`${selectClass} w-40`}>
          <option value="">Todos</option>
          {SEXO_OPTIONS.filter(Boolean).map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Estado civil</label>
        <select value={estadoCivil} onChange={e => onEstadoCivilChange(e.target.value)} className={`${selectClass} w-40`}>
          <option value="">Todos</option>
          {ESTADO_CIVIL_OPTIONS.filter(Boolean).map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Profesion</label>
        <input
          type="text"
          value={profesion}
          onChange={e => onProfesionChange(e.target.value)}
          placeholder="Filtrar..."
          className={`${inputClass} w-36`}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Desde</label>
        <input
          type="date"
          value={dateFrom}
          onChange={e => onDateFromChange(e.target.value)}
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Hasta</label>
        <input
          type="date"
          value={dateTo}
          onChange={e => onDateToChange(e.target.value)}
          className={inputClass}
        />
      </div>

      {groups.length > 0 && (
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Grupo</label>
          <select value={groupId} onChange={e => onGroupIdChange(e.target.value)} className={`${selectClass} w-44`}>
            <option value="">Todos</option>
            {groups.map(g => (
              <option key={g.id} value={String(g.id)}>{g.name}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
