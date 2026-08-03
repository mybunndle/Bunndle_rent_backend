import nodemailer from "nodemailer";

import {
  forgotPasswordTemplate,
} from "./otp_template.js";

const emailPort =
  Number(process.env.EMAIL_PORT) || 587;

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: emailPort,

  // Port 465 = true
  // Port 587 = false
  secure: emailPort === 465,

  auth: {
    user: process.env.EMAIL_USER?.trim(),
    pass: process.env.EMAIL_PASS?.trim(),
  },

  connectionTimeout: 20000,
  greetingTimeout: 20000,
  socketTimeout: 20000,
});

transporter.verify((error) => {
  if (error) {
    console.error(
      "❌ BREVO SMTP VERIFY ERROR:",
      error.message
    );
  } else {
    console.log("✅ BREVO SMTP READY");
  }
});

export const sendEmail = async ({
  to,
  subject,
  html,
  replyTo = null,
}) => {
  try {
    if (!to) {
      const error = new Error(
        "Recipient email is required."
      );

      error.statusCode = 400;
      throw error;
    }

    if (!process.env.EMAIL_FROM) {
      throw new Error(
        "EMAIL_FROM is missing in environment variables."
      );
    }

    const info = await transporter.sendMail({
      from: `"Bunndle Rent" <${process.env.EMAIL_FROM}>`,
      to,
      subject,
      html,

      ...(replyTo && {
        replyTo,
      }),
    });

    console.log(
      `✅ EMAIL SENT TO ${to}:`,
      info.messageId
    );

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error(
      `❌ EMAIL SEND ERROR TO ${to}:`,
      error.message
    );

    if (error.statusCode) {
      throw error;
    }

    const emailError = new Error(
      "Unable to send email."
    );

    emailError.statusCode = 502;
    emailError.originalError = error;

    throw emailError;
  }
};

export const sendForgotPasswordOtp = async (
  email,
  name,
  otp
) => {
  return sendEmail({
    to: email,
    subject:
      "Password Reset OTP - Bunndle Rent",
    html: forgotPasswordTemplate(
      name,
      otp
    ),
  });
};

export default sendEmail;