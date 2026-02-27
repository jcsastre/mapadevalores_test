import { calculateValues, calculateRelationValues } from '@/lib/hartman/world-calculator';
import { World } from '@/lib/hartman/domain/world';
import { getPdfBytes } from './pdf-provider';
import { generateWord } from './word-generator';
import type { QuicktestRequest } from '@/lib/hartman/quick-test/types';
import type { ReportType } from '@/lib/hartman/domain/report-type';
import type { WordType } from '@/lib/hartman/domain/word-type';
import { createLogger } from '@/lib/logger';

const log = createLogger('reports');

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
  const { clave } = request;
  const mundos = responsesSexual ? 'Externo + Interno + Sexual' : 'Externo + Interno';

  log.info('Calculando valores axiológicos', { clave, mundos });
  const externalWorldValues = calculateValues(World.EXTERNAL, responsesExternal);
  const internalWorldValues = calculateValues(World.INTERNAL, responsesInternal);
  const sexualWorldValues   = responsesSexual
    ? calculateValues(World.SEXUAL, responsesSexual)
    : null;
  const worldRelationsValues = calculateRelationValues(externalWorldValues, internalWorldValues);

  const baseName = generateUniqueOutputFilename(clave);
  log.info('Generando documentos', { clave, archivo: baseName, reportType, wordType });

  const donePdf  = log.time('PDF generado', { clave });
  const doneWord = log.time('Word generado', { clave });

  await Promise.all([
    getPdfBytes(request, responsesExternal, responsesInternal, responsesSexual, reportType,
                externalWorldValues, internalWorldValues, sexualWorldValues, worldRelationsValues)
      .then(b => { donePdf(); return b; }),
    generateWord(externalWorldValues, internalWorldValues, sexualWorldValues, worldRelationsValues, wordType, 3)
      .then(b => { doneWord(); return b; }),
  ]);
}
