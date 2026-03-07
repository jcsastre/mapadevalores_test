'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

interface Group {
  id: number;
  name: string;
  description: string | null;
  date: string | null;
  createdAt: string;
  _count: { tests: number };
}

interface GroupFormData {
  name: string;
  description: string;
  date: string;
}

const EMPTY_FORM: GroupFormData = { name: '', description: '', date: '' };

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-ES', { dateStyle: 'medium' });
}

export function GroupsManager({ password }: { password: string }) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<GroupFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const headers = { Authorization: `Bearer ${password}` };

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/groups', { headers });
      if (!res.ok) throw new Error();
      setGroups(await res.json());
    } catch {
      setError('No se pudieron cargar los grupos');
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [password]);

  useEffect(() => { load(); }, [load]);

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setShowForm(true);
  }

  function openEdit(group: Group) {
    setEditingId(group.id);
    setForm({
      name: group.name,
      description: group.description ?? '',
      date: group.date ? group.date.slice(0, 10) : '',
    });
    setFormError('');
    setShowForm(true);
  }

  function cancelForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError('');
  }

  async function handleSave() {
    if (!form.name.trim()) {
      setFormError('El nombre es obligatorio');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      const url = editingId ? `/api/admin/groups/${editingId}` : '/api/admin/groups';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        setFormError(data.error ?? 'Error guardando el grupo');
        return;
      }
      cancelForm();
      load();
    } catch {
      setFormError('Error de conexion');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(group: Group) {
    if (!confirm(`Eliminar el grupo "${group.name}"?\n\nLos tests asociados quedarán sin grupo.`)) return;
    try {
      const res = await fetch(`/api/admin/groups/${group.id}`, {
        method: 'DELETE',
        headers,
      });
      if (!res.ok) throw new Error();
      load();
    } catch {
      alert('Error al eliminar el grupo');
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header actions */}
      {!showForm && (
        <div className="flex justify-end">
          <button
            onClick={openCreate}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            + Nuevo grupo
          </button>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-4 text-base font-semibold text-zinc-800 dark:text-zinc-200">
            {editingId ? 'Editar grupo' : 'Nuevo grupo'}
          </h2>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Nombre <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Ej: Grupo Biodanza Marzo 2026"
                className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Descripcion <span className="text-zinc-400 font-normal">(opcional)</span>
              </label>
              <textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Contexto, objetivos, notas..."
                rows={3}
                className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 resize-none"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Fecha de sesion <span className="text-zinc-400 font-normal">(opcional)</span>
              </label>
              <input
                type="date"
                value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 w-48"
              />
            </div>

            {formError && (
              <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">
                {formError}
              </p>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
              >
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
              <button
                onClick={cancelForm}
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">
          {error}
          <button onClick={load} className="ml-3 underline">Reintentar</button>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex items-center gap-2 py-8 text-sm text-zinc-500">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-700 dark:border-zinc-600 dark:border-t-zinc-200" />
          Cargando grupos...
        </div>
      ) : groups.length === 0 && !error ? (
        <p className="py-8 text-center text-sm text-zinc-500">
          No hay grupos todavia. Crea el primero con el boton de arriba.
        </p>
      ) : !error && (
        <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 text-left text-xs uppercase tracking-wide text-zinc-500">
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Descripcion</th>
                <th className="px-4 py-3 whitespace-nowrap">Fecha sesion</th>
                <th className="px-4 py-3 text-center">Tests</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {groups.map(g => (
                <tr
                  key={g.id}
                  className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                >
                  <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">{g.name}</td>
                  <td className="px-4 py-3 text-zinc-500 max-w-xs truncate">{g.description || '—'}</td>
                  <td className="px-4 py-3 text-zinc-500 whitespace-nowrap">{formatDate(g.date)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center justify-center rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                      {g._count.tests}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 flex-wrap">
                      <Link
                        href={`/admin/tests?groupId=${g.id}`}
                        className="rounded-lg bg-zinc-900 px-3 py-1 text-xs font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300 whitespace-nowrap"
                      >
                        Ver tests
                      </Link>
                      <button
                        onClick={() => openEdit(g)}
                        className="rounded-lg border border-zinc-300 px-3 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(g)}
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
      )}
    </div>
  );
}
