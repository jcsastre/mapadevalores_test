import { prisma } from '@/lib/prisma';
import { createLogger, logResponse } from '@/lib/logger';

const log = createLogger('submissions');

function isAuthorized(request: Request): boolean {
  const auth = request.headers.get('Authorization') ?? '';
  const password = auth.replace('Bearer ', '');
  return !!process.env.ADMIN_PASSWORD && password === process.env.ADMIN_PASSWORD;
}

export async function GET(request: Request): Promise<Response> {
  if (!isAuthorized(request)) {
    logResponse(log, 401, 'Acceso no autorizado al listado');
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const submissions = await prisma.testSubmission.findMany({
    orderBy: { createdAt: 'desc' },
  });

  logResponse(log, 200, 'Listado devuelto', { total: submissions.length });
  return new Response(JSON.stringify(submissions), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
