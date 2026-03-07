import { prisma } from '@/lib/prisma';
import { createLogger, logResponse } from '@/lib/logger';

const log = createLogger('groups');

function isAuthorized(request: Request): boolean {
  const auth = request.headers.get('Authorization') ?? '';
  const password = auth.replace('Bearer ', '');
  return !!process.env.ADMIN_PASSWORD && password === process.env.ADMIN_PASSWORD;
}

function parseId(id: string): number | null {
  const n = parseInt(id, 10);
  return isNaN(n) ? null : n;
}

export async function GET(
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
  const numId = parseId(id);
  if (!numId) {
    return new Response(JSON.stringify({ error: 'Invalid id' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const group = await prisma.group.findUnique({
    where: { id: numId },
    include: { _count: { select: { tests: true } } },
  });

  if (!group) {
    return new Response(JSON.stringify({ error: 'Grupo no encontrado' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify(group), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function PUT(
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
  const numId = parseId(id);
  if (!numId) {
    return new Response(JSON.stringify({ error: 'Invalid id' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: { name: string; description?: string; date?: string };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!body.name?.trim()) {
    return new Response(JSON.stringify({ error: 'El nombre es obligatorio' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const group = await prisma.group.update({
    where: { id: numId },
    data: {
      name: body.name.trim(),
      description: body.description?.trim() || null,
      date: body.date ? new Date(body.date) : null,
    },
    include: { _count: { select: { tests: true } } },
  });

  logResponse(log, 200, 'Grupo actualizado', { id: numId });
  return new Response(JSON.stringify(group), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function DELETE(
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
  const numId = parseId(id);
  if (!numId) {
    return new Response(JSON.stringify({ error: 'Invalid id' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Desvincula los tests antes de eliminar el grupo
  await prisma.testSubmission.updateMany({
    where: { groupId: numId },
    data: { groupId: null },
  });

  await prisma.group.delete({ where: { id: numId } });

  logResponse(log, 200, 'Grupo eliminado', { id: numId });
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
