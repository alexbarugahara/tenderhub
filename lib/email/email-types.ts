export interface EmailMessage {
  to: string | string[];
  from?: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
}

export type SendEmailInput = EmailMessage;

export interface SendEmailResult {
  success: boolean;
  messageId: string | null;
  provider: string;
  error?: string;
}

export interface EmailProvider {
  name: string;
  isConfigured(): boolean;
  send(
    input: SendEmailInput,
  ): Promise<SendEmailResult>;
}

export interface VerificationEmailData {
  to: string;
  name?: string | null;
  verificationUrl: string;
}

export interface PasswordResetEmailData {
  to: string;
  name?: string | null;
  resetUrl: string;
}

export interface BidSubmittedEmailData {
  to: string;
  recipientName?: string | null;
  bidReference: string;
  solicitationTitle: string;
}

export interface SolicitationClosingEmailData {
  to: string;
  recipientName?: string | null;
  solicitationReference: string;
  solicitationTitle: string;
  closingDate: Date;
}

export interface AwardNotificationEmailData {
  to: string;
  recipientName?: string | null;
  solicitationReference: string;
  solicitationTitle: string;
  awardAmount?: string | number | null;
}

export interface ContractNotificationEmailData {
  to: string;
  recipientName?: string | null;
  contractReference: string;
  solicitationTitle: string;
}

export function getEmailProvider(): EmailProvider {
  const provider =
    process.env.EMAIL_PROVIDER
      ?.trim()
      .toLowerCase() || "resend";

  if (provider === "resend") {
    // Dynamic import is not appropriate here because
    // this function is synchronous and the email service
    // expects a provider immediately.
    const { resendProvider } = require("./providers/resend");

    return resendProvider;
  }

  throw new Error(
    `Unsupported email provider: ${provider}`,
  );
}