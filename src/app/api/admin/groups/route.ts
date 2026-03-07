import { prisma } from '@/lib/prisma';
import { createLogger, logResponse } from '@/lib/logger';

const log = createLogger('groups');

function isAuthorized(request: Request): boolean {
  const auth = request.headers.get('Authorization') ?? '';
  const password = auth.replace('Bearer ', '');
  return !!process.env.ADMIN_PASSWORD && password === process.env.ADMIN_PASSWORD;
}

export async function GET(request: Request): Promise<Response> {
  if (!isAuthorized(request)) {
    logResponse(log, 401, 'Acceso no autorizado');
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const groups = await prisma.group.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { tests: true } } },
  });

  logResponse(log, 200, 'Grupos listados', { total: groups.length });
  return new Response(JSON.stringify(groups), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function POST(request: Request): Promise<Response> {
  if (!isAuthorized(request)) {
    logResponse(log, 401, 'Acceso no autorizado');
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
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

  const group = await prisma.group.create({
    data: {
      name: body.name.trim(),
      description: body.description?.trim() || null,
      date: body.date ? new Date(body.date) : null,
    },
    include: { _count: { select: { tests: true } } },
  });

  logResponse(log, 201, 'Grupo creado', { id: group.id, name: group.name });
  return new Response(JSON.stringify(group), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
}
