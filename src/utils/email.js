import nodemailer from "nodemailer";
import { forgotPasswordTemplate } from "./otp_template.js";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendForgotPasswordOtp(email, name, otp) {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Password Reset OTP - Bundle Rent",
    html: forgotPasswordTemplate(name, otp),
  });
}