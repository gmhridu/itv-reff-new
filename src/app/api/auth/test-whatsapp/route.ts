import { NextRequest, NextResponse } from 'next/server';
import { WhatsAppOTPService } from '@/lib/whatsapp-otp-service';

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 DEBUG: Test WhatsApp API called');
    const body = await request.json();
    const { phone } = body;

    console.log('🔍 DEBUG: Test phone number:', phone);

    if (!phone) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    // Test phone number validation
    const isValid = WhatsAppOTPService.validatePhoneNumber(phone);
    console.log('🔍 DEBUG: Phone validation result:', isValid);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid phone number format', phone },
        { status: 400 }
      );
    }

    // Test OTP generation and sending (without storing in DB)
    const testOTP = '123456';
    console.log('🔍 DEBUG: Test OTP:', testOTP);

    const result = await WhatsAppOTPService.sendOTP(phone, testOTP);

    console.log('🔍 DEBUG: WhatsApp send result:', result);

    return NextResponse.json({
      success: result.success,
      messageId: result.messageId,
      error: result.error,
      phone: phone,
      formattedPhone: WhatsAppOTPService['formatPhoneNumber'](phone),
      testOTP: process.env.NODE_ENV === 'development' ? testOTP : undefined
    });

  } catch (error) {
    console.error('❌ DEBUG: Test WhatsApp error:', error);
    return NextResponse.json(
      { error: 'Test failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
