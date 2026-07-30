import nodemailer from "nodemailer";
import dotenv from "dotenv";

import {
  forgotPasswordTemplate,
} from "./otp_template.js";

dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",

  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },

  connectionTimeout: 20000,
  greetingTimeout: 20000,
  socketTimeout: 20000,
});

transporter.verify((error) => {
  if (error) {
    console.error(
      "❌ GMAIL SMTP VERIFY ERROR:",
      error.message
    );
  } else {
    console.log("✅ GMAIL SMTP READY");
  }
});

export const sendEmail = async ({
  to,
  subject,
  html,
  replyTo = null,
}) => {
  try {
    const info = await transporter.sendMail({
      from: `"Bunndle Rent" <${process.env.EMAIL_USER}>`,
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