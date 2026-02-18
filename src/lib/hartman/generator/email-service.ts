import Mailgun from 'mailgun.js';
import FormData from 'form-data';

function requireEnv(name: string): string {
  const val = process.env[name];
  if (!val) throw new Error(`${name} environment variable is not set`);
  return val;
}

export async function sendReportByEmail(
  subject: string,
  body: string,
  pdfBuffer: Buffer,
  pdfFilename: string,
  docxBuffer: Buffer,
  docxFilename: string,
): Promise<void> {
  const apiKey    = requireEnv('MAILGUN_API_KEY');
  const domain    = requireEnv('MAILGUN_DOMAIN');
  const fromEmail = requireEnv('MAILGUN_FROM_EMAIL');
  const fromName  = requireEnv('MAILGUN_FROM_NAME');
  const toEmail   = requireEnv('MAILGUN_TO_EMAIL');

  const mg = new Mailgun(FormData).client({ username: 'api', key: apiKey });

  await mg.messages.create(domain, {
    from: `${fromName} <${fromEmail}>`,
    to: [toEmail],
    subject,
    text: body,
    attachment: [
      { filename: pdfFilename,  data: pdfBuffer,  contentType: 'application/pdf' },
      { filename: docxFilename, data: docxBuffer,  contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
    ],
  });
}
