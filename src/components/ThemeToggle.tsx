'use client';

import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import { useTheme } from './ThemeProvider';

export function ThemeToggle() {
  const { theme, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      className="fixed top-4 right-4 z-50 flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 bg-white/90 text-zinc-600 shadow-md backdrop-blur-sm transition-colors hover:bg-white hover:text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800/90 dark:text-zinc-400 dark:hover:bg-zinc-700 dark:hover:text-zinc-100"
    >
      {theme === 'dark'
        ? <SunIcon className="h-4 w-4" />
        : <MoonIcon className="h-4 w-4" />
      }
    </button>
  );
}
