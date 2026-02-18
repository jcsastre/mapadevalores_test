// tests/lib/hartman/quick-test/response-generator.test.ts
import { describe, it, expect } from 'vitest';
import { generateExplanations } from '@/lib/hartman/quick-test/response-generator';
import { calculateValues } from '@/lib/hartman/world-calculator';
import { getTextValuationByScoreSpanish } from '@/lib/hartman/domain/dimension';
import { World } from '@/lib/hartman/domain/world';
import { mapResponsesToStandardFormat } from '@/lib/hartman/quick-test/responses-mapper';

describe('generateExplanations', () => {
  it('returns 6 text valuations for external and internal worlds', () => {
    const responsesExternal = [5, 8, 3, 11, 12, 7, 18, 16, 10, 14, 2, 15, 1, 4, 13, 17, 6, 9];
    const responsesInternal = [6, 1, 10, 12, 13, 9, 17, 15, 16, 5, 8, 18, 4, 11, 3, 14, 2, 7];

    const result = generateExplanations(responsesExternal, responsesInternal);

    // Derive expected values using the same engine
    const mappedExt = mapResponsesToStandardFormat(responsesExternal);
    const mappedInt = mapResponsesToStandardFormat(responsesInternal);
    const extValues = calculateValues(World.EXTERNAL, mappedExt);
    const intValues = calculateValues(World.INTERNAL, mappedInt);

    expect(result).toHaveLength(6);
    expect(result[0]).toBe(getTextValuationByScoreSpanish(extValues.dimIValues.dimensionScore.value));
    expect(result[1]).toBe(getTextValuationByScoreSpanish(extValues.dimEValues.dimensionScore.value));
    expect(result[2]).toBe(getTextValuationByScoreSpanish(extValues.dimSValues.dimensionScore.value));
    expect(result[3]).toBe(getTextValuationByScoreSpanish(intValues.dimIValues.dimensionScore.value));
    expect(result[4]).toBe(getTextValuationByScoreSpanish(intValues.dimEValues.dimensionScore.value));
    expect(result[5]).toBe(getTextValuationByScoreSpanish(intValues.dimSValues.dimensionScore.value));
  });
});
