import { prisma } from '@/lib/prisma';
import { createLogger, logResponse } from '@/lib/logger';

const log = createLogger('submissions');

function isAuthorized(request: Request): boolean {
  const auth = request.headers.get('Authorization') ?? '';
  const password = auth.replace('Bearer ', '');
  return !!process.env.ADMIN_PASSWORD && password === process.env.ADMIN_PASSWORD;
}

const VALID_SORT_COLUMNS = ['clave', 'edad', 'sexo', 'estadoCivil', 'profesion', 'createdAt'] as const;
type SortColumn = typeof VALID_SORT_COLUMNS[number];

export async function GET(request: Request): Promise<Response> {
  if (!isAuthorized(request)) {
    logResponse(log, 401, 'Acceso no autorizado al listado');
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const url = new URL(request.url);
  const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(url.searchParams.get('pageSize') ?? '25', 10) || 25));
  const search = url.searchParams.get('search') ?? '';
  const sexo = url.searchParams.get('sexo') ?? '';
  const estadoCivil = url.searchParams.get('estadoCivil') ?? '';
  const profesion = url.searchParams.get('profesion') ?? '';
  const dateFrom = url.searchParams.get('dateFrom') ?? '';
  const dateTo = url.searchParams.get('dateTo') ?? '';
  const groupIdParam = url.searchParams.get('groupId') ?? '';
  const sortByParam = url.searchParams.get('sortBy') ?? 'createdAt';
  const sortBy: SortColumn = VALID_SORT_COLUMNS.includes(sortByParam as SortColumn)
    ? (sortByParam as SortColumn)
    : 'createdAt';
  const sortOrder = url.searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc';

  // Build where clause
  const where: Record<string, unknown> = {};

  if (search) {
    where.clave = { contains: search };
  }
  if (sexo) {
    where.sexo = sexo;
  }
  if (estadoCivil) {
    where.estadoCivil = estadoCivil;
  }
  if (profesion) {
    where.profesion = { contains: profesion };
  }
  if (dateFrom || dateTo) {
    const createdAt: Record<string, Date> = {};
    if (dateFrom) {
      createdAt.gte = new Date(dateFrom);
    }
    if (dateTo) {
      // Include the full day
      const endDate = new Date(dateTo);
      endDate.setDate(endDate.getDate() + 1);
      createdAt.lt = endDate;
    }
    where.createdAt = createdAt;
  }
  if (groupIdParam === 'none') {
    where.groupId = null;
  } else if (groupIdParam) {
    const gId = parseInt(groupIdParam, 10);
    if (!isNaN(gId)) where.groupId = gId;
  }

  const [data, total] = await Promise.all([
    prisma.testSubmission.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { group: { select: { id: true, name: true } } },
    }),
    prisma.testSubmission.count({ where }),
  ]);

  logResponse(log, 200, 'Listado devuelto', { total, page, pageSize });
  return new Response(JSON.stringify({ data, total, page, pageSize }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
