'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { downloadBase64 } from '@/lib/download-utils';
import { FilterBar } from './FilterBar';
import { Pagination } from './Pagination';

interface GroupRef {
  id: number;
  name: string;
}

interface Submission {
  id: number;
  clave: string;
  edad: string;
  sexo: string;
  estadoCivil: string;
  hijos: string;
  profesion: string;
  responses: string;
  createdAt: string;
  group: GroupRef | null;
}

interface Filters {
  search: string;
  sexo: string;
  estadoCivil: string;
  profesion: string;
  dateFrom: string;
  dateTo: string;
  groupId: string;
}

type SortBy = 'clave' | 'edad' | 'sexo' | 'estadoCivil' | 'profesion' | 'createdAt';
type SortOrder = 'asc' | 'desc';

const SORTABLE_COLUMNS: { key: SortBy; label: string }[] = [
  { key: 'clave', label: 'Clave' },
  { key: 'edad', label: 'Edad' },
  { key: 'sexo', label: 'Sexo' },
  { key: 'estadoCivil', label: 'Estado civil' },
  { key: 'profesion', label: 'Profesion' },
  { key: 'createdAt', label: 'Fecha' },
];

export function SubmissionsTable({ password, initialGroupId = '' }: { password: string; initialGroupId?: string }) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState<number | null>(null);
  const [groups, setGroups] = useState<GroupRef[]>([]);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sortBy, setSortBy] = useState<SortBy>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [filters, setFilters] = useState<Filters>({
    search: '', sexo: '', estadoCivil: '', profesion: '', dateFrom: '', dateTo: '',
    groupId: initialGroupId,
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        sortBy,
        sortOrder,
      });
      if (filters.search) params.set('search', filters.search);
      if (filters.sexo) params.set('sexo', filters.sexo);
      if (filters.estadoCivil) params.set('estadoCivil', filters.estadoCivil);
      if (filters.profesion) params.set('profesion', filters.profesion);
      if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.set('dateTo', filters.dateTo);
      if (filters.groupId) params.set('groupId', filters.groupId);

      const res = await fetch(`/api/admin/submissions?${params}`, {
        headers: { Authorization: `Bearer ${password}` },
      });
      if (!res.ok) throw new Error('Error al cargar los tests');
      const data = await res.json();
      setSubmissions(data.data);
      setTotal(data.total);
    } catch {
      setError('No se pudieron cargar los tests');
    } finally {
      setLoading(false);
    }
  }, [password, page, pageSize, sortBy, sortOrder, filters]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    fetch('/api/admin/groups', { headers: { Authorization: `Bearer ${password}` } })
      .then(r => r.ok ? r.json() : [])
      .then((data: Array<{ id: number; name: string }>) =>
        setGroups(data.map(g => ({ id: g.id, name: g.name })))
      )
      .catch(() => {});
  }, [password]);

  // Debounced filter changes reset to page 1
  function updateFilter<K extends keyof Filters>(key: K, value: Filters[K]) {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  }

  function handleSort(column: SortBy) {
    if (sortBy === column) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
    setPage(1);
  }

  function handlePageSizeChange(size: number) {
    setPageSize(size);
    setPage(1);
  }

  async function handleDownload(submission: Submission) {
    setDownloading(submission.id);
    try {
      const responses: number[] = JSON.parse(submission.responses);
      const requestBody = {
        password,
        request: {
          clave: submission.clave,
          edad: submission.edad,
          sexo: submission.sexo,
          estadoCivil: submission.estadoCivil,
          hijos: submission.hijos,
          profesion: submission.profesion,
          metodoInput: 'admin',
          responses,
        },
        reportType: 'COMPLETE',
        wordType: 'FOR_JC',
      };

      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error ?? 'Error generando informes');
        return;
      }

      const data = await res.json();
      downloadBase64(data.pdf, `${data.filename}.pdf`, 'application/pdf');
      downloadBase64(data.word, `${data.filename}.docx`, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      if (data.json) {
        downloadBase64(data.json, `${data.filename}_datos.json`, 'application/json');
      }
    } catch {
      alert('Error de conexion');
    } finally {
      setDownloading(null);
    }
  }

  async function handleDelete(submission: Submission) {
    if (!confirm(`Eliminar el registro de "${submission.clave}"?`)) return;
    try {
      const res = await fetch(`/api/admin/submissions/${submission.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${password}` },
      });
      if (!res.ok) throw new Error();
      load();
    } catch {
      alert('Error al eliminar el registro');
    }
  }

  function SortIcon({ column }: { column: SortBy }) {
    if (sortBy !== column) {
      return <span className="ml-1 text-zinc-300 dark:text-zinc-600">&uarr;&darr;</span>;
    }
    return <span className="ml-1">{sortOrder === 'asc' ? '\u2191' : '\u2193'}</span>;
  }

  return (
    <div className="flex flex-col gap-5">
      <FilterBar
        search={filters.search}
        onSearchChange={v => updateFilter('search', v)}
        sexo={filters.sexo}
        onSexoChange={v => updateFilter('sexo', v)}
        estadoCivil={filters.estadoCivil}
        onEstadoCivilChange={v => updateFilter('estadoCivil', v)}
        profesion={filters.profesion}
        onProfesionChange={v => updateFilter('profesion', v)}
        dateFrom={filters.dateFrom}
        onDateFromChange={v => updateFilter('dateFrom', v)}
        dateTo={filters.dateTo}
        onDateToChange={v => updateFilter('dateTo', v)}
        groups={groups}
        groupId={filters.groupId}
        onGroupIdChange={v => updateFilter('groupId', v)}
      />

      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">
          {error}
          <button onClick={load} className="ml-3 underline">Reintentar</button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 py-8 text-sm text-zinc-500">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-700 dark:border-zinc-600 dark:border-t-zinc-200" />
          Cargando tests...
        </div>
      ) : submissions.length === 0 && !error ? (
        <p className="py-8 text-center text-sm text-zinc-500">No hay tests que coincidan con los filtros.</p>
      ) : !error && (
        <>
          <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 text-left text-xs uppercase tracking-wide text-zinc-500">
                  {SORTABLE_COLUMNS.map(col => (
                    <th
                      key={col.key}
                      onClick={() => handleSort(col.key)}
                      className="cursor-pointer select-none px-4 py-3 hover:text-zinc-900 dark:hover:text-zinc-100"
                    >
                      {col.label}
                      <SortIcon column={col.key} />
                    </th>
                  ))}
                  <th className="px-4 py-3">Grupo</th>
                  <th className="px-4 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map(s => (
                  <tr
                    key={s.id}
                    className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                  >
                    <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">{s.clave}</td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{s.edad}</td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{s.sexo}</td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{s.estadoCivil}</td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{s.profesion || '\u2014'}</td>
                    <td className="px-4 py-3 text-zinc-500 whitespace-nowrap">
                      {new Date(s.createdAt).toLocaleString('es-ES', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </td>
                    <td className="px-4 py-3">
                      {s.group ? (
                        <Link
                          href={`/admin/grupos`}
                          className="inline-block rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 whitespace-nowrap"
                        >
                          {s.group.name}
                        </Link>
                      ) : (
                        <span className="text-zinc-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDownload(s)}
                          disabled={downloading === s.id}
                          className="rounded-lg bg-zinc-900 px-3 py-1 text-xs font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
                        >
                          {downloading === s.id ? '...' : 'Descargar'}
                        </button>
                        <button
                          onClick={() => handleDelete(s)}
                          className="rounded-lg border border-red-200 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={setPage}
            onPageSizeChange={handlePageSizeChange}
          />
        </>
      )}
    </div>
  );
}
