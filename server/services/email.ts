import nodemailer from "nodemailer";

// Create transporter using environment variables
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
  attachments?: Array<{
    filename: string;
    path?: string;
    content?: Buffer;
  }>;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    const info = await transporter.sendMail({
      from: options.from || process.env.SMTP_FROM || "noreply@aashveefdp.com",
      to: options.to,
      subject: options.subject,
      html: options.html,
      attachments: options.attachments,
    });

    console.log("✅ Email sent:", info.messageId);
    return true;
  } catch (error) {
    console.error("❌ Email send failed:", error);
    return false;
  }
}

export async function sendConfirmationEmail(data: {
  to: string;
  name: string;
  fdpTitle: string;
  paymentId: string;
  joiningLink?: string;
}) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #3b82f6, #ec4899); color: white; padding: 30px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .details { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #3b82f6; }
        .button { display: inline-block; padding: 12px 30px; background: #3b82f6; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Registration Confirmed!</h1>
        </div>
        <div class="content">
          <p>Dear ${data.name},</p>
          <p>Your registration for <strong>${data.fdpTitle}</strong> has been successfully confirmed.</p>
          
          <div class="details">
            <p><strong>Payment ID:</strong> ${data.paymentId}</p>
            ${data.joiningLink ? `<p><strong>Joining Link:</strong> <a href="${data.joiningLink}">${data.joiningLink}</a></p>` : ''}
          </div>
          
          ${data.joiningLink ? `<a href="${data.joiningLink}" class="button">Join FDP</a>` : ''}
          
          <p>You will receive further updates via email and WhatsApp.</p>
          <p>Best regards,<br>Aashvee FDP Team</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: data.to,
    subject: `Registration Confirmed - ${data.fdpTitle}`,
    html,
  });
}

export async function sendReminderEmail(data: {
  to: string;
  name: string;
  fdpTitle: string;
  startDate: string;
  joiningLink: string;
}) {
  const html = `
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; padding: 20px;">
      <h2>📅 FDP Reminder</h2>
      <p>Dear ${data.name},</p>
      <p>This is a reminder that the FDP <strong>${data.fdpTitle}</strong> starts on <strong>${data.startDate}</strong>.</p>
      <p>Joining Link: <a href="${data.joiningLink}">${data.joiningLink}</a></p>
      <p>Please ensure you join on time.</p>
      <p>Best regards,<br>Aashvee FDP Team</p>
    </body>
    </html>
  `;

  return await sendEmail({
    to: data.to,
    subject: `Reminder: ${data.fdpTitle} - Starting Soon`,
    html,
  });
}

export async function sendCertificateEmail(data: {
  to: string;
  name: string;
  fdpTitle: string;
  certificateUrl: string;
}) {
  const html = `
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; padding: 20px;">
      <h2>🎓 Certificate Generated</h2>
      <p>Dear ${data.name},</p>
      <p>Congratulations! Your certificate for <strong>${data.fdpTitle}</strong> has been generated.</p>
      <p><a href="${data.certificateUrl}" style="display: inline-block; padding: 12px 30px; background: #3b82f6; color: white; text-decoration: none; border-radius: 5px;">Download Certificate</a></p>
      <p>Best regards,<br>Aashvee FDP Team</p>
    </body>
    </html>
  `;

  return await sendEmail({
    to: data.to,
    subject: `Certificate - ${data.fdpTitle}`,
    html,
  });
}
