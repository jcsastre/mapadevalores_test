import { calculateValues, calculateRelationValues } from '@/lib/hartman/world-calculator';
import { World } from '@/lib/hartman/domain/world';
import type { QuicktestRequest, QuicktestResponse } from '@/lib/hartman/quick-test/types';

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
  const responsesSexual = responses.length >= 54 ? responses.slice(36, 54) : null;

  try {
    const externalWorldValues = calculateValues(World.EXTERNAL, responsesExternal);
    const internalWorldValues = calculateValues(World.INTERNAL, responsesInternal);
    const sexualWorldValues = responsesSexual
      ? calculateValues(World.SEXUAL, responsesSexual)
      : null;

    const worldRelationsValues = calculateRelationValues(externalWorldValues, internalWorldValues);

    const responseBody: QuicktestResponse = {
      externalWorldValues,
      internalWorldValues,
      sexualWorldValues,
      worldRelationsValues,
    };

    return new Response(JSON.stringify(responseBody), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: `Calculation error: ${message}` }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
