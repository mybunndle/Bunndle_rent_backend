const escapeHtml = (value = "") => {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
};

const userQuickConnectTemplate = ({
  name,
  email,
  message,
}) => {
  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safeMessage = escapeHtml(message);

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0"
        />

        <title>Support Request Received</title>
      </head>

      <body
        style="
          margin: 0;
          padding: 0;
          background-color: #f3f7fb;
          font-family: Arial, Helvetica, sans-serif;
          color: #111827;
        "
      >
        <table
          role="presentation"
          width="100%"
          cellspacing="0"
          cellpadding="0"
          border="0"
          style="
            width: 100%;
            background-color: #f3f7fb;
            padding: 24px 10px;
          "
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
                  width: 100%;
                  max-width: 600px;
                  background-color: #ffffff;
                  border-radius: 14px;
                  overflow: hidden;
                "
              >
                <tr>
                  <td
                    align="center"
                    style="
                      padding: 24px;
                      background-color: #14578e;
                    "
                  >
                    <h1
                      style="
                        margin: 0;
                        color: #ffffff;
                        font-size: 25px;
                      "
                    >
                      Request Received
                    </h1>
                  </td>
                </tr>

                <tr>
                  <td style="padding: 28px 22px;">
                    <h2
                      style="
                        margin: 0 0 14px;
                        font-size: 20px;
                      "
                    >
                      Hello ${safeName},
                    </h2>

                    <p
                      style="
                        margin: 0 0 12px;
                        line-height: 1.65;
                      "
                    >
                      Thank you for contacting
                      <strong>Bunndle Support</strong>.
                    </p>

                    <p
                      style="
                        margin: 0 0 20px;
                        line-height: 1.65;
                      "
                    >
                      We have received your support request.
                      Our team will contact you shortly.
                    </p>

                    <table
                      role="presentation"
                      width="100%"
                      cellspacing="0"
                      cellpadding="0"
                      border="0"
                      style="
                        width: 100%;
                        background-color: #f5f8fb;
                        border-left: 4px solid #f58220;
                        border-radius: 8px;
                      "
                    >
                      <tr>
                        <td style="padding: 18px;">
                          <p style="margin: 0 0 12px;">
                            <strong>Name:</strong>
                            ${safeName}
                          </p>

                          <p style="margin: 0;">
                            <strong>Email:</strong>
                            ${safeEmail}
                          </p>
                        </td>
                      </tr>
                    </table>

                    <div
                      style="
                        margin-top: 20px;
                        padding: 18px;
                        border: 1px solid #dbe4ee;
                        border-radius: 8px;
                      "
                    >
                      <p
                        style="
                          margin: 0 0 10px;
                          font-weight: 600;
                        "
                      >
                        Your message
                      </p>

                      <p
                        style="
                          margin: 0;
                          line-height: 1.65;
                          white-space: pre-wrap;
                          word-break: break-word;
                        "
                      >
                        ${safeMessage}
                      </p>
                    </div>

                    <p
                      style="
                        margin: 24px 0 0;
                        line-height: 1.65;
                      "
                    >
                      Regards,<br />
                      <strong style="color: #14578e;">
                        Bunndle Support Team
                      </strong>
                    </p>
                  </td>
                </tr>

                <tr>
                  <td
                    align="center"
                    style="
                      padding: 18px;
                      background-color: #f5f9fe;
                      font-size: 12px;
                      color: #64748b;
                    "
                  >
                    Need help?
                    <a
                      href="mailto:info@bunndle.in"
                      style="
                        color: #14578e;
                        text-decoration: none;
                        font-weight: 600;
                      "
                    >
                      Contact Bunndle Support
                    </a>

                    <br /><br />

                    © ${new Date().getFullYear()}
                    Agent Alliance Private Limited.
                    All rights reserved.
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
};

export default userQuickConnectTemplate;