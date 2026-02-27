import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/hartman/generator/pdf-provider', () => ({
  getPdfBytes: vi.fn().mockResolvedValue(new Uint8Array([0x25, 0x50, 0x44, 0x46])),
}));

import { generateUniqueOutputFilename, generateAndSendReport } from '@/lib/hartman/generator/reports-service';

const EXT = [4, 1, 18, 12, 17, 6, 5, 15, 7, 14, 16, 9, 8, 2, 11, 10, 3, 13];
const INT = [17, 13, 12, 9, 11, 7, 15, 18, 6, 1, 16, 3, 14, 4, 2, 10, 5, 8];
const REQ = { clave: 'Felicidad', sexo: 'F', edad: '35', estadoCivil: 'casada', hijos: '2', profesión: 'profesora', metodoInput: 'web', responses: [] };

describe('generateUniqueOutputFilename', () => {
  it('follows YYYY_MM_DD_clave_xxxxxxxx pattern', () => {
    const name = generateUniqueOutputFilename('TestClave');
    expect(name).toMatch(/^\d{4}_\d{2}_\d{2}_TestClave_[a-f0-9-]{8}$/);
  });
});

describe('generateAndSendReport', () => {
  it('generates PDF and Word without error', async () => {
    await expect(
      generateAndSendReport(REQ, EXT, INT, null, 'COMPLETE', 'COMPLETE')
    ).resolves.toBeUndefined();
  });
});
