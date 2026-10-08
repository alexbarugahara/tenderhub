import type {
  EmailMessage,
  PasswordResetEmailData,
} from "../email-types";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function passwordResetEmail(
  data: PasswordResetEmailData,
): EmailMessage {
  const name = data.name?.trim() || "there";
  const resetUrl = data.resetUrl.trim();

  if (!resetUrl) {
    throw new Error("Password reset URL is required.");
  }

  const safeName = escapeHtml(name);
  const safeUrl = escapeHtml(resetUrl);

  return {
    to: data.to,
    subject: "Reset your TenderHub password",
    text: [
      `Hello ${name},`,
      "",
      "We received a request to reset your TenderHub password.",
      "",
      "Use the link below to create a new password:",
      resetUrl,
      "",
      "If you did not request a password reset, you can ignore this email.",
      "",
      "TenderHub",
    ].join("\n"),
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  />
  <title>Reset your TenderHub password</title>
</head>

<body
  style="
    margin:0;
    padding:0;
    background:#f5f7fa;
    font-family:Arial,Helvetica,sans-serif;
    color:#1f2937;
  "
>
  <table
    role="presentation"
    width="100%"
    cellspacing="0"
    cellpadding="0"
    border="0"
    style="background:#f5f7fa;padding:40px 16px;"
  >
    <tr>
      <td align="center">
        <table
          role="presentation"
          width="100%"
          cellspacing="0"
          cellpadding="0"
          border="0"
          style="
            max-width:600px;
            background:#ffffff;
            border-radius:8px;
            overflow:hidden;
          "
        >
          <tr>
            <td
              style="
                background:#071A33;
                padding:24px 32px;
                text-align:center;
              "
            >
              <div
                style="
                  color:#D4AF37;
                  font-size:26px;
                  font-weight:700;
                "
              >
                TenderHub
              </div>

              <div
                style="
                  color:#ffffff;
                  font-size:13px;
                  margin-top:6px;
                "
              >
                Smarter Procurement. Stronger Uganda.
              </div>
            </td>
          </tr>

          <tr>
            <td style="padding:40px 32px;">
              <h1
                style="
                  margin:0 0 20px;
                  color:#071A33;
                  font-size:24px;
                "
              >
                Reset your password
              </h1>

              <p
                style="
                  margin:0 0 16px;
                  font-size:16px;
                  line-height:1.6;
                "
              >
                Hello ${safeName},
              </p>

              <p
                style="
                  margin:0 0 24px;
                  font-size:16px;
                  line-height:1.6;
                "
              >
                We received a request to reset your TenderHub
                password. Click the button below to create a new
                password.
              </p>

              <p style="margin:0 0 28px;text-align:center;">
                <a
                  href="${safeUrl}"
                  style="
                    display:inline-block;
                    background:#D4AF37;
                    color:#071A33;
                    text-decoration:none;
                    font-weight:700;
                    padding:14px 24px;
                    border-radius:6px;
                  "
                >
                  Reset my password
                </a>
              </p>

              <p
                style="
                  margin:0 0 12px;
                  color:#6b7280;
                  font-size:13px;
                  line-height:1.6;
                "
              >
                If the button does not work, copy and paste the
                following link into your browser:
              </p>

              <p
                style="
                  margin:0 0 24px;
                  font-size:13px;
                  line-height:1.6;
                  word-break:break-all;
                "
              >
                <a
                  href="${safeUrl}"
                  style="color:#071A33;"
                >
                  ${safeUrl}
                </a>
              </p>

              <p
                style="
                  margin:0;
                  color:#6b7280;
                  font-size:13px;
                  line-height:1.6;
                "
              >
                If you did not request a password reset, you can
                safely ignore this email.
              </p>
            </td>
          </tr>

          <tr>
            <td
              style="
                background:#f9fafb;
                padding:20px 32px;
                text-align:center;
                color:#6b7280;
                font-size:12px;
              "
            >
              TenderHub
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim(),
  };
}

export default passwordResetEmail;