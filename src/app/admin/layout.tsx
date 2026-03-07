'use client';

import { Suspense } from 'react';
import { PasswordGate } from '@/components/PasswordGate';
import { AdminShell } from '@/components/admin/AdminShell';
import { PasswordContext } from '@/components/admin/usePassword';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense>
      <PasswordGate>
        {(password) => (
          <PasswordContext.Provider value={password}>
            <AdminShell>
              {children}
            </AdminShell>
          </PasswordContext.Provider>
        )}
      </PasswordGate>
    </Suspense>
  );
}
