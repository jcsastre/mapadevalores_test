import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock mailgun.js before importing the service
vi.mock('mailgun.js', () => {
  const mockCreate = vi.fn().mockResolvedValue({ id: 'mock-id', message: 'Queued' });
  const mockClient = { messages: { create: mockCreate } };
  class MockMailgun {
    client() { return mockClient; }
  }
  return { default: MockMailgun };
});

import { sendReportByEmail } from '@/lib/hartman/generator/email-service';

describe('sendReportByEmail', () => {
  beforeEach(() => {
    process.env.MAILGUN_API_KEY    = 'test-key';
    process.env.MAILGUN_DOMAIN     = 'test.domain.com';
    process.env.MAILGUN_FROM_EMAIL = 'from@test.com';
    process.env.MAILGUN_FROM_NAME  = 'Test Sender';
    process.env.MAILGUN_TO_EMAIL   = 'to@test.com';
  });

  it('sends email without throwing', async () => {
    const pdfBuffer   = Buffer.from('%PDF-test');
    const docxBuffer  = Buffer.from('PK-test');

    // Should resolve without throwing when env vars are set
    await expect(
      sendReportByEmail('Test Subject', 'Test body', pdfBuffer, 'report.pdf', docxBuffer, 'report.docx')
    ).resolves.toBeUndefined();
  });

  it('throws when env vars are missing', async () => {
    delete process.env.MAILGUN_API_KEY;

    await expect(
      sendReportByEmail('Subject', 'Body', Buffer.alloc(0), 'f.pdf', Buffer.alloc(0), 'f.docx')
    ).rejects.toThrow('MAILGUN_API_KEY');
  });
});
