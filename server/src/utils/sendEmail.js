import nodemailer from "nodemailer";

let transporter = null;

const createTransporter = () => {
  if (transporter) {
    return transporter;
  }

  const emailDevEcho = process.env.EMAIL_DEV_ECHO === "true";
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  // Development mode: log to console
  if (emailDevEcho || !smtpHost || !smtpUser || !smtpPass) {
    transporter = {
      sendMail: async (options) => {
        console.log("\n📧 EMAIL (DEV MODE)");
        console.log("To:", options.to);
        console.log("Subject:", options.subject);
        console.log("Body:", options.text || options.html);
        console.log("---\n");
        return { messageId: "dev-echo" };
      },
    };
    return transporter;
  }

  // Production mode: use SMTP
  transporter = nodemailer.createTransport({
    host: smtpHost,
    port: parseInt(smtpPort || "587"),
    secure: smtpPort === "465",
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  return transporter;
};

export const sendEmail = async ({ to, subject, text, html }) => {
  const emailTransporter = createTransporter();

  try {
    await emailTransporter.sendMail({
      from: process.env.SMTP_USER || "noreply@construction-safety.com",
      to,
      subject,
      text,
      html,
    });
    return { success: true };
  } catch (error) {
    console.error("Email send error:", error);
    return { success: false, error: error.message };
  }
};

export const sendOTPEmail = async (email, otpCode) => {
  const subject = "Verify Your Email - Construction Safety";
  const text = `Your verification code is: ${otpCode}\n\nThis code will expire in 10 minutes.`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Verify Your Email</h2>
      <p>Your verification code is:</p>
      <div style="background: #f0f0f0; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
        ${otpCode}
      </div>
      <p>This code will expire in 10 minutes.</p>
      <p>If you didn't request this code, please ignore this email.</p>
    </div>
  `;

  return sendEmail({ to: email, subject, text, html });
};

