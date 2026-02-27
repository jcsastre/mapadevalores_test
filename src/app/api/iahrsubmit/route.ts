import { generateAndSendReport } from '@/lib/hartman/generator/reports-service';
import type { QuicktestRequest } from '@/lib/hartman/quick-test/types';
import { prisma } from '@/lib/prisma';
import { createLogger, logResponse } from '@/lib/logger';

const log = createLogger('iahrsubmit');

export async function POST(request: Request): Promise<Response> {
  log.info('Solicitud recibida');

  let body: QuicktestRequest;
  try {
    body = await request.json();
  } catch {
    logResponse(log, 400, 'JSON inválido');
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { responses } = body;
  const mundos = responses?.length >= 54 ? 'EIS' : responses?.length >= 36 ? 'EI' : '?';

  log.info('Test recibido', {
    clave:       body.clave,
    edad:        body.edad,
    sexo:        body.sexo,
    estadoCivil: body.estadoCivil,
    mundos,
    nRespuestas: responses?.length ?? 0,
  });

  if (!responses || responses.length < 36) {
    logResponse(log, 400, 'Número de respuestas insuficiente', { recibidas: responses?.length ?? 0, mínimo: 36 });
    return new Response(JSON.stringify({ error: 'Invalid number of responses' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  log.info('Guardando en BD', { clave: body.clave });
  await prisma.testSubmission.create({
    data: {
      clave:       body.clave,
      edad:        body.edad,
      sexo:        body.sexo,
      estadoCivil: body.estadoCivil,
      hijos:       body.hijos,
      profesion:   body.profesión,
      responses:   JSON.stringify(responses),
    },
  });
  log.info('Guardado en BD ✓', { clave: body.clave });

  const responsesExternal = responses.slice(0, 18);
  const responsesInternal = responses.slice(18, 36);
  const responsesSexual   = responses.length >= 54 ? responses.slice(36, 54) : null;

  const done = log.time('Pipeline completado', { clave: body.clave });
  try {
    await generateAndSendReport(body, responsesExternal, responsesInternal, responsesSexual, 'COMPLETE', 'COMPLETE');
    done();
    logResponse(log, 200, 'OK', { clave: body.clave });
    return new Response(JSON.stringify({ message: 'ok' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logResponse(log, 400, 'Error en generación de informe', { clave: body.clave, error: message });
    return new Response(JSON.stringify({ error: `Report generation error: ${message}` }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
