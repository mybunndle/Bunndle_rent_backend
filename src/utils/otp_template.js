export function forgotPasswordTemplate(name, otp) {
  return `
    <div style="
      max-width:600px;
      margin:auto;
      font-family:Arial,sans-serif;
      border:1px solid #e5e7eb;
      border-radius:10px;
      overflow:hidden;
    ">
      <div style="
        background:#2563eb;
        color:white;
        padding:20px;
        text-align:center;
      ">
        <h1>Bundle Rent</h1>
      </div>

      <div style="padding:30px;">
        <h2>Hello ${name},</h2>

        <p>
          We received a request to reset your password.
        </p>

        <p>Your OTP is:</p>

        <div style="
          text-align:center;
          margin:25px 0;
        ">
          <span style="
            font-size:32px;
            font-weight:bold;
            letter-spacing:6px;
            color:#2563eb;
          ">
            ${otp}
          </span>
        </div>

        <p>
          This OTP is valid for <b>10 minutes</b>.
        </p>

        <p>
          If you did not request a password reset, please ignore this email.
        </p>

        <p>Thank you,<br/><b>Bundle Rent Team</b></p>
      </div>
    </div>
  `;
}