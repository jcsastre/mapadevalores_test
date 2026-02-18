// src/lib/hartman/quick-test/types.ts
import type { WorldValues } from '@/lib/hartman/types/world-values';
import type { WorldRelationsValues } from '@/lib/hartman/types/world-relations-values';

export interface QuicktestRequest {
  clave: string;
  edad: string;
  sexo: string;
  estadoCivil: string;
  hijos: string;
  profesión: string;
  metodoInput: string;
  /** 36 values (ext+int) or 54 values (ext+int+sexual), each 1-18 */
  responses: number[];
}

export interface QuicktestResponse {
  externalWorldValues: WorldValues;
  internalWorldValues: WorldValues;
  sexualWorldValues: WorldValues | null;
  worldRelationsValues: WorldRelationsValues;
}
