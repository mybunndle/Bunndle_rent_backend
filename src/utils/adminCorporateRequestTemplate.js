const escapeHtml = (value = "") => {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
};

const adminCorporateRequestTemplate = ({
  _id,
  companyName,
  contactName,
  designation,
  phone,
  email,
  locationCity,
  locationState,
  numberOfCars,
  seatingCapacity,
  preferredVehicleType,
  message,
  createdAt,
}) => {
  const safeRequestId = escapeHtml(_id);
  const safeCompanyName = escapeHtml(companyName);
  const safeContactName = escapeHtml(contactName);
  const safeDesignation = escapeHtml(
    designation || "Not provided"
  );
  const safePhone = escapeHtml(phone);
  const safeEmail = escapeHtml(email);
  const safeCity = escapeHtml(locationCity);
  const safeState = escapeHtml(locationState);
  const safeNumberOfCars = escapeHtml(numberOfCars);
  const safeSeatingCapacity =
    escapeHtml(seatingCapacity);
  const safeVehicleType = escapeHtml(
    preferredVehicleType
  );
  const safeMessage = escapeHtml(
    message || "No message provided"
  );

  const submittedAt = createdAt
    ? new Date(createdAt).toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
      })
    : "Not available";

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />

        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0"
        />

        <title>New Corporate Leasing Request</title>
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
                  max-width: 650px;
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
                      New Corporate Leasing Request
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
                        color: #374151;
                      "
                    >
                      A new corporate vehicle leasing request
                      has been submitted.
                    </p>

                    <table
                      role="presentation"
                      width="100%"
                      cellspacing="0"
                      cellpadding="0"
                      border="0"
                      style="
                        width: 100%;
                        border-collapse: collapse;
                        border: 1px solid #dbe4ee;
                      "
                    >
                      <tr>
                        <td style="${labelStyle}">
                          Request ID
                        </td>

                        <td style="${valueStyle}">
                          ${safeRequestId}
                        </td>
                      </tr>

                      <tr>
                        <td style="${labelStyle}">
                          Company Name
                        </td>

                        <td style="${valueStyle}">
                          ${safeCompanyName}
                        </td>
                      </tr>

                      <tr>
                        <td style="${labelStyle}">
                          Contact Person
                        </td>

                        <td style="${valueStyle}">
                          ${safeContactName}
                        </td>
                      </tr>

                      <tr>
                        <td style="${labelStyle}">
                          Designation
                        </td>

                        <td style="${valueStyle}">
                          ${safeDesignation}
                        </td>
                      </tr>

                      <tr>
                        <td style="${labelStyle}">
                          Phone Number
                        </td>

                        <td style="${valueStyle}">
                          <a
                            href="tel:${safePhone}"
                            style="
                              color: #14578e;
                              text-decoration: none;
                            "
                          >
                            ${safePhone}
                          </a>
                        </td>
                      </tr>

                      <tr>
                        <td style="${labelStyle}">
                          Email Address
                        </td>

                        <td style="${valueStyle}">
                          <a
                            href="mailto:${safeEmail}"
                            style="
                              color: #14578e;
                              text-decoration: none;
                            "
                          >
                            ${safeEmail}
                          </a>
                        </td>
                      </tr>

                      <tr>
                        <td style="${labelStyle}">
                          Location
                        </td>

                        <td style="${valueStyle}">
                          ${safeCity}, ${safeState}
                        </td>
                      </tr>

                      <tr>
                        <td style="${labelStyle}">
                          Number of Cars
                        </td>

                        <td style="${valueStyle}">
                          ${safeNumberOfCars}
                        </td>
                      </tr>

                      <tr>
                        <td style="${labelStyle}">
                          Seating Capacity
                        </td>

                        <td style="${valueStyle}">
                          ${safeSeatingCapacity}
                        </td>
                      </tr>

                      <tr>
                        <td style="${labelStyle}">
                          Preferred Vehicle Type
                        </td>

                        <td style="${valueStyle}">
                          ${safeVehicleType}
                        </td>
                      </tr>

                      <tr>
                        <td style="${labelStyle}">
                          Submitted At
                        </td>

                        <td style="${valueStyle}">
                          ${escapeHtml(submittedAt)}
                        </td>
                      </tr>
                    </table>

                    <div
                      style="
                        margin-top: 20px;
                        padding: 18px;
                        background-color: #f8fafc;
                        border: 1px solid #dbe4ee;
                        border-left: 4px solid #f58220;
                        border-radius: 8px;
                      "
                    >
                      <p
                        style="
                          margin: 0 0 10px;
                          font-weight: 600;
                        "
                      >
                        Customer Message
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
                        line-height: 1.6;
                        color: #64748b;
                      "
                    >
                      Reply directly to this email to contact
                      ${safeContactName}.
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

const labelStyle = `
  padding: 12px;
  border-bottom: 1px solid #dbe4ee;
  background-color: #f5f8fb;
  font-weight: 600;
  color: #374151;
  width: 40%;
  vertical-align: top;
`;

const valueStyle = `
  padding: 12px;
  border-bottom: 1px solid #dbe4ee;
  color: #111827;
  vertical-align: top;
  word-break: break-word;
`;

export default adminCorporateRequestTemplate;