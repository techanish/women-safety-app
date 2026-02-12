import React, { useState } from 'react';
import { Phone, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { sendOTP } from '@/integrations/clerk';
import { toast } from '@/lib/toast';

interface PhoneNumberStepProps {
  onSuccess: (phoneNumber: string, sessionId: string) => void;
  initialPhone?: string;
}

export function PhoneNumberStep({ onSuccess, initialPhone = '' }: PhoneNumberStepProps) {
  const [phoneNumber, setPhoneNumber] = useState(initialPhone);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const isOnline = navigator.onLine;

  const validatePhoneNumber = (phone: string): boolean => {
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');

    // Check if it's 10 digits and starts with 6-9
    if (cleaned.length !== 10) {
      setError('Phone number must be 10 digits');
      return false;
    }

    if (!/^[6-9]/.test(cleaned)) {
      setError('Phone number must start with 6, 7, 8, or 9');
      return false;
    }

    setError('');
    return true;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // Only allow digits
    if (value.length <= 10) {
      setPhoneNumber(value);
      if (error) setError(''); // Clear error when user types
    }
  };

  const handleContinue = async () => {
    if (!validatePhoneNumber(phoneNumber)) {
      return;
    }

    if (!isOnline) {
      toast.info('You are offline. Authentication requires internet connection.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await sendOTP(`+91${phoneNumber}`);

      if (result && result.sessionId) {
        toast.success('OTP sent successfully!');
        onSuccess(`+91${phoneNumber}`, result.sessionId);
      } else {
        setError('Failed to send OTP. Please try again.');
      }
    } catch (err) {
      console.error('Error sending OTP:', err);
      setError('Failed to send OTP. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

 const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && phoneNumber.length === 10 && !isLoading) {
      handleContinue();
    }
  };

  return (
    <div className="space-y-6">
      {/* Offline Warning */}
      {!isOnline && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
          <WifiOff className="w-4 h-4 text-destructive flex-shrink-0" />
          <p className="text-sm text-destructive">
            You are offline. Authentication requires internet connection.
          </p>
        </div>
      )}

      {/* Header */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Enter Phone Number</h3>
        <p className="text-sm text-muted-foreground">
          We'll send you a one-time password to verify your number
        </p>
      </div>

      {/* Phone Input */}
      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number</Label>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted border border-border">
            <Phone className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">+91</span>
          </div>
          <Input
            id="phone"
            type="tel"
            placeholder="9876543210"
            value={phoneNumber}
            onChange={handlePhoneChange}
            onKeyPress={handleKeyPress}
            disabled={isLoading || !isOnline}
            className="flex-1"
            maxLength={10}
            autoFocus
          />
        </div>
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </div>

      {/* Continue Button */}
      <Button
        onClick={handleContinue}
        disabled={phoneNumber.length !== 10 || isLoading || !isOnline}
        className="w-full"
        size="lg"
      >
        {isLoading ? (
          <>
            <span className="animate-spin mr-2">⏳</span>
            Sending OTP...
          </>
        ) : (
          'Continue'
        )}
      </Button>

      {/* Info Text */}
      <p className="text-xs text-muted-foreground text-center">
        By continuing, you agree to receive an SMS with a verification code.
        Standard rates may apply.
      </p>
    </div>
  );
}
