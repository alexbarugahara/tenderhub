import type {
  BidSubmittedEmailData,
  EmailMessage,
} from "../email-types";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function bidSubmittedEmail(
  data: BidSubmittedEmailData,
): EmailMessage {
  const recipientName = data.recipientName?.trim() || "there";
  const safeRecipientName = escapeHtml(recipientName);
  const safeBidReference = escapeHtml(data.bidReference);
  const safeSolicitationTitle = escapeHtml(data.solicitationTitle);

  const subject = `Bid submitted successfully — ${data.bidReference}`;

  const text = [
    `Hello ${recipientName},`,
    "",
    "Your bid has been submitted successfully on TenderHub.",
    "",
    `Bid reference: ${data.bidReference}`,
    `Solicitation: ${data.solicitationTitle}`,
    "",
    "Please keep your bid reference for future correspondence.",
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
                Bid submitted successfully
              </h1>

              <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">
                Hello ${safeRecipientName},
              </p>

              <p style="margin:0 0 24px;font-size:16px;line-height:1.6;">
                Your bid has been successfully submitted on TenderHub.
                The details of your submission are shown below.
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
                    Bid reference
                  </td>
                  <td
                    style="padding:14px 16px;background-color:#f4f6f8;border-bottom:1px solid #e5e7eb;text-align:right;"
                  >
                    ${safeBidReference}
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
              </table>

              <p style="margin:0;font-size:15px;line-height:1.6;color:#4b5563;">
                Please keep your bid reference for future correspondence
                regarding this submission.
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

export default bidSubmittedEmail;