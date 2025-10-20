import { Resend } from "resend";
import twilio from "twilio";

// Don't initialize at module scope - do it lazily when needed
let resend: Resend | null = null;
let twilioClient: ReturnType<typeof twilio> | null = null;

function getResendClient() {
  if (!process.env.RESEND_API_KEY) {
    return null;
  }
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

function getTwilioClient() {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    return null;
  }
  if (!twilioClient) {
    twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
  }
  return twilioClient;
}

interface EmailParams {
  to: string;
  subject: string;
  html: string;
}

interface SMSParams {
  to: string;
  message: string;
}

/**
 * Send email via Resend
 */
export async function sendEmail({ to, subject, html }: EmailParams) {
  const resendClient = getResendClient();
  if (!resendClient) {
    console.warn("RESEND_API_KEY not configured, skipping email");
    return { success: false, error: "Email service not configured" };
  }

  try {
    const { data, error } = await resendClient.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
      to,
      subject,
      html,
    });

    if (error) {
      console.error("Error sending email:", error);
      return { success: false, error };
    }

    console.log("Email sent successfully:", data);
    return { success: true, data };
  } catch (error) {
    console.error("Error in sendEmail:", error);
    return { success: false, error };
  }
}

/**
 * Send SMS via Twilio
 */
export async function sendSMS({ to, message }: SMSParams) {
  const twilioClient = getTwilioClient();
  if (!twilioClient) {
    console.warn("Twilio not configured, skipping SMS");
    return { success: false, error: "SMS service not configured" };
  }

  try {
    const result = await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to,
    });

    console.log("SMS sent successfully:", result.sid);
    return { success: true, data: result };
  } catch (error) {
    console.error("Error in sendSMS:", error);
    return { success: false, error };
  }
}

/**
 * Send reminder notification (email or SMS)
 */
export async function sendReminderNotification(
  type: "EMAIL" | "SMS",
  to: string,
  message: string,
  subject?: string
) {
  if (type === "EMAIL") {
    return await sendEmail({
      to,
      subject: subject || "Upomienka - Omeškanie splátky",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #1e3a8a 0%, #ea580c 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">Nafinancuj.sk</h1>
          </div>
          <div style="padding: 30px; background: #f9fafb;">
            <div style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              ${message.split("\n").map((line) => `<p style="margin: 10px 0; color: #374151;">${line}</p>`).join("")}
            </div>
          </div>
          <div style="background: #1f2937; padding: 20px; text-align: center;">
            <p style="color: #9ca3af; margin: 0; font-size: 12px;">
              © ${new Date().getFullYear()} Nafinancuj.sk - Platforma pre správu úverov
            </p>
          </div>
        </div>
      `,
    });
  } else {
    return await sendSMS({ to, message });
  }
}

/**
 * Send loan approval notification
 */
export async function sendLoanApprovalEmail(
  to: string,
  clientName: string,
  loanAmount: string,
  variableSymbol: string
) {
  return await sendEmail({
    to,
    subject: "Schválenie úveru - Nafinancuj.sk",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #1e3a8a 0%, #ea580c 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">Nafinancuj.sk</h1>
        </div>
        <div style="padding: 30px; background: #f9fafb;">
          <div style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <h2 style="color: #1e3a8a; margin-top: 0;">Gratulujeme! Váš úver bol schválený</h2>
            <p style="color: #374151;">Dobrý deň ${clientName},</p>
            <p style="color: #374151;">s radosťou Vám oznamujeme, že Vaša žiadosť o úver bola schválená.</p>
            <div style="background: #eff6ff; border-left: 4px solid #1e3a8a; padding: 20px; margin: 20px 0;">
              <p style="margin: 5px 0; color: #1e3a8a;"><strong>Výška úveru:</strong> €${loanAmount}</p>
              <p style="margin: 5px 0; color: #1e3a8a;"><strong>Variabilný symbol:</strong> ${variableSymbol}</p>
            </div>
            <p style="color: #374151;">V najbližších dňoch Vás budeme kontaktovať ohľadom ďalších krokov.</p>
            <p style="color: #374151;">S pozdravom,<br>Váš tím Nafinancuj.sk</p>
          </div>
        </div>
        <div style="background: #1f2937; padding: 20px; text-align: center;">
          <p style="color: #9ca3af; margin: 0; font-size: 12px;">
            © ${new Date().getFullYear()} Nafinancuj.sk - Platforma pre správu úverov
          </p>
        </div>
      </div>
    `,
  });
}

/**
 * Send payment confirmation notification
 */
export async function sendPaymentConfirmationEmail(
  to: string,
  clientName: string,
  amount: string,
  variableSymbol: string,
  remainingBalance: string
) {
  return await sendEmail({
    to,
    subject: "Potvrdenie platby - Nafinancuj.sk",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #1e3a8a 0%, #ea580c 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">Nafinancuj.sk</h1>
        </div>
        <div style="padding: 30px; background: #f9fafb;">
          <div style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <h2 style="color: #059669; margin-top: 0;">✓ Platba prijatá</h2>
            <p style="color: #374151;">Dobrý deň ${clientName},</p>
            <p style="color: #374151;">potvrdujeme prijatie Vašej platby.</p>
            <div style="background: #ecfdf5; border-left: 4px solid #059669; padding: 20px; margin: 20px 0;">
              <p style="margin: 5px 0; color: #059669;"><strong>Suma platby:</strong> €${amount}</p>
              <p style="margin: 5px 0; color: #059669;"><strong>Variabilný symbol:</strong> ${variableSymbol}</p>
              <p style="margin: 5px 0; color: #059669;"><strong>Zostávajúci zostatok:</strong> €${remainingBalance}</p>
            </div>
            <p style="color: #374151;">Ďakujeme za Vašu platbu.</p>
            <p style="color: #374151;">S pozdravom,<br>Váš tím Nafinancuj.sk</p>
          </div>
        </div>
        <div style="background: #1f2937; padding: 20px; text-align: center;">
          <p style="color: #9ca3af; margin: 0; font-size: 12px;">
            © ${new Date().getFullYear()} Nafinancuj.sk - Platforma pre správu úverov
          </p>
        </div>
      </div>
    `,
  });
}

