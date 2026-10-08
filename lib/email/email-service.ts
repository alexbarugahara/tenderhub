import type {
  EmailMessage,
  EmailProvider,
  SendEmailInput,
  SendEmailResult,
} from "./email-types";

import { getEmailProvider } from "./email-types";

export async function sendEmail(
  input: SendEmailInput,
): Promise<SendEmailResult> {
  const provider = getEmailProvider();

  return provider.send(input);
}

export async function sendVerificationEmail(
  input: {
    to: string;
    name?: string | null;
    verificationUrl: string;
  },
): Promise<SendEmailResult> {
  const { verificationEmail } = await import(
    "./templates/verification-email"
  );

  const message: EmailMessage = verificationEmail(input);

  return sendEmail(message);
}

export async function sendPasswordResetEmail(
  input: {
    to: string;
    name?: string | null;
    resetUrl: string;
  },
): Promise<SendEmailResult> {
  const { passwordResetEmail } = await import(
    "./templates/password-reset"
  );

  const message: EmailMessage = passwordResetEmail(input);

  return sendEmail(message);
}

export async function sendBidSubmittedEmail(
  input: {
    to: string;
    recipientName?: string | null;
    bidReference: string;
    solicitationTitle: string;
  },
): Promise<SendEmailResult> {
  const { bidSubmittedEmail } = await import(
    "./templates/bid-submitted"
  );

  const message: EmailMessage = bidSubmittedEmail(input);

  return sendEmail(message);
}

export async function sendSolicitationClosingEmail(
  input: {
    to: string;
    recipientName?: string | null;
    solicitationReference: string;
    solicitationTitle: string;
    closingDate: Date;
  },
): Promise<SendEmailResult> {
  const { solicitationClosingEmail } = await import(
    "./templates/solicitation-closing"
  );

  const message: EmailMessage = solicitationClosingEmail(input);

  return sendEmail(message);
}

export async function sendAwardNotificationEmail(
  input: {
    to: string;
    recipientName?: string | null;
    solicitationReference: string;
    solicitationTitle: string;
    awardAmount?: string | number | null;
  },
): Promise<SendEmailResult> {
  const { awardNotificationEmail } = await import(
    "./templates/award-notification"
  );

  const message: EmailMessage = awardNotificationEmail(input);

  return sendEmail(message);
}

export async function sendContractNotificationEmail(
  input: {
    to: string;
    recipientName?: string | null;
    contractReference: string;
    solicitationTitle: string;
  },
): Promise<SendEmailResult> {
  const { contractNotificationEmail } = await import(
    "./templates/contract-notification"
  );

  const message: EmailMessage = contractNotificationEmail(input);

  return sendEmail(message);
}

export function isEmailConfigured(): boolean {
  return Boolean(
    process.env.EMAIL_PROVIDER &&
      process.env.EMAIL_FROM,
  );
}

export function getConfiguredEmailProvider(): string {
  return (
    process.env.EMAIL_PROVIDER?.trim().toLowerCase() ??
    "resend"
  );
}