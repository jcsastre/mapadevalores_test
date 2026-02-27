'use client';

import { useEffect, useState } from 'react';
import { downloadBase64 } from '@/lib/download-utils';

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
}

export function SubmissionsTable({ password }: { password: string }) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/submissions', {
        headers: { Authorization: `Bearer ${password}` },
      });
      if (!res.ok) throw new Error('Error al cargar los tests');
      const data = await res.json();
      setSubmissions(data);
    } catch {
      setError('No se pudieron cargar los tests');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
          profesión: submission.profesion,
          metodoInput: 'admin',
          responses,
        },
        reportType: 'COMPLETE',
        wordType: 'COMPLETE',
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
    } catch {
      alert('Error de conexión');
    } finally {
      setDownloading(null);
    }
  }

  async function handleDelete(submission: Submission) {
    if (!confirm(`¿Eliminar el registro de "${submission.clave}"?`)) return;
    try {
      const res = await fetch(`/api/admin/submissions/${submission.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${password}` },
      });
      if (!res.ok) throw new Error();
      setSubmissions(prev => prev.filter(s => s.id !== submission.id));
    } catch {
      alert('Error al eliminar el registro');
    }
  }

  if (loading) {
    return <p className="text-sm text-zinc-500 py-4">Cargando tests...</p>;
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">
        {error}
        <button onClick={load} className="ml-3 underline">Reintentar</button>
      </div>
    );
  }

  if (submissions.length === 0) {
    return <p className="text-sm text-zinc-500 py-4">No hay tests registrados.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-200 dark:border-zinc-700 text-left text-zinc-500 text-xs uppercase tracking-wide">
            <th className="pb-2 pr-4">Clave</th>
            <th className="pb-2 pr-4">Edad</th>
            <th className="pb-2 pr-4">Sexo</th>
            <th className="pb-2 pr-4">Estado civil</th>
            <th className="pb-2 pr-4">Profesión</th>
            <th className="pb-2 pr-4">Fecha</th>
            <th className="pb-2">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {submissions.map(s => (
            <tr
              key={s.id}
              className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
            >
              <td className="py-2 pr-4 font-medium text-zinc-900 dark:text-zinc-100">{s.clave}</td>
              <td className="py-2 pr-4 text-zinc-600 dark:text-zinc-400">{s.edad}</td>
              <td className="py-2 pr-4 text-zinc-600 dark:text-zinc-400">{s.sexo}</td>
              <td className="py-2 pr-4 text-zinc-600 dark:text-zinc-400">{s.estadoCivil}</td>
              <td className="py-2 pr-4 text-zinc-600 dark:text-zinc-400">{s.profesion || '—'}</td>
              <td className="py-2 pr-4 text-zinc-500 dark:text-zinc-500 whitespace-nowrap">
                {new Date(s.createdAt).toLocaleString('es-ES', {
                  dateStyle: 'short',
                  timeStyle: 'short',
                })}
              </td>
              <td className="py-2">
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
  );
}
