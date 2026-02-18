// src/lib/hartman/quick-test/esquemas-handler.ts
import esquemas from './esquemas.json';

export type WorldKey = 'ME' | 'MI';
export type DimensionKey = 'DIM_I' | 'DIM_E' | 'DIM_S';
export type ConcretoType = 'Concreto Desbloqueado' | 'Concreto Bloqueado';
export type EstructuraType =
  | 'Estructura Desbloqueada'
  | 'Estructura Bloqueada Negativamente'
  | 'Estructura Bloqueada Positivamente';

type EsquemasJson = {
  [world in WorldKey]: {
    [dim in DimensionKey]: {
      [concreto in ConcretoType]: {
        [estructura in EstructuraType]: string;
      };
    };
  };
};

const data = esquemas as EsquemasJson;

export function getEstructura(
  section: WorldKey,
  dimension: DimensionKey,
  concretoType: ConcretoType,
  estructuraType: EstructuraType,
): string | null {
  const worldData = data[section];
  if (!worldData) return null;
  const dim = worldData[dimension];
  if (!dim) return null;
  const concreto = dim[concretoType];
  if (!concreto) return null;
  return concreto[estructuraType] ?? null;
}
