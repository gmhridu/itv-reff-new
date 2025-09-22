import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface EmailServiceResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export class EmailService {
  /**
   * Send password reset email
   */
  static async sendPasswordResetEmail(
    email: string,
    resetToken: string,
    baseUrl: string = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  ): Promise<EmailServiceResult> {
    try {
      // Create reset link
      const resetLink = `${baseUrl}/reset-password?token=${resetToken}`;

      // Create professional enterprise-grade HTML email template
      const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password - ICL Finance</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333333;
              background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
              min-height: 100vh;
              padding: 20px;
            }
            .email-container {
              max-width: 600px;
              margin: 0 auto;
              background: #ffffff;
              border-radius: 16px;
              overflow: hidden;
              box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
              border: 1px solid rgba(255, 255, 255, 0.2);
            }
            .header {
              background: linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #60a5fa 100%);
              padding: 50px 40px;
              text-align: center;
              position: relative;
              overflow: hidden;
            }
            .header::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="75" cy="75" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="50" cy="10" r="0.5" fill="rgba(255,255,255,0.1)"/><circle cx="10" cy="60" r="0.5" fill="rgba(255,255,255,0.1)"/><circle cx="90" cy="40" r="0.5" fill="rgba(255,255,255,0.1)"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
              opacity: 0.3;
            }
            .logo-container {
              margin-bottom: 30px;
              position: relative;
              z-index: 2;
            }
            .logo {
              width: 80px;
              height: 80px;
              background: rgba(255, 255, 255, 0.15);
              border-radius: 20px;
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 0 auto;
              backdrop-filter: blur(10px);
              border: 2px solid rgba(255, 255, 255, 0.2);
              box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
              position: relative;
              overflow: hidden;
            }
            .logo::before {
              content: 'ICL';
              font-size: 24px;
              font-weight: 700;
              color: #ffffff;
              text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
              letter-spacing: 1px;
            }
            .logo::after {
              content: 'FINANCE';
              position: absolute;
              bottom: 8px;
              left: 50%;
              transform: translateX(-50%);
              font-size: 10px;
              font-weight: 500;
              color: rgba(255, 255, 255, 0.9);
              letter-spacing: 0.5px;
            }
            .header h1 {
              font-size: 32px;
              font-weight: 700;
              margin: 0 0 15px;
              color: #ffffff;
              text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
              letter-spacing: -0.025em;
              position: relative;
              z-index: 2;
            }
            .header p {
              font-size: 18px;
              opacity: 0.95;
              margin: 0;
              font-weight: 400;
              color: #ffffff;
              position: relative;
              z-index: 2;
            }
            .content {
              padding: 50px 40px;
              background: #ffffff;
            }
            .greeting {
              font-size: 18px;
              color: #1f2937;
              margin-bottom: 25px;
              font-weight: 500;
            }
            .message {
              font-size: 16px;
              line-height: 1.7;
              color: #4b5563;
              margin-bottom: 35px;
            }
            .highlight {
              color: #1e40af;
              font-weight: 600;
              background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
              padding: 2px 6px;
              border-radius: 4px;
            }
            .reset-button {
              text-align: center;
              margin: 40px 0;
            }
            .reset-btn {
              display: inline-block;
              background: linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #60a5fa 100%);
              color: #ffffff !important;
              text-decoration: none;
              padding: 18px 40px;
              border-radius: 12px;
              font-size: 16px;
              font-weight: 600;
              box-shadow: 0 8px 25px rgba(30, 64, 175, 0.3);
              border: none;
              transition: all 0.3s ease;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              position: relative;
              overflow: hidden;
              text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
            }
            .reset-btn::before {
              content: '';
              position: absolute;
              top: 0;
              left: -100%;
              width: 100%;
              height: 100%;
              background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
              transition: left 0.5s;
            }
            .reset-btn:hover::before {
              left: 100%;
            }
            .reset-btn:hover {
              transform: translateY(-2px);
              box-shadow: 0 12px 35px rgba(30, 64, 175, 0.4);
            }
            .security-notice {
              background: linear-gradient(135deg, #fef3c7 0%, #fed7aa 100%);
              border: 1px solid #f59e0b;
              border-radius: 12px;
              padding: 25px;
              margin: 30px 0;
              position: relative;
            }
            .security-notice::before {
              content: '⚠️';
              position: absolute;
              top: 15px;
              left: 15px;
              font-size: 20px;
            }
            .security-content {
              margin-left: 35px;
            }
            .security-title {
              font-size: 16px;
              font-weight: 600;
              color: #92400e;
              margin-bottom: 8px;
            }
            .security-text {
              font-size: 14px;
              color: #78350f;
              line-height: 1.6;
            }
            .info-section {
              background: #f8fafc;
              border-radius: 12px;
              padding: 25px;
              border-left: 4px solid #3b82f6;
            }
            .info-title {
              font-size: 14px;
              font-weight: 600;
              color: #1e40af;
              margin-bottom: 10px;
            }
            .info-text {
              font-size: 13px;
              color: #64748b;
              line-height: 1.5;
            }
            .footer {
              background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
              padding: 40px;
              text-align: center;
              color: #ffffff;
            }
            .footer-content {
              margin-bottom: 25px;
            }
            .footer p {
              margin: 5px 0;
              font-size: 14px;
              opacity: 0.8;
            }
            .footer-logo {
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 15px;
              margin-top: 25px;
            }
            .footer-logo-icon {
              width: 40px;
              height: 40px;
              background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
              border-radius: 10px;
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
            }
            .footer-logo-text {
              font-size: 20px;
              font-weight: 600;
              color: #ffffff;
            }
            @media (max-width: 640px) {
              .email-container {
                margin: 10px;
                border-radius: 12px;
              }
              .header {
                padding: 40px 30px;
              }
              .header h1 {
                font-size: 28px;
              }
              .content {
                padding: 40px 30px;
              }
              .reset-btn {
                padding: 16px 32px;
                font-size: 15px;
              }
            }
          </style>
        </head>
        <body>
          <div class="email-container">
            <!-- Header -->
            <div class="header">
              <div class="logo-container">
                <div class="logo">
                </div>
              </div>
              <h1>Reset Your Password</h1>
              <p>Secure your ICL Finance account</p>
            </div>

            <!-- Content -->
            <div class="content">
              <div class="greeting">Hello,</div>

              <div class="message">
                <p>We received a request to reset the password for your <span class="highlight">ICL Finance</span> account associated with <strong>${email}</strong>.</p>

                <p>If you made this request, click the secure button below to create a new password. This link will expire in <strong>15 minutes</strong> for security reasons.</p>
              </div>

              <!-- Reset Button -->
              <div class="reset-button">
                <a href="${resetLink}" class="reset-btn">
                  🔐 Reset Password Securely
                </a>
              </div>

              <!-- Security Notice -->
              <div class="security-notice">
                <div class="security-content">
                  <div class="security-title">Security Notice</div>
                  <div class="security-text">
                    If you didn't request this password reset, please ignore this email. Your password will remain unchanged and your account will stay secure. For your protection, this link will expire automatically.
                  </div>
                </div>
              </div>

              <!-- Additional Info -->
              <div class="info-section">
                <div class="info-title">Need Assistance?</div>
                <div class="info-text">
                  Contact our support team at <strong>support@icl.finance</strong> if you have any questions about your account security or need further assistance.
                </div>
              </div>
            </div>

            <!-- Footer -->
            <div class="footer">
              <div class="footer-content">
                <p>© ${new Date().getFullYear()} ICL Finance. All rights reserved.</p>
                <p>This is an automated security message. Please do not reply to this email.</p>
                <p>For support, contact us at support@icl.finance</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;

      // Send email
      const result = await resend.emails.send({
        from: 'ICL Finance Support <support@icl.finance>',
        to: [email],
        subject: 'Reset Your Password - ICL Finance',
        html: html,
        // Add text version for better email client compatibility
        text: `ICL FINANCE - PASSWORD RESET REQUEST

Hello,

We received a request to reset the password for your ICL Finance account associated with ${email}.

If you made this request, click the following secure link to create a new password:
${resetLink}

SECURITY INFORMATION:
- This link will expire in 15 minutes for your protection
- If you didn't request this reset, please ignore this email
- Your password will remain unchanged if you take no action

For your security, this is an automated message from our system.

Need assistance? Contact our support team at support@icl.finance

© ${new Date().getFullYear()} ICL Finance. All rights reserved.

---
This is an automated security message. Please do not reply to this email.
For support: support@icl.finance
---`,
        // Add reply-to for better support
        replyTo: 'support@icl.finance',
        // Add tags for better email management
        tags: [
          {
            name: 'category',
            value: 'password_reset'
          },
          {
            name: 'type',
            value: 'security'
          }
        ]
      });

      if (result.error) {
        console.error('Resend API error:', result.error);
        return {
          success: false,
          error: result.error.message || 'Failed to send email'
        };
      }

      console.log(`Password reset email sent successfully to ${email}. Message ID: ${result.data?.id}`);

      return {
        success: true,
        messageId: result.data?.id
      };

    } catch (error) {
      console.error('Email service error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Send welcome email (for future use)
   */
  static async sendWelcomeEmail(
    email: string,
    userName: string
  ): Promise<EmailServiceResult> {
    try {
      const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to ICL Finance</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333333;
              background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
              min-height: 100vh;
              padding: 20px;
            }
            .email-container {
              max-width: 600px;
              margin: 0 auto;
              background: #ffffff;
              border-radius: 16px;
              overflow: hidden;
              box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
              border: 1px solid rgba(255, 255, 255, 0.2);
            }
            .header {
              background: linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%);
              padding: 50px 40px;
              text-align: center;
              position: relative;
              overflow: hidden;
            }
            .header::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="75" cy="75" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="50" cy="10" r="0.5" fill="rgba(255,255,255,0.1)"/><circle cx="10" cy="60" r="0.5" fill="rgba(255,255,255,0.1)"/><circle cx="90" cy="40" r="0.5" fill="rgba(255,255,255,0.1)"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
              opacity: 0.3;
            }
            .logo-container {
              margin-bottom: 30px;
              position: relative;
              z-index: 2;
            }
            .logo {
              width: 80px;
              height: 80px;
              background: rgba(255, 255, 255, 0.15);
              border-radius: 20px;
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 0 auto;
              backdrop-filter: blur(10px);
              border: 2px solid rgba(255, 255, 255, 0.2);
              box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
              position: relative;
              overflow: hidden;
            }
            .logo::before {
              content: 'ICL';
              font-size: 24px;
              font-weight: 700;
              color: #ffffff;
              text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
              letter-spacing: 1px;
            }
            .logo::after {
              content: 'FINANCE';
              position: absolute;
              bottom: 8px;
              left: 50%;
              transform: translateX(-50%);
              font-size: 10px;
              font-weight: 500;
              color: rgba(255, 255, 255, 0.9);
              letter-spacing: 0.5px;
            }
            .header h1 {
              font-size: 32px;
              font-weight: 700;
              margin: 0 0 15px;
              color: #ffffff;
              text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
              letter-spacing: -0.025em;
              position: relative;
              z-index: 2;
            }
            .header p {
              font-size: 18px;
              opacity: 0.95;
              margin: 0;
              font-weight: 400;
              color: #ffffff;
              position: relative;
              z-index: 2;
            }
            .content {
              padding: 50px 40px;
              background: #ffffff;
            }
            .welcome-message {
              font-size: 18px;
              color: #1f2937;
              margin-bottom: 25px;
              font-weight: 500;
            }
            .features {
              background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
              border-radius: 12px;
              padding: 30px;
              margin: 30px 0;
              border-left: 4px solid #10b981;
            }
            .features h3 {
              color: #059669;
              font-size: 18px;
              margin-bottom: 15px;
              font-weight: 600;
            }
            .features ul {
              list-style: none;
              padding: 0;
            }
            .features li {
              padding: 8px 0;
              color: #047857;
              font-size: 15px;
              position: relative;
              padding-left: 25px;
            }
            .features li::before {
              content: '✓';
              position: absolute;
              left: 0;
              color: #10b981;
              font-weight: bold;
            }
            .cta-section {
              text-align: center;
              margin: 40px 0;
            }
            .cta-btn {
              display: inline-block;
              background: linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%);
              color: #ffffff;
              text-decoration: none;
              padding: 18px 40px;
              border-radius: 12px;
              font-size: 16px;
              font-weight: 600;
              box-shadow: 0 8px 25px rgba(5, 150, 105, 0.3);
              border: none;
              transition: all 0.3s ease;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .cta-btn:hover {
              transform: translateY(-2px);
              box-shadow: 0 12px 35px rgba(5, 150, 105, 0.4);
            }
            .footer {
              background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
              padding: 40px;
              text-align: center;
              color: #ffffff;
            }
            .footer p {
              margin: 5px 0;
              font-size: 14px;
              opacity: 0.8;
            }
            @media (max-width: 640px) {
              .email-container {
                margin: 10px;
                border-radius: 12px;
              }
              .header {
                padding: 40px 30px;
              }
              .header h1 {
                font-size: 28px;
              }
              .content {
                padding: 40px 30px;
              }
            }
          </style>
        </head>
        <body>
          <div class="email-container">
            <!-- Header -->
            <div class="header">
              <div class="logo-container">
                <div class="logo">
                </div>
              </div>
              <h1>Welcome to ICL Finance!</h1>
              <p>Your financial journey starts here</p>
            </div>

            <!-- Content -->
            <div class="content">
              <div class="welcome-message">Hello ${userName},</div>

              <p style="font-size: 16px; line-height: 1.7; color: #4b5563; margin-bottom: 25px;">
                Welcome to <strong>ICL Finance</strong>! Your account has been successfully created and you're now part of our secure financial ecosystem.
              </p>

              <!-- Features -->
              <div class="features">
                <h3>🚀 Get Started with ICL Finance</h3>
                <ul>
                  <li>Secure wallet management</li>
                  <li>Real-time transaction tracking</li>
                  <li>Advanced analytics and reporting</li>
                  <li>24/7 customer support</li>
                  <li>Multi-currency support</li>
                </ul>
              </div>

              <!-- CTA Section -->
              <div class="cta-section">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}" class="cta-btn">
                  🌟 Explore ICL Finance Dashboard
                </a>
              </div>

              <p style="font-size: 14px; color: #6b7280; text-align: center; margin-top: 30px;">
                Need help getting started? Contact our support team at <strong>support@icl.finance</strong>
              </p>
            </div>

            <!-- Footer -->
            <div class="footer">
              <p>© ${new Date().getFullYear()} ICL Finance. All rights reserved.</p>
              <p>Secure • Reliable • Professional</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const result = await resend.emails.send({
        from: 'ICL Finance Support <support@icl.finance>',
        to: [email],
        subject: 'Welcome to ICL Finance!',
        html: html,
        tags: [
          {
            name: 'category',
            value: 'welcome'
          },
          {
            name: 'type',
            value: 'onboarding'
          }
        ]
      });

      if (result.error) {
        return {
          success: false,
          error: result.error.message || 'Failed to send welcome email'
        };
      }

      return {
        success: true,
        messageId: result.data?.id
      };

    } catch (error) {
      console.error('Welcome email error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Send notification email (for future use)
   */
  static async sendNotificationEmail(
    email: string,
    subject: string,
    message: string
  ): Promise<EmailServiceResult> {
    try {
      const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject} - ICL Finance</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333333;
              background: linear-gradient(135deg, #fef3c7 0%, #fed7aa 100%);
              min-height: 100vh;
              padding: 20px;
            }
            .email-container {
              max-width: 600px;
              margin: 0 auto;
              background: #ffffff;
              border-radius: 16px;
              overflow: hidden;
              box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
              border: 1px solid rgba(255, 255, 255, 0.2);
            }
            .header {
              background: linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #92400e 100%);
              padding: 50px 40px;
              text-align: center;
              position: relative;
              overflow: hidden;
            }
            .header::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="75" cy="75" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="50" cy="10" r="0.5" fill="rgba(255,255,255,0.1)"/><circle cx="10" cy="60" r="0.5" fill="rgba(255,255,255,0.1)"/><circle cx="90" cy="40" r="0.5" fill="rgba(255,255,255,0.1)"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
              opacity: 0.3;
            }
            .logo-container {
              margin-bottom: 30px;
              position: relative;
              z-index: 2;
            }
            .logo {
              width: 80px;
              height: 80px;
              background: rgba(255, 255, 255, 0.15);
              border-radius: 20px;
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 0 auto;
              backdrop-filter: blur(10px);
              border: 2px solid rgba(255, 255, 255, 0.2);
              box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
              position: relative;
              overflow: hidden;
            }
            .logo::before {
              content: 'ICL';
              font-size: 24px;
              font-weight: 700;
              color: #ffffff;
              text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
              letter-spacing: 1px;
            }
            .logo::after {
              content: 'FINANCE';
              position: absolute;
              bottom: 8px;
              left: 50%;
              transform: translateX(-50%);
              font-size: 10px;
              font-weight: 500;
              color: rgba(255, 255, 255, 0.9);
              letter-spacing: 0.5px;
            }
            .header h1 {
              font-size: 28px;
              font-weight: 700;
              margin: 0 0 15px;
              color: #ffffff;
              text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
              letter-spacing: -0.025em;
              position: relative;
              z-index: 2;
            }
            .header p {
              font-size: 16px;
              opacity: 0.95;
              margin: 0;
              font-weight: 400;
              color: #ffffff;
              position: relative;
              z-index: 2;
            }
            .content {
              padding: 50px 40px;
              background: #ffffff;
            }
            .notification-content {
              background: #fef3c7;
              border-radius: 12px;
              padding: 30px;
              border-left: 4px solid #f59e0b;
              margin: 20px 0;
            }
            .notification-message {
              font-size: 16px;
              line-height: 1.7;
              color: #92400e;
              margin-bottom: 20px;
            }
            .notification-details {
              background: #ffffff;
              border: 1px solid #fed7aa;
              border-radius: 8px;
              padding: 20px;
              margin-top: 20px;
            }
            .footer {
              background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
              padding: 40px;
              text-align: center;
              color: #ffffff;
            }
            .footer p {
              margin: 5px 0;
              font-size: 14px;
              opacity: 0.8;
            }
            @media (max-width: 640px) {
              .email-container {
                margin: 10px;
                border-radius: 12px;
              }
              .header {
                padding: 40px 30px;
              }
              .header h1 {
                font-size: 24px;
              }
              .content {
                padding: 40px 30px;
              }
            }
          </style>
        </head>
        <body>
          <div class="email-container">
            <!-- Header -->
            <div class="header">
              <div class="logo-container">
                <div class="logo">
                </div>
              </div>
              <h1>ICL Finance Notification</h1>
              <p>Important update from your account</p>
            </div>

            <!-- Content -->
            <div class="content">
              <div class="notification-content">
                <div class="notification-message">
                  <strong>Hello,</strong>
                </div>

                <div class="notification-message">
                  ${message}
                </div>

                <div class="notification-details">
                  <p style="margin: 0; font-size: 14px; color: #78350f;">
                    If you have any questions about this notification, please contact our support team at <strong>support@icl.finance</strong>
                  </p>
                </div>
              </div>
            </div>

            <!-- Footer -->
            <div class="footer">
              <p>© ${new Date().getFullYear()} ICL Finance. All rights reserved.</p>
              <p>Stay secure • Stay informed</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const result = await resend.emails.send({
        from: 'ICL Finance Support <support@icl.finance>',
        to: [email],
        subject: subject,
        html: html,
        tags: [
          {
            name: 'category',
            value: 'notification'
          },
          {
            name: 'type',
            value: 'alert'
          }
        ]
      });

      if (result.error) {
        return {
          success: false,
          error: result.error.message || 'Failed to send notification email'
        };
      }

      return {
        success: true,
        messageId: result.data?.id
      };

    } catch (error) {
      console.error('Notification email error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}

export default EmailService;
