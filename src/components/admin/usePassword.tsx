'use client';

import { createContext, useContext } from 'react';

export const PasswordContext = createContext<string | null>(null);

export function usePassword(): string | null {
  return useContext(PasswordContext);
}
