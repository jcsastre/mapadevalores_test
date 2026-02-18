import { describe, it, expect } from 'vitest';
import { generateWord } from '@/lib/hartman/generator/word-generator';
import { calculateValues, calculateRelationValues } from '@/lib/hartman/world-calculator';
import { World } from '@/lib/hartman/domain/world';

const EXT = [4, 1, 18, 12, 17, 6, 5, 15, 7, 14, 16, 9, 8, 2, 11, 10, 3, 13];
const INT = [17, 13, 12, 9, 11, 7, 15, 18, 6, 1, 16, 3, 14, 4, 2, 10, 5, 8];

describe('generateWord', () => {
  it('generates DOCX buffer for SIMPLE word type', async () => {
    const ext = calculateValues(World.EXTERNAL, EXT);
    const int = calculateValues(World.INTERNAL, INT);
    const rel = calculateRelationValues(ext, int);

    const buf = await generateWord(ext, int, null, rel, 'SIMPLE', 3);

    expect(buf).toBeInstanceOf(Buffer);
    expect(buf.length).toBeGreaterThan(1000);
    // DOCX is a ZIP — starts with PK
    expect(buf.slice(0, 2).toString()).toBe('PK');
  });

  it('generates DOCX buffer for COMPLETE word type', async () => {
    const ext = calculateValues(World.EXTERNAL, EXT);
    const int = calculateValues(World.INTERNAL, INT);
    const rel = calculateRelationValues(ext, int);

    const buf = await generateWord(ext, int, null, rel, 'COMPLETE', 3);

    expect(buf).toBeInstanceOf(Buffer);
    expect(buf.length).toBeGreaterThan(1000);
    expect(buf.slice(0, 2).toString()).toBe('PK');
  });
});
