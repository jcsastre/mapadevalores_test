import { describe, it, expect } from 'vitest';
import { POST } from '@/app/api/iahrsubmit/route';

describe('POST /api/iahrsubmit', () => {
  it('returns 400 when responses are missing', async () => {
    const request = new Request('http://localhost/api/iahrsubmit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clave: 'test', responses: [] }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('returns 200 with calculated values for 36 valid responses', async () => {
    const responsesExternal = [4, 1, 18, 12, 17, 6, 5, 15, 7, 14, 16, 9, 8, 2, 11, 10, 3, 13];
    const responsesInternal = [17, 13, 12, 9, 11, 7, 15, 18, 6, 1, 16, 3, 14, 4, 2, 10, 5, 8];

    const request = new Request('http://localhost/api/iahrsubmit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clave: 'Felicidad',
        edad: '35',
        sexo: 'F',
        estadoCivil: 'casada',
        hijos: '2',
        profesión: 'profesora',
        metodoInput: 'web',
        responses: [...responsesExternal, ...responsesInternal],
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body).toHaveProperty('externalWorldValues');
    expect(body).toHaveProperty('internalWorldValues');
    expect(body).toHaveProperty('worldRelationsValues');
    expect(body.sexualWorldValues).toBeNull();
  });

  it('returns 200 with sexual world when 54 responses provided', async () => {
    const responsesExternal = [4, 1, 18, 12, 17, 6, 5, 15, 7, 14, 16, 9, 8, 2, 11, 10, 3, 13];
    const responsesInternal = [17, 13, 12, 9, 11, 7, 15, 18, 6, 1, 16, 3, 14, 4, 2, 10, 5, 8];
    const responsesSexual =   [3, 9, 14, 17, 16, 6, 10, 18, 7, 13, 15, 5, 8, 4, 2, 11, 12, 1];

    const request = new Request('http://localhost/api/iahrsubmit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clave: 'Felicidad',
        edad: '35',
        sexo: 'F',
        estadoCivil: 'casada',
        hijos: '2',
        profesión: 'profesora',
        metodoInput: 'web',
        responses: [...responsesExternal, ...responsesInternal, ...responsesSexual],
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.sexualWorldValues).not.toBeNull();
  });
});
