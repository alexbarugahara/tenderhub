import type {
  EmailMessage,
  SolicitationClosingEmailData,
} from "../email-types";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatClosingDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(date);
}

export function solicitationClosingEmail(
  data: SolicitationClosingEmailData,
): EmailMessage {
  const recipientName = data.recipientName?.trim() || "there";
  const closingDate = formatClosingDate(data.closingDate);

  const safeRecipientName = escapeHtml(recipientName);
  const safeSolicitationReference = escapeHtml(
    data.solicitationReference,
  );
  const safeSolicitationTitle = escapeHtml(data.solicitationTitle);
  const safeClosingDate = escapeHtml(closingDate);

  const subject = `Solicitation closing soon — ${data.solicitationReference}`;

  const text = [
    `Hello ${recipientName},`,
    "",
    "This is a reminder that the following TenderHub solicitation is approaching its closing date.",
    "",
    `Solicitation reference: ${data.solicitationReference}`,
    `Solicitation: ${data.solicitationTitle}`,
    `Closing date: ${closingDate}`,
    "",
    "Please ensure that any required bid or procurement actions are completed before the closing time.",
    "",
    "Regards,",
    "TenderHub",
  ].join("\n");

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f6f8;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
  <table
    role="presentation"
    width="100%"
    cellspacing="0"
    cellpadding="0"
    style="background-color:#f4f6f8;padding:40px 16px;"
  >
    <tr>
      <td align="center">
        <table
          role="presentation"
          width="100%"
          cellspacing="0"
          cellpadding="0"
          style="max-width:600px;background-color:#ffffff;border-radius:8px;overflow:hidden;"
        >
          <tr>
            <td style="background-color:#071A33;padding:24px 32px;text-align:center;">
              <div style="font-size:28px;font-weight:700;color:#D4AF37;">
                TenderHub
              </div>
              <div style="margin-top:6px;font-size:13px;color:#ffffff;">
                Smarter Procurement. Stronger Uganda.
              </div>
            </td>
          </tr>

          <tr>
            <td style="padding:36px 32px;">
              <h1 style="margin:0 0 20px;color:#071A33;font-size:24px;">
                Solicitation closing soon
              </h1>

              <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">
                Hello ${safeRecipientName},
              </p>

              <p style="margin:0 0 24px;font-size:16px;line-height:1.6;">
                This is a reminder that the following TenderHub solicitation
                is approaching its closing date.
              </p>

              <table
                role="presentation"
                width="100%"
                cellspacing="0"
                cellpadding="0"
                style="border-collapse:collapse;margin:0 0 24px;"
              >
                <tr>
                  <td
                    style="padding:14px 16px;background-color:#f4f6f8;border-bottom:1px solid #e5e7eb;font-weight:600;color:#071A33;"
                  >
                    Solicitation reference
                  </td>
                  <td
                    style="padding:14px 16px;background-color:#f4f6f8;border-bottom:1px solid #e5e7eb;text-align:right;"
                  >
                    ${safeSolicitationReference}
                  </td>
                </tr>

                <tr>
                  <td
                    style="padding:14px 16px;border-bottom:1px solid #e5e7eb;font-weight:600;color:#071A33;"
                  >
                    Solicitation
                  </td>
                  <td
                    style="padding:14px 16px;border-bottom:1px solid #e5e7eb;text-align:right;"
                  >
                    ${safeSolicitationTitle}
                  </td>
                </tr>

                <tr>
                  <td
                    style="padding:14px 16px;font-weight:600;color:#071A33;"
                  >
                    Closing date
                  </td>
                  <td
                    style="padding:14px 16px;text-align:right;font-weight:600;color:#b45309;"
                  >
                    ${safeClosingDate}
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:15px;line-height:1.6;color:#4b5563;">
                Please ensure that any required bid or procurement actions
                are completed before the closing time.
              </p>

              <p style="margin:28px 0 0;font-size:16px;line-height:1.6;">
                Regards,<br />
                <strong style="color:#071A33;">TenderHub</strong>
              </p>
            </td>
          </tr>

          <tr>
            <td style="background-color:#071A33;padding:20px 32px;text-align:center;">
              <p style="margin:0;color:#ffffff;font-size:12px;line-height:1.5;">
                This is an automated message from TenderHub.
                Please do not reply directly to this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  return {
    to: data.to,
    subject,
    html,
    text,
  };
}

export default solicitationClosingEmail;