// src/lib/hartman/quick-test/response-generator.ts
import { mapResponsesToStandardFormat } from './responses-mapper';
import { calculateValues } from '@/lib/hartman/world-calculator';
import { getTextValuationByScoreSpanish } from '@/lib/hartman/domain/dimension';
import { World } from '@/lib/hartman/domain/world';

export function generateExplanations(
  responsesExternal: number[],
  responsesInternal: number[],
): string[] {
  const mappedExternal = mapResponsesToStandardFormat(responsesExternal);
  const mappedInternal = mapResponsesToStandardFormat(responsesInternal);

  const externalValues = calculateValues(World.EXTERNAL, mappedExternal);
  const internalValues = calculateValues(World.INTERNAL, mappedInternal);

  return [
    getTextValuationByScoreSpanish(externalValues.dimIValues.dimensionScore.value),
    getTextValuationByScoreSpanish(externalValues.dimEValues.dimensionScore.value),
    getTextValuationByScoreSpanish(externalValues.dimSValues.dimensionScore.value),
    getTextValuationByScoreSpanish(internalValues.dimIValues.dimensionScore.value),
    getTextValuationByScoreSpanish(internalValues.dimEValues.dimensionScore.value),
    getTextValuationByScoreSpanish(internalValues.dimSValues.dimensionScore.value),
  ];
}
