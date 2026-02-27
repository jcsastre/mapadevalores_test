import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/hartman/generator/reports-service', () => ({
  generateAndSendReport: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    testSubmission: {
      create: vi.fn().mockResolvedValue({}),
    },
  },
}));

import { POST } from '@/app/api/iahrsubmit/route';
import { generateAndSendReport } from '@/lib/hartman/generator/reports-service';

describe('POST /api/iahrsubmit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 when responses are missing', async () => {
    const request = new Request('http://localhost/api/iahrsubmit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clave: 'test', responses: [] }),
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('returns 200 and calls generateAndSendReport for 36 valid responses', async () => {
    const responsesExternal = [4, 1, 18, 12, 17, 6, 5, 15, 7, 14, 16, 9, 8, 2, 11, 10, 3, 13];
    const responsesInternal = [17, 13, 12, 9, 11, 7, 15, 18, 6, 1, 16, 3, 14, 4, 2, 10, 5, 8];

    const request = new Request('http://localhost/api/iahrsubmit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clave: 'Felicidad', edad: '35', sexo: 'F', estadoCivil: 'casada',
        hijos: '2', profesión: 'profesora', metodoInput: 'web',
        responses: [...responsesExternal, ...responsesInternal],
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body).toHaveProperty('message', 'ok');
    expect(generateAndSendReport).toHaveBeenCalledOnce();
  });

  it('returns 200 with sexual world when 54 responses provided', async () => {
    const responsesExternal = [4, 1, 18, 12, 17, 6, 5, 15, 7, 14, 16, 9, 8, 2, 11, 10, 3, 13];
    const responsesInternal = [17, 13, 12, 9, 11, 7, 15, 18, 6, 1, 16, 3, 14, 4, 2, 10, 5, 8];
    const responsesSexual   = [3, 9, 14, 17, 16, 6, 10, 18, 7, 13, 15, 5, 8, 4, 2, 11, 12, 1];

    const request = new Request('http://localhost/api/iahrsubmit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clave: 'Felicidad', edad: '35', sexo: 'F', estadoCivil: 'casada',
        hijos: '2', profesión: 'profesora', metodoInput: 'web',
        responses: [...responsesExternal, ...responsesInternal, ...responsesSexual],
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const call = (generateAndSendReport as ReturnType<typeof vi.fn>).mock.calls.at(-1);
    // 4th arg (index 3) is responsesSexual — verify it's not null when 54 responses provided
    expect(call[3]).not.toBeNull();
  });
});
