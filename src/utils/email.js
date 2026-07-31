import nodemailer from "nodemailer";
import dotenv from "dotenv";

import {
  forgotPasswordTemplate,
} from "./otp_template.js";

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT) || 587,

  // Port 587 ke liye false.
  // Port 465 use karne par true karna hota hai.
  secure: false,

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
      "✅ EMAIL SENT:",
      info.messageId
    );

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error(
      "❌ EMAIL SEND ERROR:",
      error.message
    );

    if (error.statusCode) {
      throw error;
    }

    const emailError = new Error(
      "Unable to send email."
    );

    emailError.statusCode = 502;

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