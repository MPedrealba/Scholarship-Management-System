import nodemailer from 'nodemailer';

/**
 * EARIST SFAO Institutional Mailer
 * Configured with Nodemailer for sending Gmail OTP verification codes and advisories.
 */

// Initialize Nodemailer Gmail Transporter
function createTransporter() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  const isConfigured =
    user &&
    pass &&
    !user.includes('your_email') &&
    !pass.includes('your_gmail_app_password');

  if (!isConfigured) {
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user,
      pass,
    },
  });
}

/**
 * Generate clean white EARIST institutional HTML email template
 */
function getOtpEmailHtml(name, otp) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>EARIST SFAO Password Recovery OTP</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
    }
    .wrapper {
      width: 100%;
      table-layout: fixed;
      background-color: #f8fafc;
      padding: 30px 10px;
    }
    .container {
      max-width: 560px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }
    .header {
      background-color: #800000;
      padding: 24px 28px;
      text-align: center;
      border-bottom: 4px solid #ffc107;
    }
    .header h1 {
      margin: 0;
      color: #ffffff;
      font-size: 17px;
      font-weight: 800;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .header p {
      margin: 4px 0 0;
      color: #fef08a;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .content {
      padding: 32px 28px 24px;
    }
    .salutation {
      font-size: 15px;
      font-weight: 600;
      color: #0f172a;
      margin-bottom: 12px;
    }
    .message {
      font-size: 13px;
      line-height: 1.6;
      color: #475569;
      margin-bottom: 24px;
    }
    .otp-box {
      background-color: #fef2f2;
      border: 2px dashed #800000;
      border-radius: 10px;
      padding: 18px 20px;
      text-align: center;
      margin: 20px 0;
    }
    .otp-code {
      font-family: 'Courier New', Courier, monospace;
      font-size: 34px;
      font-weight: 800;
      color: #800000;
      letter-spacing: 8px;
      margin: 4px 0;
    }
    .otp-label {
      font-size: 11px;
      font-weight: 700;
      color: #991b1b;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .expiry-note {
      font-size: 12px;
      color: #64748b;
      margin-top: 18px;
      line-height: 1.5;
    }
    .security-notice {
      background-color: #f1f5f9;
      border-left: 4px solid #800000;
      padding: 12px 14px;
      margin: 24px 0 12px;
      border-radius: 0 6px 6px 0;
      font-size: 11px;
      color: #334155;
      line-height: 1.5;
    }
    .footer {
      background-color: #f8fafc;
      border-top: 1px solid #e2e8f0;
      padding: 20px 28px;
      text-align: center;
      font-size: 11px;
      color: #94a3b8;
      line-height: 1.5;
    }
    .footer strong {
      color: #64748b;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <h1>Eulogio "Amang" Rodriguez Institute of Science and Technology</h1>
        <p>Scholarship and Financial Assistance Office (SFAO)</p>
      </div>
      <div class="content">
        <div class="salutation">Dear ${name || 'Institutional User'},</div>
        <div class="message">
          We received an institutional password recovery request for your EARIST SFAO Portal account. Please use the following 6-digit One-Time Password (OTP) to verify your identity and reset your password:
        </div>
        <div class="otp-box">
          <div class="otp-label">Verification Code</div>
          <div class="otp-code">${otp}</div>
        </div>
        <div class="expiry-note">
          <strong>Notice:</strong> This code is single-use and will expire in <strong>10 minutes</strong>. Do not disclose this code to anyone. SFAO staff will never request your verification code.
        </div>
        <div class="security-notice">
          <strong>Security Advisory:</strong> If you did not initiate this password recovery request, please disregard this email and verify your account credentials immediately.
        </div>
      </div>
      <div class="footer">
        <strong>EARIST Office of Student Financial Assistance (SFAO)</strong><br>
        Nagtahan, Sampaloc, Manila 1008 • Tel: (02) 8716-6273 • sfao@earist.edu.ph<br>
        In compliance with Republic Act No. 10173 (Data Privacy Act of 2012)
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Dispatch 6-digit OTP verification email via Gmail Nodemailer
 * @param {Object} options
 * @param {string} options.to - Recipient email address
 * @param {string} options.name - Recipient user display name
 * @param {string} options.otp - 6-digit OTP code
 * @returns {Promise<{ sent: boolean, messageId?: string, simulated?: boolean }>}
 */
export async function sendOtpEmail({ to, name, otp }) {
  const transporter = createTransporter();

  // If Gmail credentials are not configured or are placeholder, simulate dispatch and log prominently
  if (!transporter) {
    console.log(`\n======================================================`);
    console.log(` [SIMULATED GMAIL OTP DISPATCH - NO CREDENTIALS CONFIGURED]`);
    console.log(` Recipient: ${name} <${to}>`);
    console.log(` 6-Digit OTP Code: >>> ${otp} <<<`);
    console.log(` Expiration: 10 minutes`);
    console.log(` Set GMAIL_USER and GMAIL_APP_PASSWORD in server/.env to enable live delivery.`);
    console.log(`======================================================\n`);
    return {
      sent: true,
      simulated: true,
      messageId: `simulated-${Date.now()}`,
    };
  }

  const senderUser = process.env.GMAIL_USER;
  const mailOptions = {
    from: `"EARIST e-SFAO Portal" <${senderUser}>`,
    to,
    subject: `[EARIST e-SFAO] Password Recovery OTP Verification Code: ${otp}`,
    text: `EARIST SFAO Password Recovery\n\nYour 6-digit verification code is: ${otp}\n\nThis code is valid for 10 minutes. If you did not request this, please ignore this email.\n\nEARIST Scholarship and Financial Assistance Office`,
    html: getOtpEmailHtml(name, otp),
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(` [LIVE GMAIL OTP SENT] Message ID: ${info.messageId} to ${to}`);
    return {
      sent: true,
      simulated: false,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error(` [GMAIL DISPATCH FAILED]:`, error.message);
    // Fallback simulation so user testing is never blocked
    console.log(`\n======================================================`);
    console.log(` [OTP RESCUE FALLBACK FOR LOCAL TESTING]`);
    console.log(` To: ${to}`);
    console.log(` 6-Digit OTP Code: >>> ${otp} <<<`);
    console.log(`======================================================\n`);
    return {
      sent: true,
      simulated: true,
      messageId: `fallback-${Date.now()}`,
      warning: error.message,
    };
  }
}

export default {
  sendOtpEmail,
};
