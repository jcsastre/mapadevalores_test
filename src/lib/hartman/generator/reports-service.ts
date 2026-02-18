import { calculateValues, calculateRelationValues } from '@/lib/hartman/world-calculator';
import { World } from '@/lib/hartman/domain/world';
import { generatePdf } from './pdf-generator';
import { generateWord } from './word-generator';
import { sendReportByEmail } from './email-service';
import type { QuicktestRequest } from '@/lib/hartman/quick-test/types';
import type { ReportType } from '@/lib/hartman/domain/report-type';
import type { WordType } from '@/lib/hartman/domain/word-type';

export function generateUniqueOutputFilename(clave: string): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm   = String(now.getMonth() + 1).padStart(2, '0');
  const dd   = String(now.getDate()).padStart(2, '0');
  const randomPart = crypto.randomUUID().substring(0, 8);
  return `${yyyy}_${mm}_${dd}_${clave}_${randomPart}`;
}

export async function generateAndSendReport(
  request: QuicktestRequest,
  responsesExternal: number[],
  responsesInternal: number[],
  responsesSexual: number[] | null,
  reportType: ReportType,
  wordType: WordType,
): Promise<void> {
  const externalWorldValues = calculateValues(World.EXTERNAL, responsesExternal);
  const internalWorldValues = calculateValues(World.INTERNAL, responsesInternal);
  const sexualWorldValues   = responsesSexual
    ? calculateValues(World.SEXUAL, responsesSexual)
    : null;

  const worldRelationsValues = calculateRelationValues(externalWorldValues, internalWorldValues);

  const baseName = generateUniqueOutputFilename(request.clave);

  const [pdfBytes, docxBuffer] = await Promise.all([
    generatePdf(request, externalWorldValues, internalWorldValues, sexualWorldValues, worldRelationsValues, reportType),
    generateWord(externalWorldValues, internalWorldValues, sexualWorldValues, worldRelationsValues, wordType, 3),
  ]);

  await sendReportByEmail(
    'Nuevo informe PVH generado',
    'Adjuntamos su informe PVH en PDF y Word.',
    Buffer.from(pdfBytes),
    `${baseName}.pdf`,
    docxBuffer,
    `${baseName}.docx`,
  );
}
