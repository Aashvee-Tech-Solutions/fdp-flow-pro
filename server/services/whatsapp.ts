// WhatsApp Cloud API (Meta) integration
// Documentation: https://developers.facebook.com/docs/whatsapp/cloud-api

export interface WhatsAppMessageOptions {
  to: string; // Phone number in international format (e.g., +919876543210)
  message: string;
  templateName?: string;
  templateParams?: string[];
}

export async function sendWhatsAppMessage(options: WhatsAppMessageOptions): Promise<boolean> {
  try {
    const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL || "https://graph.facebook.com/v18.0";
    const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID;
    const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;

    if (!WHATSAPP_PHONE_ID || !WHATSAPP_TOKEN) {
      console.warn("⚠️ WhatsApp credentials not configured, skipping message");
      return false;
    }

    const url = `${WHATSAPP_API_URL}/${WHATSAPP_PHONE_ID}/messages`;

    const payload = options.templateName
      ? {
          messaging_product: "whatsapp",
          to: options.to,
          type: "template",
          template: {
            name: options.templateName,
            language: { code: "en" },
            components: options.templateParams
              ? [
                  {
                    type: "body",
                    parameters: options.templateParams.map((param) => ({
                      type: "text",
                      text: param,
                    })),
                  },
                ]
              : [],
          },
        }
      : {
          messaging_product: "whatsapp",
          to: options.to,
          type: "text",
          text: { body: options.message },
        };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${WHATSAPP_TOKEN}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("❌ WhatsApp API error:", error);
      return false;
    }

    const result = await response.json();
    console.log("✅ WhatsApp message sent:", result.messages[0].id);
    return true;
  } catch (error) {
    console.error("❌ WhatsApp send failed:", error);
    return false;
  }
}

// Alternative: Twilio WhatsApp integration
export async function sendWhatsAppViaTwilio(options: WhatsAppMessageOptions): Promise<boolean> {
  try {
    const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
    const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
    const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER;

    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_WHATSAPP_NUMBER) {
      console.warn("⚠️ Twilio WhatsApp credentials not configured");
      return false;
    }

    const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;

    const params = new URLSearchParams();
    params.append("From", `whatsapp:${TWILIO_WHATSAPP_NUMBER}`);
    params.append("To", `whatsapp:${options.to}`);
    params.append("Body", options.message);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString("base64")}`,
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("❌ Twilio WhatsApp error:", error);
      return false;
    }

    const result = await response.json();
    console.log("✅ Twilio WhatsApp sent:", result.sid);
    return true;
  } catch (error) {
    console.error("❌ Twilio WhatsApp failed:", error);
    return false;
  }
}

export async function sendConfirmationWhatsApp(data: {
  to: string;
  name: string;
  fdpTitle: string;
  paymentId: string;
  joiningLink?: string;
}) {
  const message = `
🎉 *Registration Confirmed*

Dear ${data.name},

Your registration for *${data.fdpTitle}* has been confirmed!

📄 Payment ID: ${data.paymentId}
${data.joiningLink ? `🔗 Join: ${data.joiningLink}` : ''}

You'll receive further updates soon.

- Aashvee FDP Team
  `.trim();

  return await sendWhatsAppMessage({
    to: data.to,
    message,
  });
}

export async function sendReminderWhatsApp(data: {
  to: string;
  name: string;
  fdpTitle: string;
  startDate: string;
  joiningLink: string;
}) {
  const message = `
📅 *FDP Reminder*

Dear ${data.name},

The FDP *${data.fdpTitle}* starts on *${data.startDate}*.

🔗 Join: ${data.joiningLink}

Please join on time!

- Aashvee FDP Team
  `.trim();

  return await sendWhatsAppMessage({
    to: data.to,
    message,
  });
}

export async function sendCertificateWhatsApp(data: {
  to: string;
  name: string;
  fdpTitle: string;
  certificateUrl: string;
}) {
  const message = `
🎓 *Certificate Generated*

Dear ${data.name},

Congratulations! Your certificate for *${data.fdpTitle}* is ready.

📥 Download: ${data.certificateUrl}

- Aashvee FDP Team
  `.trim();

  return await sendWhatsAppMessage({
    to: data.to,
    message,
  });
}
