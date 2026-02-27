'use client';

import { useState, useEffect, type ReactNode } from 'react';

const SESSION_KEY = 'admin_session';
const TTL = 30 * 24 * 60 * 60 * 1000;

interface StoredSession {
  password: string;
  expiry: number;
}

interface PasswordGateProps {
  children: (password: string) => ReactNode;
}

export function PasswordGate({ children }: PasswordGateProps) {
  const [input, setInput] = useState('');
  const [password, setPassword] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [remember, setRemember] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function restoreSession() {
      try {
        const raw = localStorage.getItem(SESSION_KEY);
        if (!raw) return;
        const session: StoredSession = JSON.parse(raw);
        if (Date.now() >= session.expiry) {
          localStorage.removeItem(SESSION_KEY);
          return;
        }
        const res = await fetch('/api/admin/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: session.password }),
        });
        if (res.ok) {
          setPassword(session.password);
        } else {
          localStorage.removeItem(SESSION_KEY);
        }
      } catch {
        // network error — fall through to show the form
      } finally {
        setChecking(false);
      }
    }
    restoreSession();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: input }),
      });

      if (res.ok) {
        if (remember) {
          const session: StoredSession = { password: input, expiry: Date.now() + TTL };
          localStorage.setItem(SESSION_KEY, JSON.stringify(session));
        }
        setPassword(input);
      } else {
        setError('Contraseña incorrecta');
        setInput('');
      }
    } catch {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-700 dark:border-zinc-600 dark:border-t-zinc-200" />
      </div>
    );
  }

  if (password !== null) {
    return <>{children(password)}</>;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
      >
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Acceso profesional
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Introduce la contraseña para continuar
          </p>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Contraseña
          </label>
          <input
            type="password"
            value={input}
            onChange={e => setInput(e.target.value)}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
            autoFocus
            required
          />
          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}
        </div>

        <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={remember}
            onChange={e => setRemember(e.target.checked)}
            className="rounded border-zinc-300 dark:border-zinc-600"
          />
          Recordar durante 30 días
        </label>

        <button
          type="submit"
          disabled={loading || !input}
          className="flex h-10 items-center justify-center rounded-lg bg-zinc-900 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {loading ? 'Verificando...' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}
