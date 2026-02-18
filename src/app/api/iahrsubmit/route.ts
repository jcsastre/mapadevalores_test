import { generateAndSendReport } from '@/lib/hartman/generator/reports-service';
import type { QuicktestRequest } from '@/lib/hartman/quick-test/types';

export async function POST(request: Request): Promise<Response> {
  let body: QuicktestRequest;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { responses } = body;

  if (!responses || responses.length < 36) {
    return new Response(JSON.stringify({ error: 'Invalid number of responses' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const responsesExternal = responses.slice(0, 18);
  const responsesInternal = responses.slice(18, 36);
  const responsesSexual   = responses.length >= 54 ? responses.slice(36, 54) : null;

  try {
    await generateAndSendReport(body, responsesExternal, responsesInternal, responsesSexual, 'COMPLETE', 'COMPLETE');
    return new Response(JSON.stringify({ message: 'ok' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: `Report generation error: ${message}` }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
