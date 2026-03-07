'use client';

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export function Pagination({ page, pageSize, total, onPageChange, onPageSizeChange }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 text-sm">
      <span className="text-zinc-500 dark:text-zinc-400">
        {total === 0
          ? 'Sin resultados'
          : `Mostrando ${from}-${to} de ${total} tests`}
      </span>

      <div className="flex items-center gap-3">
        <select
          value={pageSize}
          onChange={e => onPageSizeChange(Number(e.target.value))}
          className="rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
        >
          {PAGE_SIZE_OPTIONS.map(size => (
            <option key={size} value={size}>{size} / pag</option>
          ))}
        </select>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(1)}
            disabled={page <= 1}
            className="rounded-md px-2 py-1.5 text-zinc-600 hover:bg-zinc-100 disabled:opacity-30 disabled:hover:bg-transparent dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            &laquo;
          </button>
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="rounded-md px-2 py-1.5 text-zinc-600 hover:bg-zinc-100 disabled:opacity-30 disabled:hover:bg-transparent dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            &lsaquo;
          </button>
          <span className="px-3 py-1.5 text-zinc-700 dark:text-zinc-300">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="rounded-md px-2 py-1.5 text-zinc-600 hover:bg-zinc-100 disabled:opacity-30 disabled:hover:bg-transparent dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            &rsaquo;
          </button>
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={page >= totalPages}
            className="rounded-md px-2 py-1.5 text-zinc-600 hover:bg-zinc-100 disabled:opacity-30 disabled:hover:bg-transparent dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            &raquo;
          </button>
        </div>
      </div>
    </div>
  );
}
