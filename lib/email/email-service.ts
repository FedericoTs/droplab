/**
 * Email Notification Service
 *
 * Handles sending email notifications using Gmail SMTP (nodemailer)
 */

import type { Transporter } from "nodemailer";

// Singleton transporter instance
let transporterInstance: Transporter | null = null;

/**
 * Email configuration from environment
 */
export const emailConfig = {
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
  },
  from: process.env.SMTP_FROM || "Marketing Platform <noreply@marketingplatform.com>",
};

/**
 * Get or create email transporter
 */
async function getEmailTransporter(): Promise<Transporter> {
  if (transporterInstance) {
    return transporterInstance;
  }

  const nodemailer = await import("nodemailer");
  transporterInstance = nodemailer.default.createTransport(emailConfig);

  // Verify connection
  try {
    await transporterInstance.verify();
    console.log("✅ Email service connected");
  } catch (error) {
    console.error("❌ Email service connection failed:", error);
    throw new Error("Failed to connect to email service. Check SMTP credentials.");
  }

  return transporterInstance;
}

/**
 * Send email
 */
export async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<boolean> {
  try {
    if (!emailConfig.auth.user || !emailConfig.auth.pass) {
      console.warn("⚠️ SMTP credentials not configured. Skipping email send.");
      return false;
    }

    const transporter = await getEmailTransporter();

    const info = await transporter.sendMail({
      from: emailConfig.from,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });

    console.log(`✅ Email sent to ${options.to}: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send email to ${options.to}:`, error);
    return false;
  }
}

/**
 * Send batch completion notification
 */
export async function sendBatchCompleteEmail(data: {
  userEmail: string;
  batchJobId: string;
  campaignName: string;
  totalRecipients: number;
  successCount: number;
  failedCount: number;
  downloadUrl: string;
}): Promise<boolean> {
  const successRate = ((data.successCount / data.totalRecipients) * 100).toFixed(2);

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      border-radius: 8px 8px 0 0;
      text-align: center;
    }
    .content {
      background: #ffffff;
      padding: 30px;
      border: 1px solid #e2e8f0;
      border-top: none;
    }
    .stats {
      background: #f7fafc;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .stat-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #e2e8f0;
    }
    .stat-row:last-child {
      border-bottom: none;
    }
    .stat-label {
      font-weight: 600;
      color: #4a5568;
    }
    .stat-value {
      color: #2d3748;
    }
    .success {
      color: #48bb78;
      font-weight: bold;
    }
    .failed {
      color: #f56565;
      font-weight: bold;
    }
    .button {
      display: inline-block;
      background: #667eea;
      color: white;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      margin: 20px 0;
    }
    .footer {
      text-align: center;
      color: #718096;
      font-size: 14px;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1 style="margin: 0; font-size: 28px;">✅ Batch Complete!</h1>
    <p style="margin: 10px 0 0 0; opacity: 0.9;">Your direct mail campaign is ready</p>
  </div>

  <div class="content">
    <p style="font-size: 16px; margin-top: 0;">Hi there,</p>

    <p>Great news! Your batch job "<strong>${data.campaignName}</strong>" has been completed successfully.</p>

    <div class="stats">
      <div class="stat-row">
        <span class="stat-label">Total Recipients:</span>
        <span class="stat-value">${data.totalRecipients.toLocaleString()}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Successful:</span>
        <span class="stat-value success">${data.successCount.toLocaleString()} (${successRate}%)</span>
      </div>
      ${
        data.failedCount > 0
          ? `
      <div class="stat-row">
        <span class="stat-label">Failed:</span>
        <span class="stat-value failed">${data.failedCount.toLocaleString()}</span>
      </div>
      `
          : ""
      }
    </div>

    <p style="margin-top: 30px;">Your direct mail PDFs are ready to download:</p>

    <div style="text-align: center;">
      <a href="${data.downloadUrl}" class="button">📥 Download ZIP File</a>
    </div>

    <p style="font-size: 14px; color: #718096; margin-top: 30px;">
      <strong>Job ID:</strong> ${data.batchJobId}<br>
      You can also view the results in your <a href="${process.env.NEXT_PUBLIC_APP_URL}/batch-jobs/${data.batchJobId}">batch jobs dashboard</a>.
    </p>
  </div>

  <div class="footer">
    <p>🤖 Marketing AI Platform</p>
    <p style="font-size: 12px; color: #a0aec0;">
      This is an automated notification. Please do not reply to this email.
    </p>
  </div>
</body>
</html>
  `;

  const text = `
Batch Complete: ${data.campaignName}

Your batch job has been completed successfully!

Summary:
- Total: ${data.totalRecipients}
- Success: ${data.successCount} (${successRate}%)
${data.failedCount > 0 ? `- Failed: ${data.failedCount}` : ""}

Download your DMs: ${data.downloadUrl}

Job ID: ${data.batchJobId}
  `;

  return sendEmail({
    to: data.userEmail,
    subject: `✅ Your batch of ${data.totalRecipients.toLocaleString()} DMs is ready!`,
    html,
    text,
  });
}

/**
 * Send batch failure notification
 */
export async function sendBatchFailedEmail(data: {
  userEmail: string;
  batchJobId: string;
  campaignName: string;
  totalRecipients: number;
  processedCount: number;
  errorMessage: string;
}): Promise<boolean> {
  const progressPercent = ((data.processedCount / data.totalRecipients) * 100).toFixed(2);

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #fc8181 0%, #f56565 100%);
      color: white;
      padding: 30px;
      border-radius: 8px 8px 0 0;
      text-align: center;
    }
    .content {
      background: #ffffff;
      padding: 30px;
      border: 1px solid #e2e8f0;
      border-top: none;
    }
    .error-box {
      background: #fff5f5;
      border-left: 4px solid #f56565;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .stats {
      background: #f7fafc;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .button {
      display: inline-block;
      background: #667eea;
      color: white;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      margin: 10px 5px;
    }
    .button-secondary {
      background: #718096;
    }
    .footer {
      text-align: center;
      color: #718096;
      font-size: 14px;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1 style="margin: 0; font-size: 28px;">❌ Batch Job Failed</h1>
    <p style="margin: 10px 0 0 0; opacity: 0.9;">${data.campaignName}</p>
  </div>

  <div class="content">
    <p style="font-size: 16px; margin-top: 0;">Hi there,</p>

    <p>Unfortunately, your batch job "<strong>${data.campaignName}</strong>" has failed.</p>

    <div class="error-box">
      <strong>❌ Error:</strong><br>
      <code style="font-size: 13px; color: #c53030;">${data.errorMessage}</code>
    </div>

    <div class="stats">
      <p style="margin: 0 0 10px 0;"><strong>Progress before failure:</strong></p>
      <p style="margin: 5px 0;">Processed: <strong>${data.processedCount} / ${data.totalRecipients}</strong> (${progressPercent}%)</p>
    </div>

    <p><strong>🔧 What to do next:</strong></p>
    <ol>
      <li>Check that your template still exists</li>
      <li>Verify all CSV data is valid</li>
      <li>Retry the batch job from the dashboard</li>
      <li>Contact support if the issue persists</li>
    </ol>

    <div style="text-align: center; margin-top: 30px;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/batch-jobs/${data.batchJobId}" class="button">🔍 View Details</a>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/batch-jobs/${data.batchJobId}/retry" class="button button-secondary">🔄 Retry Job</a>
    </div>

    <p style="font-size: 14px; color: #718096; margin-top: 30px;">
      <strong>Job ID:</strong> ${data.batchJobId}
    </p>
  </div>

  <div class="footer">
    <p>🤖 Marketing AI Platform</p>
    <p style="font-size: 12px; color: #a0aec0;">
      Need help? Contact our support team.
    </p>
  </div>
</body>
</html>
  `;

  const text = `
Batch Job Failed: ${data.campaignName}

Unfortunately, your batch job has failed.

Error: ${data.errorMessage}

Progress before failure:
- Processed: ${data.processedCount} / ${data.totalRecipients} (${progressPercent}%)

What to do next:
1. Check that your template still exists
2. Verify all CSV data is valid
3. Retry the batch job
4. Contact support if needed

View details: ${process.env.NEXT_PUBLIC_APP_URL}/batch-jobs/${data.batchJobId}

Job ID: ${data.batchJobId}
  `;

  return sendEmail({
    to: data.userEmail,
    subject: `❌ Batch job failed: ${data.campaignName}`,
    html,
    text,
  });
}

/**
 * Test email configuration
 */
export async function testEmailConnection(): Promise<boolean> {
  try {
    const transporter = await getEmailTransporter();
    await transporter.verify();
    console.log("✅ Email configuration is valid");
    return true;
  } catch (error) {
    console.error("❌ Email configuration test failed:", error);
    return false;
  }
}

/**
 * Close email transporter (for graceful shutdown)
 */
export async function closeEmailService(): Promise<void> {
  if (transporterInstance) {
    transporterInstance.close();
    transporterInstance = null;
    console.log("✅ Email service closed");
  }
}
