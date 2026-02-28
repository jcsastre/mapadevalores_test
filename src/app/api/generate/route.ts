import { calculateValues, calculateRelationValues } from '@/lib/hartman/world-calculator';
import { World } from '@/lib/hartman/domain/world';
import { getPdfBytes } from '@/lib/hartman/generator/pdf-provider';
import { generateWord } from '@/lib/hartman/generator/word-generator';
import { generateUniqueOutputFilename } from '@/lib/hartman/generator/reports-service';
import type { QuicktestRequest } from '@/lib/hartman/quick-test/types';
import type { ReportType } from '@/lib/hartman/domain/report-type';
import type { WordType } from '@/lib/hartman/domain/word-type';
import { createLogger, logResponse } from '@/lib/logger';

const log = createLogger('generate');

interface GenerateRequest {
  password: string;
  request: QuicktestRequest;
  reportType: ReportType;
  wordType: WordType;
}

export async function POST(req: Request): Promise<Response> {
  let body: GenerateRequest;
  try {
    body = await req.json();
  } catch {
    logResponse(log, 400, 'JSON inválido');
    return json({ error: 'Invalid JSON' }, 400);
  }

  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    logResponse(log, 500, 'ADMIN_PASSWORD no configurado');
    return json({ error: 'ADMIN_PASSWORD not configured' }, 500);
  }

  if (body.password !== adminPassword) {
    logResponse(log, 401, 'Contraseña incorrecta');
    return json({ error: 'Unauthorized' }, 401);
  }

  const { request, reportType = 'COMPLETE', wordType = 'FOR_JC' } = body;
  const { responses } = request;
  const mundos = responses?.length >= 54 ? 'EIS' : 'EI';

  log.info('Generando informe (admin)', {
    clave:      request.clave,
    mundos,
    reportType,
    wordType,
  });

  if (!responses || responses.length < 36) {
    logResponse(log, 400, 'Respuestas insuficientes', { recibidas: responses?.length ?? 0 });
    return json({ error: 'Invalid number of responses' }, 400);
  }

  const responsesExternal = responses.slice(0, 18);
  const responsesInternal = responses.slice(18, 36);
  const responsesSexual   = responses.length >= 54 ? responses.slice(36, 54) : null;

  const done = log.time('Informe generado', { clave: request.clave });
  try {
    const externalWorldValues = calculateValues(World.EXTERNAL, responsesExternal);
    const internalWorldValues = calculateValues(World.INTERNAL, responsesInternal);
    const sexualWorldValues   = responsesSexual
      ? calculateValues(World.SEXUAL, responsesSexual)
      : null;
    const worldRelationsValues = calculateRelationValues(externalWorldValues, internalWorldValues);

    const baseName = generateUniqueOutputFilename(request.clave);

    const donePdf  = log.time('PDF listo', { clave: request.clave });
    const doneWord = log.time('Word listo', { clave: request.clave });

    const [pdfBytes, docxBuffer] = await Promise.all([
      getPdfBytes(
        request, responsesExternal, responsesInternal, responsesSexual, reportType,
        externalWorldValues, internalWorldValues, sexualWorldValues, worldRelationsValues,
      ).then(b => { donePdf(); return b; }),
      generateWord(externalWorldValues, internalWorldValues, sexualWorldValues, worldRelationsValues, wordType, 3)
        .then(b => { doneWord(); return b; }),
    ]);

    done();
    logResponse(log, 200, 'Descarga lista', {
      clave:    request.clave,
      archivo:  baseName,
      pdfKB:    Math.round(pdfBytes.length / 1024),
      wordKB:   Math.round(docxBuffer.length / 1024),
    });

    return new Response(
      JSON.stringify({
        pdf:      Buffer.from(pdfBytes).toString('base64'),
        word:     docxBuffer.toString('base64'),
        json:     Buffer.from(JSON.stringify(request, null, 2)).toString('base64'),
        filename: baseName,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logResponse(log, 500, 'Error de generación', { clave: request.clave, error: message });
    return json({ error: `Generation failed: ${message}` }, 500);
  }
}

function json(body: object, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
