import type {
  EmailMessage,
  EmailProvider,
  SendEmailInput,
  SendEmailResult,
} from "../email-types";

const RESEND_API_URL = "https://api.resend.com/emails";

function getResendApiKey(): string {
  const apiKey = process.env.RESEND_API_KEY?.trim();

  if (!apiKey) {
    throw new Error(
      "RESEND_API_KEY is not configured.",
    );
  }

  return apiKey;
}

function getDefaultFromAddress(): string {
  const from = process.env.EMAIL_FROM?.trim();

  if (!from) {
    throw new Error(
      "EMAIL_FROM is not configured.",
    );
  }

  return from;
}

function normalizeRecipients(
  value: string | string[],
): string[] {
  const recipients = Array.isArray(value)
    ? value
    : [value];

  return recipients
    .map((recipient) => recipient.trim())
    .filter(Boolean);
}

function validateMessage(
  message: EmailMessage,
): void {
  const recipients = normalizeRecipients(message.to);

  if (recipients.length === 0) {
    throw new Error(
      "At least one email recipient is required.",
    );
  }

  if (!message.subject?.trim()) {
    throw new Error(
      "Email subject is required.",
    );
  }

  if (!message.html?.trim()) {
    throw new Error(
      "Email HTML content is required.",
    );
  }
}

export function isResendConfigured(): boolean {
  return Boolean(
    process.env.RESEND_API_KEY?.trim() &&
      process.env.EMAIL_FROM?.trim(),
  );
}

export async function sendWithResend(
  input: SendEmailInput,
): Promise<SendEmailResult> {
  const message: EmailMessage = {
    ...input,
    from:
      input.from?.trim() ||
      getDefaultFromAddress(),
  };

  validateMessage(message);

  const apiKey = getResendApiKey();

  const response = await fetch(
    RESEND_API_URL,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: message.from,
        to: normalizeRecipients(message.to),
        subject: message.subject,
        html: message.html,
        ...(message.text
          ? { text: message.text }
          : {}),
        ...(message.replyTo
          ? { reply_to: message.replyTo }
          : {}),
        ...(message.cc
          ? {
              cc: normalizeRecipients(message.cc),
            }
          : {}),
        ...(message.bcc
          ? {
              bcc: normalizeRecipients(message.bcc),
            }
          : {}),
      }),
    },
  );

  let data: unknown = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const errorMessage =
      typeof data === "object" &&
      data !== null &&
      "message" in data &&
      typeof data.message === "string"
        ? data.message
        : `Resend request failed with status ${response.status}.`;

    throw new Error(errorMessage);
  }

  const responseData = data as {
    id?: string;
  };

  return {
    success: true,
    messageId: responseData.id ?? null,
    provider: "resend",
  };
}

export const resendProvider: EmailProvider = {
  name: "resend",

  isConfigured(): boolean {
    return isResendConfigured();
  },

  async send(
    input: SendEmailInput,
  ): Promise<SendEmailResult> {
    return sendWithResend(input);
  },
};