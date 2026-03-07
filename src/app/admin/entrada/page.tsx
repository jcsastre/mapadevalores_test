'use client';

import { useSearchParams } from 'next/navigation';
import { AdminForm } from '@/components/admin/AdminForm';
import { usePassword } from '@/components/admin/usePassword';

export default function EntradaPage() {
  const password = usePassword();
  const searchParams = useSearchParams();
  const isAutofillEnabled = searchParams.get('qa') === '1';

  if (!password) return null;

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        Entrada manual
      </h1>
      <AdminForm password={password} isAutofillEnabled={isAutofillEnabled} />
    </div>
  );
}
