const escapeHtml = (value = "") => {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
};

const adminQuickConnectTemplate = ({
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

        <title>New Quick Support Request</title>
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
                      New Quick Support Request
                    </h1>
                  </td>
                </tr>

                <tr>
                  <td style="padding: 28px 22px;">
                    <p
                      style="
                        margin: 0 0 20px;
                        font-size: 15px;
                        line-height: 1.6;
                      "
                    >
                      A user has submitted a new support request.
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

                            <a
                              href="mailto:${safeEmail}"
                              style="
                                color: #14578e;
                                text-decoration: none;
                              "
                            >
                              ${safeEmail}
                            </a>
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
                        Message
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
                        margin: 20px 0 0;
                        font-size: 13px;
                        color: #64748b;
                      "
                    >
                      Reply directly to this email to contact the user.
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

export default adminQuickConnectTemplate;