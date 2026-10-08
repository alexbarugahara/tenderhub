import type {
  EmailMessage,
  VerificationEmailData,
} from "../email-types";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function verificationEmail(
  data: VerificationEmailData,
): EmailMessage {
  const name = data.name?.trim() || "there";
  const verificationUrl = data.verificationUrl.trim();

  if (!verificationUrl) {
    throw new Error(
      "Verification URL is required.",
    );
  }

  const safeName = escapeHtml(name);
  const safeUrl = escapeHtml(verificationUrl);

  return {
    to: data.to,
    subject: "Verify your TenderHub account",
    text: [
      `Hello ${name},`,
      "",
      "Please verify your TenderHub account by opening the link below:",
      verificationUrl,
      "",
      "If you did not create this account, you can ignore this email.",
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
  <title>Verify your TenderHub account</title>
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
                Verify your account
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
                Please verify your TenderHub account by clicking
                the button below.
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
                  Verify my account
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
                If you did not create this account, you can
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

export default verificationEmail;