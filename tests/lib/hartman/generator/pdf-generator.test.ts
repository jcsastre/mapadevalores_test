import { describe, it, expect } from 'vitest';
import { generatePdf } from '@/lib/hartman/generator/pdf-generator';
import { calculateValues, calculateRelationValues } from '@/lib/hartman/world-calculator';
import { World } from '@/lib/hartman/domain/world';

const EXT = [4, 1, 18, 12, 17, 6, 5, 15, 7, 14, 16, 9, 8, 2, 11, 10, 3, 13];
const INT = [17, 13, 12, 9, 11, 7, 15, 18, 6, 1, 16, 3, 14, 4, 2, 10, 5, 8];
const REQ = { clave: 'Felicidad', sexo: 'F', edad: '35', estadoCivil: 'casada', hijos: '2', profesión: 'profesora', metodoInput: 'web', responses: [] };

describe('generatePdf', () => {
  it('returns valid PDF bytes for COMPLETE report', async () => {
    const ext = calculateValues(World.EXTERNAL, EXT);
    const int = calculateValues(World.INTERNAL, INT);
    const rel = calculateRelationValues(ext, int);

    const bytes = await generatePdf(REQ, ext, int, null, rel, 'COMPLETE');

    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(bytes.length).toBeGreaterThan(10_000);
    expect(Buffer.from(bytes.slice(0, 4)).toString()).toBe('%PDF');
  });

  it('returns valid PDF bytes for FIRST_PAGE report', async () => {
    const ext = calculateValues(World.EXTERNAL, EXT);
    const int = calculateValues(World.INTERNAL, INT);
    const rel = calculateRelationValues(ext, int);

    const bytes = await generatePdf(REQ, ext, int, null, rel, 'FIRST_PAGE');

    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(bytes.length).toBeGreaterThan(10_000);
    expect(Buffer.from(bytes.slice(0, 4)).toString()).toBe('%PDF');
  });
});
