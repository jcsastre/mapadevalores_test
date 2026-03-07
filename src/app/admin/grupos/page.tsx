'use client';

import { usePassword } from '@/components/admin/usePassword';
import { GroupsManager } from '@/components/admin/GroupsManager';

export default function GruposPage() {
  const password = usePassword();
  if (!password) return null;

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        Grupos
      </h1>
      <GroupsManager password={password} />
    </div>
  );
}
