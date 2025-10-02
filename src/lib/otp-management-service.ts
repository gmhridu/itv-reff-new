import { db } from '@/lib/db';

export class OTPManagementService {
  /**
   * Clean up expired OTPs
   */
  static async cleanupExpiredOTPs(): Promise<number> {
    try {
      const result = await db.whatsAppOTP.updateMany({
        where: {
          expiresAt: {
            lt: new Date()
          },
          used: false
        },
        data: {
          used: true
        }
      });

      if (result.count > 0) {
        console.log(`Cleaned up ${result.count} expired OTPs`);
      }

      return result.count;
    } catch (error) {
      console.error('Error cleaning up expired OTPs:', error);
      return 0;
    }
  }

  /**
   * Clean up expired password reset tokens
   */
  static async cleanupExpiredPasswordResets(): Promise<number> {
    try {
      const result = await db.passwordReset.updateMany({
        where: {
          expiresAt: {
            lt: new Date()
          },
          used: false
        },
        data: {
          used: true
        }
      });

      if (result.count > 0) {
        console.log(`Cleaned up ${result.count} expired password reset tokens`);
      }

      return result.count;
    } catch (error) {
      console.error('Error cleaning up expired password resets:', error);
      return 0;
    }
  }

  /**
   * Clean up old OTPs for a specific user
   */
  static async cleanupUserOTPs(userId: string): Promise<number> {
    try {
      const result = await db.whatsAppOTP.updateMany({
        where: {
          userId,
          expiresAt: {
            lt: new Date()
          },
          used: false
        },
        data: {
          used: true
        }
      });

      return result.count;
    } catch (error) {
      console.error('Error cleaning up user OTPs:', error);
      return 0;
    }
  }

  /**
   * Clean up old password reset tokens for a specific user
   */
  static async cleanupUserPasswordResets(userId: string): Promise<number> {
    try {
      const result = await db.passwordReset.updateMany({
        where: {
          userId,
          expiresAt: {
            lt: new Date()
          },
          used: false
        },
        data: {
          used: true
        }
      });

      return result.count;
    } catch (error) {
      console.error('Error cleaning up user password resets:', error);
      return 0;
    }
  }

  /**
   * Get OTP statistics for monitoring
   */
  static async getOTPStats() {
    try {
      const totalOTPs = await db.whatsAppOTP.count();
      const usedOTPs = await db.whatsAppOTP.count({
        where: { used: true }
      });
      const expiredOTPs = await db.whatsAppOTP.count({
        where: {
          expiresAt: {
            lt: new Date()
          },
          used: false
        }
      });

      return {
        total: totalOTPs,
        used: usedOTPs,
        expired: expiredOTPs,
        active: totalOTPs - usedOTPs - expiredOTPs
      };
    } catch (error) {
      console.error('Error getting OTP stats:', error);
      return null;
    }
  }

  /**
   * Comprehensive cleanup (call this periodically via cron job)
   */
  static async comprehensiveCleanup(): Promise<{ otpCleanup: number; passwordResetCleanup: number }> {
    const otpCleanup = await this.cleanupExpiredOTPs();
    const passwordResetCleanup = await this.cleanupExpiredPasswordResets();

    return {
      otpCleanup,
      passwordResetCleanup
    };
  }

  /**
   * Validate OTP attempt limits
   */
  static async validateOTPAttempts(otpId: string): Promise<{ valid: boolean; attempts: number }> {
    try {
      const otpRecord = await db.whatsAppOTP.findUnique({
        where: { id: otpId },
        select: { attempts: true }
      });

      if (!otpRecord) {
        return { valid: false, attempts: 0 };
      }

      // Max 3 attempts per OTP
      const valid = otpRecord.attempts < 3;

      return {
        valid,
        attempts: otpRecord.attempts
      };
    } catch (error) {
      console.error('Error validating OTP attempts:', error);
      return { valid: false, attempts: 0 };
    }
  }

  /**
   * Increment OTP attempts
   */
  static async incrementOTPAttempts(otpId: string): Promise<void> {
    try {
      await db.whatsAppOTP.update({
        where: { id: otpId },
        data: {
          attempts: {
            increment: 1
          }
        }
      });
    } catch (error) {
      console.error('Error incrementing OTP attempts:', error);
    }
  }
}

export default OTPManagementService;
