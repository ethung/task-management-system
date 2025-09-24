/**
 * Email service for authentication flows
 */

import nodemailer from "nodemailer";
import { AUTH_CONFIG } from "./config";

// Email templates
export const EMAIL_TEMPLATES = {
  emailVerification: {
    subject: "Verify your email address",
    html: (verificationUrl: string, userName?: string) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Welcome to Planner Project!</h2>
        <p>Hi ${userName || "there"},</p>
        <p>Thank you for registering with Planner Project. To complete your registration, please verify your email address by clicking the button below:</p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}"
             style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Verify Email Address
          </a>
        </div>

        <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #666;">${verificationUrl}</p>

        <p><strong>This link will expire in 24 hours.</strong></p>

        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 14px;">
          If you didn't create an account with Planner Project, you can safely ignore this email.
        </p>
      </div>
    `,
  },

  passwordReset: {
    subject: "Reset your password",
    html: (resetUrl: string, userName?: string) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Password Reset Request</h2>
        <p>Hi ${userName || "there"},</p>
        <p>We received a request to reset your password for your Planner Project account. Click the button below to reset your password:</p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}"
             style="background-color: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Reset Password
          </a>
        </div>

        <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #666;">${resetUrl}</p>

        <p><strong>This link will expire in 1 hour.</strong></p>

        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 14px;">
          If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.
        </p>
      </div>
    `,
  },

  passwordChanged: {
    subject: "Your password has been changed",
    html: (userName?: string) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Password Changed Successfully</h2>
        <p>Hi ${userName || "there"},</p>
        <p>This email confirms that your password for your Planner Project account has been successfully changed.</p>

        <p><strong>When:</strong> ${new Date().toLocaleString()}</p>

        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 14px;">
          If you didn't make this change, please contact our support team immediately.
        </p>
      </div>
    `,
  },
} as const;

/**
 * Creates and configures the email transporter
 */
function createTransporter() {
  if (process.env.NODE_ENV === "development" && !AUTH_CONFIG.SMTP.auth.user) {
    // Use Ethereal Email for development testing
    console.log("📧 Using Ethereal Email for development. Check console for preview URLs.");

    // Return a test transporter that just logs emails
    return {
      sendMail: async (options: any) => {
        console.log("📧 Email would be sent:", {
          to: options.to,
          subject: options.subject,
          html: options.html?.substring(0, 200) + "...",
        });
        return { messageId: "dev-" + Date.now() };
      },
    };
  }

  return nodemailer.createTransport({
    host: AUTH_CONFIG.SMTP.host,
    port: AUTH_CONFIG.SMTP.port,
    secure: false, // true for 465, false for other ports
    auth: AUTH_CONFIG.SMTP.auth.user ? AUTH_CONFIG.SMTP.auth : undefined,
  });
}

/**
 * Sends an email using the configured transporter
 */
export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: AUTH_CONFIG.EMAIL_FROM,
      to,
      subject,
      html,
    };

    const result = await transporter.sendMail(mailOptions);

    if (process.env.NODE_ENV === "development") {
      console.log("📧 Email sent successfully:", {
        to,
        subject,
        messageId: result.messageId,
      });
    }
  } catch (error) {
    console.error("📧 Email sending failed:", error);
    throw new Error("Failed to send email");
  }
}

/**
 * Sends email verification email
 */
export async function sendEmailVerification(
  email: string,
  token: string,
  userName?: string
): Promise<void> {
  const verificationUrl = `${AUTH_CONFIG.BASE_URL}/auth/verify-email?token=${token}`;

  await sendEmail({
    to: email,
    subject: EMAIL_TEMPLATES.emailVerification.subject,
    html: EMAIL_TEMPLATES.emailVerification.html(verificationUrl, userName),
  });
}

/**
 * Sends password reset email
 */
export async function sendPasswordReset(
  email: string,
  token: string,
  userName?: string
): Promise<void> {
  const resetUrl = `${AUTH_CONFIG.BASE_URL}/auth/reset-password?token=${token}`;

  await sendEmail({
    to: email,
    subject: EMAIL_TEMPLATES.passwordReset.subject,
    html: EMAIL_TEMPLATES.passwordReset.html(resetUrl, userName),
  });
}

/**
 * Sends password changed confirmation email
 */
export async function sendPasswordChanged(
  email: string,
  userName?: string
): Promise<void> {
  await sendEmail({
    to: email,
    subject: EMAIL_TEMPLATES.passwordChanged.subject,
    html: EMAIL_TEMPLATES.passwordChanged.html(userName),
  });
}