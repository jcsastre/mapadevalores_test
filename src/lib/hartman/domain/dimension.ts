export const Dimension = {
  INTRINSIC: 'INTRINSIC',
  EXTRINSIC: 'EXTRINSIC',
  SISTEMIC: 'SISTEMIC',
} as const;

export type DimensionType = (typeof Dimension)[keyof typeof Dimension];

const dimensionMeta: Record<DimensionType, { largeName: string; shortName: string; letter: string }> = {
  INTRINSIC: { largeName: 'Dimensión Intrínseca', shortName: 'DIM-I', letter: 'I' },
  EXTRINSIC: { largeName: 'Dimensión Extrínseca', shortName: 'DIM-E', letter: 'E' },
  SISTEMIC: { largeName: 'Dimensión Sistémica', shortName: 'DIM-S', letter: 'S' },
};

export function getDimensionLargeName(dim: DimensionType): string {
  return dimensionMeta[dim].shortName; // Note: Java getLargeName() returns shortName (bug preserved)
}

export function getDimensionShortName(dim: DimensionType): string {
  return dimensionMeta[dim].shortName;
}

export function getDimensionLetter(dim: DimensionType): string {
  return dimensionMeta[dim].letter;
}

export function getDimensionTranslatedName(dim: DimensionType): string {
  if (dim === Dimension.INTRINSIC) return 'Intrínseco';
  if (dim === Dimension.EXTRINSIC) return 'Extrínseco';
  return 'Sistémico';
}

export const DIM_I_CELLS_POSITIONS: number[] = [5, 9, 10, 11, 13, 15];
export const DIM_E_CELLS_POSITIONS: number[] = [0, 3, 4, 6, 12, 14];
export const DIM_S_CELLS_POSITIONS: number[] = [1, 2, 7, 8, 16, 17];

export function getDimensionByCellPosition(position: number): DimensionType {
  if (DIM_I_CELLS_POSITIONS.includes(position)) return Dimension.INTRINSIC;
  if (DIM_E_CELLS_POSITIONS.includes(position)) return Dimension.EXTRINSIC;
  return Dimension.SISTEMIC;
}

export function getTextValuationByScoreSpanish(score: number): string {
  if (score >= 0 && score <= 5) return 'Excelente';
  if (score >= 6 && score <= 9) return 'Muy bien';
  if (score >= 10 && score <= 14) return 'Bien';
  if (score >= 15 && score <= 19) return 'Bloqueo ligero';
  if (score >= 20 && score <= 28) return 'Bloqueo alto';
  if (score >= 29 && score <= 35) return 'Bloqueo muy alto';
  return 'Bloqueo severo';
}

export function getAiPercValuationByScoreSpanish(score: number): string {
  if (score >= 50 && score <= 53) return 'Excelente, una persona positiva, dinámica';
  if (score >= 54 && score <= 57) return 'Muy buena, la persona es apreciativa, de mente abierta y está satisfecha';
  if (score >= 58 && score <= 61) return 'Buena, la persona está un poco dudosa, tolera de manera cautelosa';
  if (score >= 62 && score <= 65) return 'Regular, la persona duda, es tímida, preocupada y reacia';
  if (score >= 66 && score <= 69) return 'Pobre, la persona es resistente, aprensiva, suspicaz, enojada y está triste';
  if (score >= 70 && score <= 73) return 'Muy Pobre, inicia depresión, la persona siente miedo por el futuro y se ha empezado a paralizar';
  if (score >= 74 && score <= 99) return 'Extremadamente pobre, la actitud es de una persona deprimida con enojo y hostilidad';
  return 'Se recomienda explorar con un psiquiatra para que eventualmente la persona tome algún tipo de antidepresivo';
}
