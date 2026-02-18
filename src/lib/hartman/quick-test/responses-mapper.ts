// src/lib/hartman/quick-test/responses-mapper.ts

// Both tables below are a faithful port of the Java QuickTestResponsesMapper,
// which defines originalPositions and responsesMapping as separate data structures.
// In the Java source, responsesMapping.get(k) === originalPositions[k-1] for all k in 1..18.
// The apparent redundancy is intentional: both constants exist in the original Java source.
const ORIGINAL_POSITIONS = [6, 9, 10, 11, 13, 5, 17, 16, 12, 4, 1, 18, 2, 14, 8, 15, 3, 7];

const RESPONSES_MAPPING: Record<number, number> = {
  1: 6,  2: 9,  3: 10, 4: 11, 5: 13, 6: 5,
  7: 17, 8: 16, 9: 12, 10: 4, 11: 1, 12: 18,
  13: 2, 14: 14, 15: 8, 16: 15, 17: 3, 18: 7,
};

export function mapResponsesToStandardFormat(responses: number[]): number[] {
  const mapped = new Array<number>(18);
  for (let i = 0; i < 18; i++) {
    const originalPosition = ORIGINAL_POSITIONS[i];
    for (let j = 0; j < 18; j++) {
      if (RESPONSES_MAPPING[responses[j]] === originalPosition) {
        mapped[i] = j + 1;
        break;
      }
    }
  }
  return mapped;
}
