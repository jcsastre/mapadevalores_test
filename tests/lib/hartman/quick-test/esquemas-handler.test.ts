// tests/lib/hartman/quick-test/esquemas-handler.test.ts
import { describe, it, expect } from 'vitest';
import { getEstructura } from '@/lib/hartman/quick-test/esquemas-handler';

describe('getEstructura', () => {
  it('returns ME DIM_I Concreto Desbloqueado Estructura Desbloqueada', () => {
    const result = getEstructura('ME', 'DIM_I', 'Concreto Desbloqueado', 'Estructura Desbloqueada');
    expect(result).toBe('En las relaciones interpersonales tienes fluidez, buen manejo y objetividad.');
  });

  it('returns MI DIM_I Concreto Bloqueado Estructura Bloqueada Negativamente', () => {
    const result = getEstructura('MI', 'DIM_I', 'Concreto Bloqueado', 'Estructura Bloqueada Negativamente');
    expect(result).toBe('En autoestima estás bloqueada con cierta tendencia a desvalorarte.');
  });

  it('returns null for unknown section', () => {
    // @ts-expect-error testing invalid input
    const result = getEstructura('MX', 'DIM_I', 'Concreto Desbloqueado', 'Estructura Desbloqueada');
    expect(result).toBeNull();
  });
});
