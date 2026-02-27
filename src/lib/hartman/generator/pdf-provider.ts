import type { QuicktestRequest } from '@/lib/hartman/quick-test/types';
import type { ReportType } from '@/lib/hartman/domain/report-type';
import type { WorldValues } from '@/lib/hartman/types/world-values';
import type { WorldRelationsValues } from '@/lib/hartman/types/world-relations-values';

export async function getPdfBytes(
  request: QuicktestRequest,
  responsesExternal: number[],
  responsesInternal: number[],
  responsesSexual: number[] | null,
  reportType: ReportType,
  externalWorldValues?: WorldValues,
  internalWorldValues?: WorldValues,
  sexualWorldValues?: WorldValues | null,
  worldRelationsValues?: WorldRelationsValues,
): Promise<Uint8Array> {
  const { generatePdf } = await import('./pdf-generator');
  return generatePdf(
    request,
    externalWorldValues!,
    internalWorldValues!,
    sexualWorldValues ?? null,
    worldRelationsValues!,
    reportType,
  );
}
