export interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
}

export interface EmailInput {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  attachments?: EmailAttachment[];
}

export interface EmailProvider {
  enviar(input: EmailInput): Promise<void>;
}

interface HttpEmailProviderConfig {
  url: string;
  token?: string;
}

class HttpEmailProvider implements EmailProvider {
  constructor(private readonly config: HttpEmailProviderConfig) {}

  async enviar(input: EmailInput): Promise<void> {
    if (!this.config.url) {
      throw new Error('EMAIL_PROVIDER_URL não configurado');
    }
    const res = await fetch(this.config.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.token ?? ''}`,
      },
      body: JSON.stringify({
        to: input.to,
        subject: input.subject,
        html: input.html,
        text: input.text,
        attachments: (input.attachments ?? []).map((a) => ({
          filename: a.filename,
          contentType: a.contentType,
          content: Buffer.isBuffer(a.content) ? a.content.toString('base64') : a.content,
        })),
      }),
    });
    if (!res.ok) {
      const msg = await res.text().catch(() => '');
      throw new Error(`Falha ao enviar e-mail: ${res.status} ${msg}`);
    }
  }
}

class LogEmailProvider implements EmailProvider {
  async enviar(input: EmailInput): Promise<void> {
    console.info(
      `[email:dev] Para=${input.to} Assunto=${input.subject} Anexos=${input.attachments?.length ?? 0}`
    );
  }
}

export const emailProvider: EmailProvider = process.env.EMAIL_PROVIDER_URL
  ? new HttpEmailProvider({
      url: process.env.EMAIL_PROVIDER_URL,
      ...(process.env.EMAIL_PROVIDER_TOKEN ? { token: process.env.EMAIL_PROVIDER_TOKEN } : {}),
    })
  : new LogEmailProvider();
