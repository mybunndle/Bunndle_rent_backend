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
  const safeRequestId = escapeHtml(
    _id || "Not available"
  );

  const safeCompanyName = escapeHtml(
    companyName || "Not provided"
  );

  const safeContactName = escapeHtml(
    contactName || "Not provided"
  );

  const safeDesignation = escapeHtml(
    designation || "Not provided"
  );

  const safePhone = escapeHtml(
    phone || "Not provided"
  );

  const safeEmail = escapeHtml(
    email || "Not provided"
  );

  const safeCity = escapeHtml(
    locationCity || "Not provided"
  );

  const safeState = escapeHtml(
    locationState || "Not provided"
  );

  const safeNumberOfCars = escapeHtml(
    numberOfCars || "Not provided"
  );

  const safeSeatingCapacity = escapeHtml(
    seatingCapacity || "Not provided"
  );

  const safeVehicleType = escapeHtml(
    preferredVehicleType || "Not provided"
  );

  const safeMessage = escapeHtml(
    message || "No message provided"
  );

  const submittedAt = createdAt
    ? new Date(createdAt).toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        dateStyle: "medium",
        timeStyle: "short",
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
  bgcolor="#f3f7fb"
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
    bgcolor="#f3f7fb"
    style="
      width: 100%;
      background-color: #f3f7fb;
      padding: 18px 8px;
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
          bgcolor="#ffffff"
          style="
            width: 100%;
            max-width: 650px;
            background-color: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 8px 24px rgba(14, 61, 105, 0.10);
          "
        >

          <!-- Header -->
          <tr>
            <td
              align="center"
              bgcolor="#0f4f91"
              style="
                background-color: #0f4f91;
                padding: 26px 18px 24px;
              "
            >
              <table
                role="presentation"
                cellspacing="0"
                cellpadding="0"
                border="0"
                style="margin: 0 auto 14px;"
              >
                <tr>
                  <td
                    align="center"
                    width="104"
                    height="104"
                    bgcolor="#ffffff"
                    style="
                      width: 104px;
                      height: 104px;
                      background-color: #ffffff;
                      border-radius: 14px;
                      overflow: hidden;
                      padding: 0;
                      line-height: 0;
                    "
                  >
                    <img
                      src="https://ik.imagekit.io/bunndle/logo/WhatsApp%20Image%202026-07-10%20at%2012.02.32.jpeg"
                      alt="Bunndle"
                      width="104"
                      style="
                        display: block;
                        width: 104px;
                        max-width: 104px;
                        height: auto;
                        background-color: #ffffff;
                        border: 0;
                        margin: 0 auto;
                      "
                    />
                  </td>
                </tr>
              </table>

              <h1
                style="
                  margin: 0;
                  color: #ffffff;
                  font-family: Georgia, 'Times New Roman', serif;
                  font-size: 27px;
                  line-height: 1.25;
                  font-weight: 700;
                "
              >
                New Corporate Leasing Request
              </h1>

              <table
                role="presentation"
                cellspacing="0"
                cellpadding="0"
                border="0"
                style="margin: 12px auto 10px;"
              >
                <tr>
                  <td
                    width="78"
                    style="
                      width: 78px;
                      height: 1px;
                      background-color: #f58220;
                      font-size: 0;
                      line-height: 0;
                    "
                  ></td>

                  <td
                    style="
                      padding: 0 9px;
                      color: #f58220;
                      font-size: 11px;
                    "
                  >
                    ◆
                  </td>

                  <td
                    width="78"
                    style="
                      width: 78px;
                      height: 1px;
                      background-color: #f58220;
                      font-size: 0;
                      line-height: 0;
                    "
                  ></td>
                </tr>
              </table>

              <p
                style="
                  margin: 0;
                  color: #ffffff;
                  font-size: 15px;
                  line-height: 1.4;
                "
              >
                Corporate Vehicle Requirement
              </p>
            </td>
          </tr>

          <!-- Email Body -->
          <tr>
            <td style="padding: 28px 20px 26px;">

              <h2
                style="
                  margin: 0 0 14px;
                  color: #111827;
                  font-size: 20px;
                  line-height: 1.4;
                  font-weight: 700;
                "
              >
                Hello Admin,
              </h2>

              <p
                style="
                  margin: 0 0 12px;
                  color: #334155;
                  font-size: 14px;
                  line-height: 1.65;
                "
              >
                A new corporate vehicle leasing request has been
                submitted through <strong>Bunndle</strong>.
              </p>

              <p
                style="
                  margin: 0 0 20px;
                  color: #334155;
                  font-size: 14px;
                  line-height: 1.65;
                "
              >
                Please review the company, contact and vehicle
                requirement details below and contact the requester
                for further discussion.
              </p>

              <!-- Request Summary -->
              <table
                role="presentation"
                width="100%"
                cellspacing="0"
                cellpadding="0"
                border="0"
                bgcolor="#eef7ff"
                style="
                  width: 100%;
                  background-color: #eef7ff;
                  border: 1px solid #d4e8fa;
                  border-radius: 12px;
                  margin-bottom: 20px;
                "
              >
                <tr>
                  <td style="padding: 16px;">

                    <table
                      role="presentation"
                      width="100%"
                      cellspacing="0"
                      cellpadding="0"
                      border="0"
                    >
                      <tr>
                        <td
                          width="120"
                          valign="top"
                          style="
                            width: 120px;
                            padding: 0 10px 12px 0;
                            color: #475569;
                            font-size: 12px;
                            line-height: 1.4;
                          "
                        >
                          Request ID
                        </td>

                        <td
                          valign="top"
                          style="
                            padding: 0 0 12px;
                            color: #111827;
                            font-size: 13px;
                            line-height: 1.5;
                            font-weight: 600;
                            word-break: break-word;
                          "
                        >
                          ${safeRequestId}
                        </td>
                      </tr>

                      <tr>
                        <td
                          width="120"
                          valign="top"
                          style="
                            width: 120px;
                            padding: 0 10px 0 0;
                            color: #475569;
                            font-size: 12px;
                            line-height: 1.4;
                          "
                        >
                          Submitted At
                        </td>

                        <td
                          valign="top"
                          style="
                            padding: 0;
                            color: #111827;
                            font-size: 13px;
                            line-height: 1.5;
                            font-weight: 600;
                            word-break: break-word;
                          "
                        >
                          ${escapeHtml(submittedAt)}
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>
              </table>

              <!-- Company Section Heading -->
              <p
                style="
                  margin: 0 0 10px;
                  color: #0f4f91;
                  font-size: 15px;
                  line-height: 1.4;
                  font-weight: 700;
                "
              >
                Company &amp; Contact Details
              </p>

              <!-- Company Details Card -->
              <table
                role="presentation"
                width="100%"
                cellspacing="0"
                cellpadding="0"
                border="0"
                bgcolor="#f6f9fd"
                style="
                  width: 100%;
                  background-color: #f6f9fd;
                  border-left: 4px solid #f58220;
                  border-radius: 12px;
                  margin-bottom: 20px;
                "
              >
                <tr>
                  <td style="padding: 18px 16px;">

                    <table
                      role="presentation"
                      width="100%"
                      cellspacing="0"
                      cellpadding="0"
                      border="0"
                    >

                      <!-- Company Name -->
                      <tr>
                        <td
                          width="34"
                          valign="top"
                          style="
                            width: 34px;
                            color: #0f4f91;
                            font-size: 16px;
                            padding: 3px 8px 14px 0;
                          "
                        >
                          🏢
                        </td>

                        <td style="padding-bottom: 14px;">
                          <p
                            style="
                              margin: 0;
                              color: #475569;
                              font-size: 12px;
                              line-height: 1.4;
                            "
                          >
                            Company Name
                          </p>

                          <p
                            style="
                              margin: 2px 0 0;
                              color: #111827;
                              font-size: 14px;
                              line-height: 1.5;
                              font-weight: 600;
                              word-break: break-word;
                            "
                          >
                            ${safeCompanyName}
                          </p>
                        </td>
                      </tr>

                      <!-- Contact Person -->
                      <tr>
                        <td
                          width="34"
                          valign="top"
                          style="
                            width: 34px;
                            color: #0f4f91;
                            font-size: 16px;
                            padding: 3px 8px 14px 0;
                          "
                        >
                          👤
                        </td>

                        <td style="padding-bottom: 14px;">
                          <p
                            style="
                              margin: 0;
                              color: #475569;
                              font-size: 12px;
                              line-height: 1.4;
                            "
                          >
                            Contact Person
                          </p>

                          <p
                            style="
                              margin: 2px 0 0;
                              color: #111827;
                              font-size: 14px;
                              line-height: 1.5;
                              font-weight: 600;
                              word-break: break-word;
                            "
                          >
                            ${safeContactName}
                          </p>
                        </td>
                      </tr>

                      <!-- Designation -->
                      <tr>
                        <td
                          width="34"
                          valign="top"
                          style="
                            width: 34px;
                            color: #0f4f91;
                            font-size: 16px;
                            padding: 3px 8px 14px 0;
                          "
                        >
                          💼
                        </td>

                        <td style="padding-bottom: 14px;">
                          <p
                            style="
                              margin: 0;
                              color: #475569;
                              font-size: 12px;
                              line-height: 1.4;
                            "
                          >
                            Designation
                          </p>

                          <p
                            style="
                              margin: 2px 0 0;
                              color: #111827;
                              font-size: 14px;
                              line-height: 1.5;
                              font-weight: 600;
                              word-break: break-word;
                            "
                          >
                            ${safeDesignation}
                          </p>
                        </td>
                      </tr>

                      <!-- Phone -->
                      <tr>
                        <td
                          width="34"
                          valign="top"
                          style="
                            width: 34px;
                            color: #0f4f91;
                            font-size: 16px;
                            padding: 3px 8px 14px 0;
                          "
                        >
                          ☎
                        </td>

                        <td style="padding-bottom: 14px;">
                          <p
                            style="
                              margin: 0;
                              color: #475569;
                              font-size: 12px;
                              line-height: 1.4;
                            "
                          >
                            Phone Number
                          </p>

                          <p
                            style="
                              margin: 2px 0 0;
                              color: #111827;
                              font-size: 14px;
                              line-height: 1.5;
                              font-weight: 600;
                              word-break: break-word;
                            "
                          >
                            <a
                              href="tel:${safePhone}"
                              style="
                                color: #0f4f91;
                                text-decoration: none;
                              "
                            >
                              ${safePhone}
                            </a>
                          </p>
                        </td>
                      </tr>

                      <!-- Email -->
                      <tr>
                        <td
                          width="34"
                          valign="top"
                          style="
                            width: 34px;
                            color: #0f4f91;
                            font-size: 16px;
                            padding: 3px 8px 14px 0;
                          "
                        >
                          ✉
                        </td>

                        <td style="padding-bottom: 14px;">
                          <p
                            style="
                              margin: 0;
                              color: #475569;
                              font-size: 12px;
                              line-height: 1.4;
                            "
                          >
                            Email Address
                          </p>

                          <p
                            style="
                              margin: 2px 0 0;
                              color: #111827;
                              font-size: 14px;
                              line-height: 1.5;
                              font-weight: 600;
                              word-break: break-word;
                            "
                          >
                            <a
                              href="mailto:${safeEmail}"
                              style="
                                color: #0f4f91;
                                text-decoration: none;
                              "
                            >
                              ${safeEmail}
                            </a>
                          </p>
                        </td>
                      </tr>

                      <!-- Location -->
                      <tr>
                        <td
                          width="34"
                          valign="top"
                          style="
                            width: 34px;
                            color: #0f4f91;
                            font-size: 16px;
                            padding: 3px 8px 0 0;
                          "
                        >
                          📍
                        </td>

                        <td>
                          <p
                            style="
                              margin: 0;
                              color: #475569;
                              font-size: 12px;
                              line-height: 1.4;
                            "
                          >
                            Location
                          </p>

                          <p
                            style="
                              margin: 2px 0 0;
                              color: #111827;
                              font-size: 14px;
                              line-height: 1.5;
                              font-weight: 600;
                              word-break: break-word;
                            "
                          >
                            ${safeCity}, ${safeState}
                          </p>
                        </td>
                      </tr>

                    </table>
                  </td>
                </tr>
              </table>

              <!-- Vehicle Section Heading -->
              <p
                style="
                  margin: 0 0 10px;
                  color: #0f4f91;
                  font-size: 15px;
                  line-height: 1.4;
                  font-weight: 700;
                "
              >
                Vehicle Requirements
              </p>

              <!-- Vehicle Requirements -->
              <table
                role="presentation"
                width="100%"
                cellspacing="0"
                cellpadding="0"
                border="0"
                style="
                  width: 100%;
                  border: 1px solid #dbe4ee;
                  border-radius: 12px;
                  margin-bottom: 20px;
                "
              >
                <tr>
                  <td style="padding: 18px 16px;">

                    <table
                      role="presentation"
                      width="100%"
                      cellspacing="0"
                      cellpadding="0"
                      border="0"
                    >

                      <!-- Number of Cars -->
                      <tr>
                        <td
                          width="45%"
                          valign="top"
                          style="
                            width: 45%;
                            padding: 0 12px 14px 0;
                            color: #475569;
                            font-size: 12px;
                            line-height: 1.4;
                          "
                        >
                          Number of Cars
                        </td>

                        <td
                          valign="top"
                          style="
                            padding: 0 0 14px;
                            color: #111827;
                            font-size: 14px;
                            line-height: 1.5;
                            font-weight: 600;
                            word-break: break-word;
                          "
                        >
                          ${safeNumberOfCars}
                        </td>
                      </tr>

                      <!-- Seating Capacity -->
                      <tr>
                        <td
                          width="45%"
                          valign="top"
                          style="
                            width: 45%;
                            padding: 0 12px 14px 0;
                            color: #475569;
                            font-size: 12px;
                            line-height: 1.4;
                          "
                        >
                          Seating Capacity
                        </td>

                        <td
                          valign="top"
                          style="
                            padding: 0 0 14px;
                            color: #111827;
                            font-size: 14px;
                            line-height: 1.5;
                            font-weight: 600;
                            word-break: break-word;
                          "
                        >
                          ${safeSeatingCapacity}
                        </td>
                      </tr>

                      <!-- Preferred Vehicle -->
                      <tr>
                        <td
                          width="45%"
                          valign="top"
                          style="
                            width: 45%;
                            padding: 0 12px 0 0;
                            color: #475569;
                            font-size: 12px;
                            line-height: 1.4;
                          "
                        >
                          Preferred Vehicle Type
                        </td>

                        <td
                          valign="top"
                          style="
                            padding: 0;
                            color: #111827;
                            font-size: 14px;
                            line-height: 1.5;
                            font-weight: 600;
                            word-break: break-word;
                          "
                        >
                          ${safeVehicleType}
                        </td>
                      </tr>

                    </table>
                  </td>
                </tr>
              </table>

              <!-- Customer Message -->
              <table
                role="presentation"
                width="100%"
                cellspacing="0"
                cellpadding="0"
                border="0"
                style="margin-bottom: 20px;"
              >
                <tr>
                  <td
                    bgcolor="#ffffff"
                    style="
                      background-color: #ffffff;
                      border: 1px solid #dbe4ee;
                      border-radius: 12px;
                      padding: 18px 16px;
                    "
                  >
                    <p
                      style="
                        margin: 0 0 10px;
                        color: #475569;
                        font-size: 12px;
                        line-height: 1.4;
                        font-weight: 600;
                      "
                    >
                      💬 Customer Message
                    </p>

                    <p
                      style="
                        margin: 0;
                        color: #1f2937;
                        font-size: 14px;
                        line-height: 1.65;
                        white-space: pre-line;
                        word-break: break-word;
                      "
                    >
                      ${safeMessage}
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Admin Note -->
              <table
                role="presentation"
                width="100%"
                cellspacing="0"
                cellpadding="0"
                border="0"
                style="margin-bottom: 22px;"
              >
                <tr>
                  <td
                    bgcolor="#eef7ff"
                    style="
                      background-color: #eef7ff;
                      border: 1px solid #d4e8fa;
                      border-radius: 12px;
                      padding: 16px;
                    "
                  >
                    <p
                      style="
                        margin: 0;
                        color: #24577f;
                        font-size: 13px;
                        line-height: 1.6;
                      "
                    >
                      Please contact ${safeContactName} and assist
                      with the submitted corporate vehicle requirement.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Action Buttons -->
              <table
                role="presentation"
                width="100%"
                cellspacing="0"
                cellpadding="0"
                border="0"
                style="margin-bottom: 22px;"
              >
                <tr>
                  <!-- Email Button -->
                  <td
                    align="center"
                    style="padding: 0 5px 10px;"
                  >
                    <table
                      role="presentation"
                      cellspacing="0"
                      cellpadding="0"
                      border="0"
                    >
                      <tr>
                        <td
                          align="center"
                          bgcolor="#f58220"
                          style="
                            background-color: #f58220;
                            border-radius: 8px;
                          "
                        >
                          <a
                            href="mailto:${safeEmail}"
                            style="
                              display: inline-block;
                              padding: 13px 24px;
                              color: #ffffff;
                              font-size: 14px;
                              line-height: 1.4;
                              font-weight: 700;
                              text-decoration: none;
                            "
                          >
                            Reply by Email
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>

                  <!-- Call Button -->
                  <td
                    align="center"
                    style="padding: 0 5px 10px;"
                  >
                    <table
                      role="presentation"
                      cellspacing="0"
                      cellpadding="0"
                      border="0"
                    >
                      <tr>
                        <td
                          align="center"
                          bgcolor="#0f4f91"
                          style="
                            background-color: #0f4f91;
                            border-radius: 8px;
                          "
                        >
                          <a
                            href="tel:${safePhone}"
                            style="
                              display: inline-block;
                              padding: 13px 24px;
                              color: #ffffff;
                              font-size: 14px;
                              line-height: 1.4;
                              font-weight: 700;
                              text-decoration: none;
                            "
                          >
                            Call Requester
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p
                style="
                  margin: 0;
                  color: #334155;
                  font-size: 14px;
                  line-height: 1.6;
                "
              >
                Regards,<br />

                <strong style="color: #0f4f91;">
                  Bunndle Notification System
                </strong>
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td
              align="center"
              bgcolor="#f5f9fe"
              style="
                background-color: #f5f9fe;
                border-top: 1px solid #e3edf7;
                padding: 22px 18px;
              "
            >
              <p
                style="
                  margin: 0 0 8px;
                  color: #334155;
                  font-size: 13px;
                  line-height: 1.5;
                "
              >
                This is an automated admin notification from Bunndle.
              </p>

              <p
                style="
                  margin: 0;
                  color: #64748b;
                  font-size: 11px;
                  line-height: 1.5;
                "
              >
                © ${new Date().getFullYear()}
                Agent Alliance Private Limited.
                All rights reserved.
              </p>
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

export default adminCorporateRequestTemplate;