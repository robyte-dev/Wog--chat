import nodemailer from "nodemailer";

let transporter;

function getTransporter() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    const error = new Error("Email delivery is not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASS.");
    error.code = "EMAIL_NOT_CONFIGURED";
    throw error;
  }

  if (!transporter) {
    const port = Number(SMTP_PORT || 465);
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port,
      secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === "true" : port === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 15_000,
    });
  }
  return transporter;
}

function sender() {
  return process.env.SMTP_FROM || `WOG Support <${process.env.SMTP_USER}>`;
}

export async function sendPasswordResetCode(email, code) {
  const safeCode = code.split("").join(" ");
  await getTransporter().sendMail({
    from: sender(),
    to: email,
    subject: "Your WOG password reset code",
    text: `Your WOG verification code is ${code}. It expires in 5 minutes. If you did not request a password reset, you can ignore this email.`,
    html: `<div style="margin:0;background:#f1f5f9;padding:32px 16px;font-family:Arial,sans-serif;color:#0f172a"><div style="max-width:520px;margin:auto;border:1px solid #dbe4ee;border-radius:20px;background:#fff;padding:32px"><div style="font-size:13px;font-weight:700;letter-spacing:3px;color:#0891b2">WOG · ACCOUNT SECURITY</div><h1 style="margin:18px 0 8px;font-size:25px">Reset your password</h1><p style="color:#475569;line-height:1.6">Enter this one-time code in WOG to verify your email address.</p><div style="margin:26px 0;border-radius:14px;background:#ecfeff;padding:18px;text-align:center;color:#0e7490;font-size:32px;font-weight:700;letter-spacing:8px">${safeCode}</div><p style="color:#64748b;font-size:14px">This code expires in <strong>5 minutes</strong> and can only be used once.</p><p style="margin-top:24px;color:#64748b;font-size:13px">If you did not request this, ignore this message. Your password will not change.</p></div></div>`,
  });
}

export async function sendPasswordResetConfirmation(email) {
  await getTransporter().sendMail({
    from: sender(),
    to: email,
    subject: "Your WOG password was changed",
    text: "Your WOG password has been changed. If you did not make this change, contact WOG support immediately.",
    html: `<div style="margin:0;background:#f1f5f9;padding:32px 16px;font-family:Arial,sans-serif;color:#0f172a"><div style="max-width:520px;margin:auto;border:1px solid #dbe4ee;border-radius:20px;background:#fff;padding:32px"><div style="font-size:13px;font-weight:700;letter-spacing:3px;color:#0891b2">WOG · ACCOUNT SECURITY</div><h1 style="margin:18px 0 8px;font-size:25px">Password updated</h1><p style="color:#475569;line-height:1.6">Your WOG password was changed successfully. You can now sign in with your new password.</p><p style="margin-top:24px;color:#64748b;font-size:13px">If you did not make this change, contact WOG support immediately.</p></div></div>`,
  });
}

export async function sendNewDeviceLoginCode(email, code) {
  const safeCode = code.split("").join(" ");
  await getTransporter().sendMail({
    from: sender(),
    to: email,
    subject: "Verify this new WOG sign-in",
    text: `Your WOG sign-in code is ${code}. It expires in 5 minutes. If this was not you, change your password and review your active sessions.`,
    html: `<div style="margin:0;background:#f1f5f9;padding:32px 16px;font-family:Arial,sans-serif;color:#0f172a"><div style="max-width:520px;margin:auto;border:1px solid #dbe4ee;border-radius:20px;background:#fff;padding:32px"><div style="font-size:13px;font-weight:700;letter-spacing:3px;color:#0891b2">WOG · ACCOUNT SECURITY</div><h1 style="margin:18px 0 8px;font-size:25px">Verify this sign-in</h1><p style="color:#475569;line-height:1.6">We need to verify this browser before signing you in.</p><div style="margin:26px 0;border-radius:14px;background:#ecfeff;padding:18px;text-align:center;color:#0e7490;font-size:32px;font-weight:700;letter-spacing:8px">${safeCode}</div><p style="color:#64748b;font-size:14px">This code expires in <strong>5 minutes</strong> and can only be used once.</p><p style="margin-top:24px;color:#64748b;font-size:13px">If you did not try to sign in, ignore this email and change your password.</p></div></div>`,
  });
}
