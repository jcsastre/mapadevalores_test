import { prisma } from '@/lib/prisma';
import { createLogger, logResponse } from '@/lib/logger';

const log = createLogger('submissions');

function isAuthorized(request: Request): boolean {
  const auth = request.headers.get('Authorization') ?? '';
  const password = auth.replace('Bearer ', '');
  return !!process.env.ADMIN_PASSWORD && password === process.env.ADMIN_PASSWORD;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  if (!isAuthorized(request)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { id } = await params;
  const numId = parseInt(id, 10);
  if (isNaN(numId)) {
    return new Response(JSON.stringify({ error: 'Invalid id' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: { groupId: number | null };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const submission = await prisma.testSubmission.update({
    where: { id: numId },
    data: { groupId: body.groupId ?? null },
  });

  logResponse(log, 200, 'Grupo asignado', { submissionId: numId, groupId: body.groupId });
  return new Response(JSON.stringify(submission), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  if (!isAuthorized(request)) {
    logResponse(log, 401, 'Acceso no autorizado al borrado');
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { id } = await params;
  const numId = parseInt(id, 10);

  if (isNaN(numId)) {
    logResponse(log, 400, 'ID inválido', { id });
    return new Response(JSON.stringify({ error: 'Invalid id' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  await prisma.testSubmission.delete({ where: { id: numId } });

  logResponse(log, 200, 'Submission eliminado', { id: numId });
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
