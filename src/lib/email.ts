import nodemailer from "nodemailer";

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text: string;
}

const emailFrom = process.env.EMAIL_FROM || 'DevVerse <onboarding@resend.dev>';

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (transporter) return transporter;

  const provider = (process.env.EMAIL_PROVIDER || "development").toLowerCase();

  const host = process.env.SMTP_HOST || (process.env.SMTP_USER?.includes("@gmail.com") ? "smtp.gmail.com" : "");

  if (provider === "smtp" && host) {
    const rawPass = process.env.SMTP_PASS || "";
    // Clean up spaces often found in Gmail 16-character App Passwords
    const cleanPass = host.includes("gmail.com") ? rawPass.replace(/\s+/g, "") : rawPass;

    transporter = nodemailer.createTransport({
      host,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true" || Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER || "",
        pass: cleanPass,
      },
      connectionTimeout: 6000,
      greetingTimeout: 6000,
      socketTimeout: 10000,
    });
    return transporter;
  }

  return null;
}

export async function sendEmail({ to, subject, html, text }: SendEmailParams): Promise<boolean> {
  // 1. Brevo REST API (HTTPS port 443 - sends to ANY recipient without requiring a custom domain)
  const brevoApiKey = process.env.BREVO_API_KEY?.trim();
  if (brevoApiKey) {
    try {
      const senderEmail = process.env.BREVO_SENDER_EMAIL?.trim() || "ombid52@gmail.com";
      const senderName = process.env.BREVO_SENDER_NAME || "DevVerse";
      const res = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "api-key": brevoApiKey,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          sender: { name: senderName, email: senderEmail },
          to: [{ email: to }],
          subject,
          htmlContent: html,
          textContent: text,
        }),
      });

      if (res.ok) {
        console.log(`[DevVerse Email] Successfully dispatched via Brevo API to ${to}`);
        return true;
      } else {
        const errJson = await res.json().catch(() => ({}));
        console.error("[DevVerse Email] Brevo API error:", errJson);
      }
    } catch (err: any) {
      console.error("[DevVerse Email] Brevo API call failed:", err.message);
    }
  }

  // 2. Resend REST API (over HTTPS port 443)
  const resendApiKey = process.env.RESEND_API_KEY?.trim();
  if (resendApiKey) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || "DevVerse <onboarding@resend.dev>",
          to: [to],
          subject,
          html,
          text,
        }),
      });

      if (res.ok) {
        console.log(`[DevVerse Email] Successfully dispatched via Resend API to ${to}`);
        return true;
      } else {
        const errJson = await res.json().catch(() => ({}));
        console.error("[DevVerse Email] Resend API error:", errJson);
      }
    } catch (err: any) {
      console.error("[DevVerse Email] Resend API call failed:", err.message);
    }
  }

  // 2. Secondary Provider: Direct SMTP Transport
  const mailer = getTransporter();

  if (mailer) {
    try {
      const sendPromise = mailer.sendMail({
        from: emailFrom,
        to,
        subject,
        html,
        text,
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("SMTP sendMail timed out after 8s")), 8000)
      );

      await Promise.race([sendPromise, timeoutPromise]);
      console.log(`[DevVerse Email] Dispatched to ${to}`);
      return true;
    } catch (err: any) {
      console.error("[Email Service Error]", err.message);
      // Fallback to console output if SMTP fails
    }
  }

  // Development/fallback mode: log cleanly to console for testing/onboarding
  console.log("==================================================");
  console.log(`[DevVerse Email Dispatcher - Dev/Local Mode]`);
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`Content:\n${text}`);
  console.log("==================================================");

  return true;
}

export async function sendVerificationCodeEmail(to: string, code: string, username: string): Promise<boolean> {
  const subject = `Your DevVerse Verification Code: ${code}`;
  const text = `Hello ${username},\n\nYour 6-digit DevVerse email verification code is: ${code}\n\nThis code will expire in 15 minutes. If you did not register for DevVerse, please ignore this email.\n\nBest regards,\nThe DevVerse Team`;
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px;">
      <h2 style="color: #111827; font-size: 20px; margin-bottom: 16px; font-weight: 600;">Verify your DevVerse account</h2>
      <p style="color: #4b5563; font-size: 15px; line-height: 1.5;">Hello <strong>${username}</strong>,</p>
      <p style="color: #4b5563; font-size: 15px; line-height: 1.5;">Use the following six-digit code to complete your registration or verification:</p>
      <div style="margin: 28px 0; text-align: center;">
        <span style="display: inline-block; font-size: 32px; font-weight: 700; letter-spacing: 6px; padding: 12px 28px; background: #f3f4f6; color: #1a73e8; border-radius: 6px; border: 1px solid #d1d5db;">${code}</span>
      </div>
      <p style="color: #6b7280; font-size: 13px; line-height: 1.5;">This code will expire in 15 minutes. For security, never share this code with anyone.</p>
      <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
      <p style="color: #9ca3af; font-size: 12px; margin: 0;">DevVerse Platform &bull; Cloud Application Showcase & Source Code Sharing</p>
    </div>
  `;

  return sendEmail({ to, subject, html, text });
}

export async function sendPasswordResetEmail(to: string, code: string, username: string): Promise<boolean> {
  const subject = `DevVerse Password Reset Code: ${code}`;
  const text = `Hello ${username},\n\nWe received a request to reset your DevVerse password.\nYour reset code is: ${code}\n\nThis code will expire in 15 minutes. If you did not request a password reset, you can safely ignore this email.\n\nBest regards,\nThe DevVerse Team`;
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px;">
      <h2 style="color: #111827; font-size: 20px; margin-bottom: 16px; font-weight: 600;">Reset your DevVerse password</h2>
      <p style="color: #4b5563; font-size: 15px; line-height: 1.5;">Hello <strong>${username}</strong>,</p>
      <p style="color: #4b5563; font-size: 15px; line-height: 1.5;">Enter the following reset code to establish a new password:</p>
      <div style="margin: 28px 0; text-align: center;">
        <span style="display: inline-block; font-size: 32px; font-weight: 700; letter-spacing: 6px; padding: 12px 28px; background: #f3f4f6; color: #1a73e8; border-radius: 6px; border: 1px solid #d1d5db;">${code}</span>
      </div>
      <p style="color: #6b7280; font-size: 13px; line-height: 1.5;">This code expires in 15 minutes. If you did not request this, please ensure your account is secure.</p>
    </div>
  `;

  return sendEmail({ to, subject, html, text });
}
