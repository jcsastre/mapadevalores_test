import { prisma } from '@/lib/prisma';
import { createLogger, logResponse } from '@/lib/logger';

const log = createLogger('admin-submit');

export async function POST(request: Request): Promise<Response> {
  let body: {
    password: string;
    clave: string;
    edad: string;
    sexo: string;
    estadoCivil: string;
    hijos: string;
    profesion: string;
    responses: number[];
    groupId?: number | null;
  };

  try {
    body = await request.json();
  } catch {
    logResponse(log, 400, 'JSON invalido');
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!process.env.ADMIN_PASSWORD || body.password !== process.env.ADMIN_PASSWORD) {
    logResponse(log, 401, 'Password incorrecto');
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { responses } = body;
  if (!responses || responses.length < 36) {
    logResponse(log, 400, 'Respuestas insuficientes', { recibidas: responses?.length ?? 0 });
    return new Response(JSON.stringify({ error: 'Se necesitan al menos 36 respuestas' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const submission = await prisma.testSubmission.create({
      data: {
        clave: body.clave,
        edad: body.edad,
        sexo: body.sexo,
        estadoCivil: body.estadoCivil,
        hijos: body.hijos,
        profesion: body.profesion,
        responses: JSON.stringify(responses),
        groupId: body.groupId ?? null,
      },
    });

    logResponse(log, 200, 'Test guardado', { id: submission.id, clave: body.clave });
    return new Response(JSON.stringify({ id: submission.id }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logResponse(log, 500, 'Error guardando test', { error: message });
    return new Response(JSON.stringify({ error: 'Error guardando el test' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
