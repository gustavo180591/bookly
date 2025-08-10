// src/lib/server/email.ts
import nodemailer from 'nodemailer';

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: false,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
});

export async function sendMail(opts: { to:string; subject:string; html:string }) {
  const from = process.env.SMTP_FROM ?? 'noreply@example.com';
  return transporter.sendMail({ from, ...opts });
}
