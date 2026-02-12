import React, { useState, useEffect, useCallback } from 'react';
import { Shield, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { verifyOTP } from '@/integrations/clerk';
import { toast } from '@/lib/toast';

interface OTPVerificationStepProps {
  phoneNumber: string;
  sessionId: string;
  onSuccess: (clerkUserId: string, sessionToken: string) => void;
  onBack: () => void;
}

export function OTPVerificationStep({
  phoneNumber,
  sessionId,
  onSuccess,
  onBack,
}: OTPVerificationStepProps) {
  const [otp, setOtp] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(60);
  const [error, setError] = useState('');

  // Countdown timer for resend
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => {
        setResendCountdown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [resendCountdown]);

  const handleVerify = useCallback(async () => {
    if (otp.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      const result = await verifyOTP(sessionId, otp, phoneNumber);

      if (result && result.clerkUserId && result.sessionToken) {
        toast.success('Phone number verified!');
        onSuccess(result.clerkUserId, result.sessionToken);
      } else {
        setError('Invalid OTP. Please try again.');
        setOtp(''); // Clear OTP for retry
      }
    } catch (err) {
      console.error('Error verifying OTP:', err);
      setError('Verification failed. Please try again.');
      setOtp(''); // Clear OTP for retry
    } finally {
      setIsVerifying(false);
    }
  }, [otp, sessionId, phoneNumber, onSuccess]);

  // Auto-submit when OTP is complete
  useEffect(() => {
    if (otp.length === 6 && !isVerifying) {
      handleVerify();
    }
  }, [otp, isVerifying, handleVerify]);

  const handleResend = async () => {
    if (!canResend) return;

    try {
      const { sendOTP } = await import('@/integrations/clerk');
      const result = await sendOTP(phoneNumber);

      if (result) {
        toast.success('New OTP sent!');
        setCanResend(false);
        setResendCountdown(60);
        setOtp('');
        setError('');
      } else {
        toast.error('Failed to resend OTP');
      }
    } catch (err) {
      console.error('Error resending OTP:', err);
      toast.error('Failed to resend OTP');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2 text-center">
        <div className="flex justify-center mb-4">
          <div className="p-3 rounded-full bg-primary/10">
            <Shield className="w-8 h-8 text-primary" />
          </div>
        </div>
        <h3 className="text-lg font-semibold">Verify Your Number</h3>
        <p className="text-sm text-muted-foreground">
          Enter the 6-digit code sent to
        </p>
        <p className="text-sm font-medium">{phoneNumber}</p>
      </div>

      {/* OTP Input */}
      <div className="space-y-4">
        <div className="flex justify-center">
          <InputOTP
            maxLength={6}
            value={otp}
            onChange={(value) => {
              setOtp(value);
              if (error) setError('');
            }}
            disabled={isVerifying}
            autoFocus
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>

        {error && (
          <p className="text-sm text-destructive text-center">{error}</p>
        )}

        {isVerifying && (
          <p className="text-sm text-muted-foreground text-center">
            Verifying...
          </p>
        )}
      </div>

      {/* Resend OTP */}
      <div className="flex flex-col items-center gap-2">
        {canResend ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResend}
            className="text-xs"
          >
            <RotateCcw className="w-3 h-3 mr-1" />
            Resend OTP
          </Button>
        ) : (
          <p className="text-xs text-muted-foreground">
            Resend OTP in {resendCountdown}s
          </p>
        )}
      </div>

      {/* Back Button */}
      <Button
        variant="outline"
        onClick={onBack}
        disabled={isVerifying}
        className="w-full"
      >
        Change Phone Number
      </Button>

      {/* Info */}
      <p className="text-xs text-muted-foreground text-center">
        Didn't receive the code? Check your phone's SMS messages or try resending.
      </p>
    </div>
  );
}
