// tests/lib/hartman/quick-test/responses-mapper.test.ts
import { describe, it, expect } from 'vitest';
import { mapResponsesToStandardFormat } from '@/lib/hartman/quick-test/responses-mapper';

describe('mapResponsesToStandardFormat', () => {
  it('maps correctly for Guillem ME', () => {
    const responses = [13, 11, 1, 6, 10, 17, 2, 3, 5, 18, 15, 4, 14, 9, 16, 8, 12, 7];
    const expected  = [3,  7,  8, 12, 9,  4,  18, 16, 14, 5,  2,  17, 1,  13, 11, 15, 6,  10];
    expect(mapResponsesToStandardFormat(responses)).toEqual(expected);
  });

  it('maps correctly for Eveline MI', () => {
    const responses = [2,  11, 17, 6, 1,  15, 10, 18, 13, 4,  5,  16, 3,  14, 9,  8, 7,  12];
    const expected  = [5,  1,  13, 10, 11, 4,  17, 16, 15, 7,  2,  18, 9,  14, 6,  12, 3,  8];
    expect(mapResponsesToStandardFormat(responses)).toEqual(expected);
  });
});
