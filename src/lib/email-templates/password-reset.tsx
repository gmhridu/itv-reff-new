import React from 'react';

interface PasswordResetEmailProps {
  resetLink: string;
  userEmail: string;
  companyName?: string;
}

export const PasswordResetEmail: React.FC<PasswordResetEmailProps> = ({
  resetLink,
  userEmail,
  companyName = 'ICL Finance'
}) => {
  return (
    <div style={{
      fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
      maxWidth: '600px',
      margin: '0 auto',
      backgroundColor: '#ffffff',
      border: '1px solid #e5e7eb',
      borderRadius: '16px',
      overflow: 'hidden',
      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)'
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #60a5fa 100%)',
        padding: '50px 40px',
        textAlign: 'center',
        color: '#ffffff',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Background Pattern */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'%3E%3Cdefs%3E%3Cpattern id=\'grain\' width=\'100\' height=\'100\' patternUnits=\'userSpaceOnUse\'%3E%3Ccircle cx=\'25\' cy=\'25\' r=\'1\' fill=\'rgba(255,255,255,0.1)\'/%3E%3Ccircle cx=\'75\' cy=\'75\' r=\'1\' fill=\'rgba(255,255,255,0.1)\'/%3E%3Ccircle cx=\'50\' cy=\'10\' r=\'0.5\' fill=\'rgba(255,255,255,0.1)\'/%3E%3Ccircle cx=\'10\' cy=\'60\' r=\'0.5\' fill=\'rgba(255,255,255,0.1)\'/%3E%3Ccircle cx=\'90\' cy=\'40\' r=\'0.5\' fill=\'rgba(255,255,255,0.1)\'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width=\'100\' height=\'100\' fill=\'url(%23grain)\'/%3E%3C/svg%3E")',
          opacity: 0.3
        }} />

        {/* Logo */}
        <div style={{
          marginBottom: '30px',
          position: 'relative',
          zIndex: 2
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            background: 'rgba(255, 255, 255, 0.15)',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto',
            backdropFilter: 'blur(10px)',
            border: '2px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'relative',
              zIndex: 1
            }}>
              <div style={{
                fontSize: '24px',
                fontWeight: '700',
                color: '#ffffff',
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
                letterSpacing: '1px',
                lineHeight: '1'
              }}>
                ICL
              </div>
              <div style={{
                position: 'absolute',
                bottom: '8px',
                left: '50%',
                transform: 'translateX(-50%)',
                fontSize: '10px',
                fontWeight: '500',
                color: 'rgba(255, 255, 255, 0.9)',
                letterSpacing: '0.5px'
              }}>
                FINANCE
              </div>
            </div>
          </div>
        </div>

        <h1 style={{
          fontSize: '32px',
          fontWeight: '700',
          margin: '0 0 15px',
          color: '#ffffff',
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
          letterSpacing: '-0.025em',
          position: 'relative',
          zIndex: 2
        }}>
          Reset Your Password
        </h1>
        <p style={{
          fontSize: '18px',
          opacity: '0.95',
          margin: '0',
          fontWeight: '400',
          color: '#ffffff',
          position: 'relative',
          zIndex: 2
        }}>
          Secure your ICL Finance account
        </p>
      </div>

      {/* Content */}
      <div style={{
        padding: '50px 40px',
        backgroundColor: '#ffffff'
      }}>
        <div style={{
          fontSize: '18px',
          color: '#1f2937',
          marginBottom: '25px',
          fontWeight: '500'
        }}>
          Hello,
        </div>

        <div style={{
          fontSize: '16px',
          lineHeight: '1.7',
          color: '#4b5563',
          marginBottom: '35px'
        }}>
          <p style={{ margin: '0 0 20px' }}>
            We received a request to reset the password for your <span style={{
              color: '#1e40af',
              fontWeight: '600',
              background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
              padding: '2px 6px',
              borderRadius: '4px'
            }}>ICL Finance</span> account associated with <strong>{userEmail}</strong>.
          </p>

          <p style={{ margin: '0 0 30px' }}>
            If you made this request, click the secure button below to create a new password. This link will expire in <strong>15 minutes</strong> for security reasons.
          </p>
        </div>

        {/* Reset Button */}
        <div style={{ textAlign: 'center', margin: '40px 0' }}>
          <a
            href={resetLink}
            style={{
              display: 'inline-block',
              background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #60a5fa 100%)',
              color: '#ffffff !important',
              textDecoration: 'none',
              padding: '18px 40px',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
              boxShadow: '0 8px 25px rgba(30, 64, 175, 0.3)',
              border: 'none',
              transition: 'all 0.3s ease',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              position: 'relative',
              overflow: 'hidden',
              textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 12px 35px rgba(30, 64, 175, 0.4)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(30, 64, 175, 0.3)';
            }}
          >
            🔐 Reset Password Securely
          </a>
        </div>

        {/* Security Notice */}
        <div style={{
          background: 'linear-gradient(135deg, #fef3c7 0%, #fed7aa 100%)',
          border: '1px solid #f59e0b',
          borderRadius: '12px',
          padding: '25px',
          margin: '30px 0',
          position: 'relative'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '15px'
          }}>
            <div style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              backgroundColor: '#f59e0b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              marginTop: '2px',
              boxShadow: '0 2px 4px rgba(245, 158, 11, 0.2)'
            }}>
              <span style={{ color: '#ffffff', fontSize: '14px', fontWeight: 'bold' }}>⚠️</span>
            </div>
            <div>
              <h3 style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#92400e',
                margin: '0 0 8px'
              }}>
                Security Notice
              </h3>
              <p style={{
                fontSize: '14px',
                color: '#78350f',
                margin: '0',
                lineHeight: '1.6'
              }}>
                If you didn't request this password reset, please ignore this email. Your password will remain unchanged and your account will stay secure. For your protection, this link will expire automatically.
              </p>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div style={{
          background: '#f8fafc',
          borderRadius: '12px',
          padding: '25px',
          borderLeft: '4px solid #3b82f6'
        }}>
          <h4 style={{
            fontSize: '14px',
            fontWeight: '600',
            color: '#1e40af',
            margin: '0 0 10px'
          }}>
            Need Assistance?
          </h4>
          <p style={{
            fontSize: '13px',
            color: '#64748b',
            margin: '0',
            lineHeight: '1.5'
          }}>
            Contact our support team at <strong>support@icl.finance</strong> if you have any questions about your account security or need further assistance.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
        padding: '40px',
        textAlign: 'center',
        color: '#ffffff'
      }}>
        <div style={{
          marginBottom: '25px'
        }}>
          <p style={{
            margin: '0 0 5px',
            fontSize: '14px',
            opacity: '0.9'
          }}>
            © {new Date().getFullYear()} ICL Finance. All rights reserved.
          </p>
          <p style={{
            margin: '0 0 5px',
            fontSize: '14px',
            opacity: '0.8'
          }}>
            This is an automated security message. Please do not reply to this email.
          </p>
          <p style={{
            margin: '0',
            fontSize: '14px',
            opacity: '0.8'
          }}>
            For support, contact us at support@icl.finance
          </p>
        </div>

        {/* Company Logo/Branding */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '15px',
          marginTop: '25px'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
          }}>
            <div style={{
              fontSize: '20px',
              fontWeight: '700',
              color: '#ffffff',
              textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
              letterSpacing: '1px'
            }}>
              ICL
            </div>
          </div>
          <span style={{
            fontSize: '20px',
            fontWeight: '600',
            color: '#ffffff'
          }}>
            ICL Finance
          </span>
        </div>
      </div>
    </div>
  );
};

export default PasswordResetEmail;
