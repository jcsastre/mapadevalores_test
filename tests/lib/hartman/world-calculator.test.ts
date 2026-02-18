import { describe, it, expect } from 'vitest';
import { calculateValues } from '@/lib/hartman/world-calculator';
import { World } from '@/lib/hartman/domain/world';
import { RemarkableInteger } from '@/lib/hartman/types/remarkable-integer';
import { DimensionScores } from '@/lib/hartman/types/dimension-scores';

function ri(value: number, remarked: boolean): RemarkableInteger {
  return { value, remarked };
}

function assertWorldValuesEqual(
  actual: ReturnType<typeof calculateValues>,
  expected: {
    remarkableResponses: RemarkableInteger[];
    remarkableDiffs: RemarkableInteger[];
    intCells: number[];
    dimIValues: DimensionScores;
    dimEValues: DimensionScores;
    dimSValues: DimensionScores;
    difScore: RemarkableInteger;
    dimScore: number;
    intScore: number;
    distorsionsCount: RemarkableInteger;
    dimPerc: RemarkableInteger;
    intPerc: RemarkableInteger;
    q1: number;
    q2: number;
    diScore: RemarkableInteger;
    aiPerc: RemarkableInteger;
    positivesTotal: number;
    negativesTotal: number;
  },
) {
  expect(actual.remarkableResponses).toEqual(expected.remarkableResponses);
  expect(actual.remarkableDiffs).toEqual(expected.remarkableDiffs);
  expect(actual.intCells).toEqual(expected.intCells);
  expect(actual.dimIValues).toEqual(expected.dimIValues);
  expect(actual.dimEValues).toEqual(expected.dimEValues);
  expect(actual.dimSValues).toEqual(expected.dimSValues);
  expect(actual.difScore).toEqual(expected.difScore);
  expect(actual.dimScore).toBe(expected.dimScore);
  expect(actual.intScore).toBe(expected.intScore);
  expect(actual.distorsionsCount).toEqual(expected.distorsionsCount);
  expect(actual.dimPerc).toEqual(expected.dimPerc);
  expect(actual.intPerc).toEqual(expected.intPerc);
  expect(actual.q1).toBe(expected.q1);
  expect(actual.q2).toBe(expected.q2);
  expect(actual.diScore).toEqual(expected.diScore);
  expect(actual.aiPerc).toEqual(expected.aiPerc);
  expect(actual.positivesTotal).toBe(expected.positivesTotal);
  expect(actual.negativesTotal).toBe(expected.negativesTotal);
}

describe('WorldCalculator', () => {
  it('testCalculateValuesExternalWorldFelicidad', () => {
    const responses = [6, 5, 11, 12, 14, 3, 16, 15, 13, 7, 2, 18, 1, 10, 8, 17, 4, 9];

    const actual = calculateValues(World.EXTERNAL, responses);

    assertWorldValuesEqual(actual, {
      remarkableResponses: responses.map(r => ri(r, false)),
      remarkableDiffs: [
        ri(0, false), ri(4, true), ri(1, false), ri(1, false), ri(1, false), ri(2, false),
        ri(-1, false), ri(-1, false), ri(1, false), ri(-3, true), ri(-1, false), ri(0, false),
        ri(1, false), ri(-4, true), ri(0, false), ri(2, false), ri(-1, false), ri(-2, false),
      ],
      intCells: [0, 2, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 2, 0, 0, 0, 0],
      dimIValues: { dimensionScore: ri(12, false), integrationScore: 3, positivesCount: 4, negativesCount: 8, positivesNegativesNet: ri(-4, true) },
      dimEValues: { dimensionScore: ri(4, false), integrationScore: 0, positivesCount: 3, negativesCount: 1, positivesNegativesNet: ri(2, false) },
      dimSValues: { dimensionScore: ri(10, false), integrationScore: 2, positivesCount: 6, negativesCount: 4, positivesNegativesNet: ri(2, false) },
      difScore: ri(26, false),
      dimScore: 10,
      intScore: 5,
      distorsionsCount: ri(0, false),
      dimPerc: ri(38, false),
      intPerc: ri(19, false),
      q1: 41,
      q2: 15,
      diScore: ri(4, false),
      aiPerc: ri(50, false),
      positivesTotal: 13,
      negativesTotal: 13,
    });
  });

  it('testCalculateValuesInternalWorldFelicidad', () => {
    const responses = [6, 1, 15, 12, 10, 3, 13, 16, 14, 8, 4, 17, 9, 18, 5, 11, 2, 7];

    const actual = calculateValues(World.INTERNAL, responses);

    assertWorldValuesEqual(actual, {
      remarkableResponses: responses.map(r => ri(r, false)),
      remarkableDiffs: [
        ri(0, false), ri(8, true), ri(5, true), ri(1, false), ri(-3, false), ri(2, false),
        ri(-4, false), ri(0, false), ri(2, false), ri(-4, false), ri(-3, false), ri(-1, false),
        ri(-7, true), ri(4, false), ri(3, false), ri(-4, false), ri(1, false), ri(0, false),
      ],
      intCells: [0, 6, 3, 0, 1, 0, 2, 0, 0, 2, 1, 0, 5, 2, 1, 2, 0, 0],
      dimIValues: { dimensionScore: ri(18, true), integrationScore: 7, positivesCount: 6, negativesCount: 12, positivesNegativesNet: ri(-6, true) },
      dimEValues: { dimensionScore: ri(18, true), integrationScore: 9, positivesCount: 4, negativesCount: 14, positivesNegativesNet: ri(-10, true) },
      dimSValues: { dimensionScore: ri(16, true), integrationScore: 9, positivesCount: 16, negativesCount: 0, positivesNegativesNet: ri(16, true) },
      difScore: ri(52, true),
      dimScore: 2,
      intScore: 25,
      distorsionsCount: ri(0, false),
      dimPerc: ri(4, false),
      intPerc: ri(48, true),
      q1: 79,
      q2: 27,
      diScore: ri(2, false),
      aiPerc: ri(50, false),
      positivesTotal: 26,
      negativesTotal: 26,
    });
  });

  it('testCalculateValuesSexualWorldFelicidad', () => {
    const responses = [13, 8, 9, 10, 14, 7, 16, 12, 11, 1, 2, 18, 3, 15, 6, 17, 4, 5];

    const actual = calculateValues(World.SEXUAL, responses);

    assertWorldValuesEqual(actual, {
      remarkableResponses: [
        ri(13, true), ri(8, false), ri(9, true), ri(10, false), ri(14, false), ri(7, false),
        ri(16, false), ri(12, false), ri(11, false), ri(1, false), ri(2, false), ri(18, false),
        ri(3, false), ri(15, false), ri(6, false), ri(17, false), ri(4, false), ri(5, false),
      ],
      remarkableDiffs: [
        ri(-7, true), ri(1, false), ri(-1, false), ri(-1, false), ri(1, false), ri(-2, false),
        ri(-1, false), ri(-4, false), ri(-1, false), ri(3, false), ri(-1, false), ri(0, false),
        ri(-1, false), ri(1, false), ri(2, false), ri(2, false), ri(-1, false), ri(2, false),
      ],
      intCells: [5, 0, 0, 0, 0, 0, 0, 2, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0],
      dimIValues: { dimensionScore: ri(9, false), integrationScore: 1, positivesCount: 6, negativesCount: 3, positivesNegativesNet: ri(3, false) },
      dimEValues: { dimensionScore: ri(13, false), integrationScore: 5, positivesCount: 3, negativesCount: 10, positivesNegativesNet: ri(-7, true) },
      dimSValues: { dimensionScore: ri(10, false), integrationScore: 2, positivesCount: 3, negativesCount: 7, positivesNegativesNet: ri(-4, true) },
      difScore: ri(32, false),
      dimScore: 7,
      intScore: 8,
      distorsionsCount: ri(2, true),
      dimPerc: ri(22, false),
      intPerc: ri(25, false),
      q1: 49,
      q2: 17,
      diScore: ri(7, false),
      aiPerc: ri(63, false),
      positivesTotal: 12,
      negativesTotal: 20,
    });
  });
});
