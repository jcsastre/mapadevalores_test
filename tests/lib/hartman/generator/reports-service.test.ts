import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/hartman/generator/email-service', () => ({
  sendReportByEmail: vi.fn().mockResolvedValue(undefined),
}));

import { generateUniqueOutputFilename, generateAndSendReport } from '@/lib/hartman/generator/reports-service';
import { sendReportByEmail } from '@/lib/hartman/generator/email-service';
import { World } from '@/lib/hartman/domain/world';

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
  it('calls sendReportByEmail with PDF and DOCX buffers', async () => {
    await generateAndSendReport(REQ, EXT, INT, null, 'COMPLETE', 'COMPLETE');

    expect(sendReportByEmail).toHaveBeenCalledOnce();
    const [subject, body, pdfBuf, pdfName, docxBuf, docxName] = (sendReportByEmail as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(pdfBuf).toBeInstanceOf(Buffer);
    expect(docxBuf).toBeInstanceOf(Buffer);
    expect(pdfName).toMatch(/\.pdf$/);
    expect(docxName).toMatch(/\.docx$/);
  });
});
