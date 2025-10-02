import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNTSID || 'AC12e761c9f2ead5b4f65a48a61b712e43';
const authToken = process.env.TWILIO_AUTHTOKEN || 'e01e4589e840f0223cf50a7c63ad3bcd';
const client = twilio(accountSid, authToken);

// WhatsApp sandbox number - UPDATE THIS with your actual WhatsApp-enabled Twilio number
const FROM_PHONE = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886';

export interface WhatsAppOTPResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface OTPVerificationResult {
  success: boolean;
  userId?: string;
  error?: string;
}

export class WhatsAppOTPService {
  /**
   * Generate a 6-digit OTP
   */
  private static generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Send OTP via WhatsApp using Twilio
   */
  static async sendOTP(
    phoneNumber: string,
    otp: string
  ): Promise<WhatsAppOTPResult> {
    try {
      // Format phone number for WhatsApp (ensure it includes country code)
      const formattedPhone = this.formatPhoneNumber(phoneNumber);

      if (!formattedPhone) {
        return {
          success: false,
          error: 'Invalid phone number format'
        };
      }

      // Create WhatsApp message with OTP
      const message = await client.messages.create({
        from: FROM_PHONE,
        to: `whatsapp:${formattedPhone}`,
        body: `🔐 ICL Finance Password Reset\n\nYour verification code is: *${otp}*\n\nThis code will expire in 10 minutes for security reasons.\n\nIf you didn't request this code, please ignore this message.\n\n© ICL Finance`
      });

      return {
        success: true,
        messageId: message.sid
      };

    } catch (error: unknown) {
      console.error('WhatsApp OTP service error:', error);

      // Type guard to check if error has the expected structure
      const isTwilioError = (err: unknown): err is { code: number; message: string } => {
        return typeof err === 'object' && err !== null && 'code' in err && 'message' in err;
      };

      // Handle specific Twilio errors
      if (isTwilioError(error) && error.code === 21608) {
        return {
          success: false,
          error: 'Phone number is not registered with WhatsApp or not opted in to receive messages'
        };
      }

      if (isTwilioError(error) && error.code === 21211) {
        return {
          success: false,
          error: 'Invalid phone number'
        };
      }

      // Handle generic errors
      const errorMessage = isTwilioError(error) ? error.message : 'Failed to send WhatsApp message';
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Send password reset OTP via WhatsApp
   */
  static async sendPasswordResetOTP(phoneNumber: string): Promise<WhatsAppOTPResult & { otp?: string }> {
    try {
      // Generate OTP
      const otp = this.generateOTP();

      // Send OTP via WhatsApp
      const result = await this.sendOTP(phoneNumber, otp);

      if (result.success) {
        // Store OTP in database for verification
        // Note: In a real application, you might want to find the user by phone first
        // For now, we'll store it without user association and match by phone during verification
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // We'll need to import db here or pass it as a parameter
        // For now, let's return the OTP and handle storage in the API route
        return {
          success: true,
          messageId: result.messageId,
          otp: otp // Only return OTP in development - in production, store it securely
        };
      }

      return result;

    } catch (error: any) {
      console.error('Password reset OTP error:', error);
      return {
        success: false,
        error: error.message || 'Failed to send password reset OTP'
      };
    }
  }

  /**
   * Format phone number to international format
   */
  private static formatPhoneNumber(phoneNumber: string): string | null {


    // Remove all non-digit characters
    const digitsOnly = phoneNumber.replace(/\D/g, '');


    // Check if it's a valid length (assuming international format)
    if (digitsOnly.length < 10 || digitsOnly.length > 15) {
      return null;
    }

    // If it already starts with country code, return as is
    if (phoneNumber.startsWith('+')) {
      return phoneNumber;
    }

    // Handle different country formats
    if (digitsOnly.startsWith('92')) {
      // Pakistan number
      const formatted = `+${digitsOnly}`;
      return formatted;
    } else if (digitsOnly.startsWith('1')) {
      // US/Canada number
      const formatted = `+${digitsOnly}`;
      return formatted;
    } else if (digitsOnly.startsWith('44')) {
      // UK number
      const formatted = `+${digitsOnly}`;
      return formatted;
    } else {
      // Default: assume Pakistan format for numbers without country code
      const cleanedNumber = digitsOnly.startsWith('0') ? digitsOnly.substring(1) : digitsOnly;
      const formatted = `+880${cleanedNumber}`;
      return formatted;
    }
  }

  /**
   * Validate phone number format
   */
  static validatePhoneNumber(phoneNumber: string): boolean {
    const formatted = this.formatPhoneNumber(phoneNumber);
    return formatted !== null;
  }

  /**
   * Rate limiting check (basic implementation)
   * In production, you should use Redis or a similar store
   */
  private static otpRequests = new Map<string, { count: number; resetTime: number }>();

  static checkRateLimit(phoneNumber: string): { allowed: boolean; remainingTime?: number } {
    const now = Date.now();
    const formattedPhone = this.formatPhoneNumber(phoneNumber);

    if (!formattedPhone) {
      return { allowed: false };
    }

    const existing = this.otpRequests.get(formattedPhone);

    if (!existing) {
      // First request
      this.otpRequests.set(formattedPhone, { count: 1, resetTime: now + 60000 }); // 1 minute window
      return { allowed: true };
    }

    if (now > existing.resetTime) {
      // Reset window
      this.otpRequests.set(formattedPhone, { count: 1, resetTime: now + 60000 });
      return { allowed: true };
    }

    if (existing.count >= 3) {
      // Too many requests
      const remainingTime = Math.ceil((existing.resetTime - now) / 1000);
      return { allowed: false, remainingTime };
    }

    // Increment count
    existing.count++;
    return { allowed: true };
  }

  /**
   * Clean up old rate limit entries (call this periodically)
   */
  static cleanupRateLimit(): void {
    const now = Date.now();
    for (const [phone, data] of this.otpRequests.entries()) {
      if (now > data.resetTime) {
        this.otpRequests.delete(phone);
      }
    }
  }
}

export default WhatsAppOTPService;
