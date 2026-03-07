'use client';

import { useSearchParams } from 'next/navigation';
import { SubmissionsTable } from '@/components/admin/SubmissionsTable';
import { usePassword } from '@/components/admin/usePassword';

export default function TestsPage() {
  const password = usePassword();
  const searchParams = useSearchParams();
  const groupId = searchParams.get('groupId') ?? '';

  if (!password) return null;

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        Tests recibidos
      </h1>
      <SubmissionsTable password={password} initialGroupId={groupId} />
    </div>
  );
}
