import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PhoneNumberStep } from './PhoneNumberStep';
import { OTPVerificationStep } from './OTPVerificationStep';
import { ProfileSetupStep } from './ProfileSetupStep';
import { useAppAuth } from '@/contexts/AuthContext';
import { getUserProfile } from '@/lib/offlineDB';
import { toast } from '@/lib/toast';

type AuthStep = 'phone' | 'otp' | 'profile';

interface ProfileFormData {
  name: string;
  fatherName: string;
  motherName: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  bloodGroup?: string;
  address: string;
  aadharNumber?: string;
  profilePhoto?: string;
}

interface AuthFlowProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AuthFlow({ open, onOpenChange, onSuccess }: AuthFlowProps) {
  const [currentStep, setCurrentStep] = useState<AuthStep>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [clerkUserId, setClerkUserId] = useState('');
  const [sessionToken, setSessionToken] = useState('');

  const { loginWithClerk, updateProfile, userProfile } = useAppAuth();

  // Reset state when dialog closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset all state
      setCurrentStep('phone');
      setPhoneNumber('');
      setSessionId('');
      setClerkUserId('');
      setSessionToken('');
    }
    onOpenChange(newOpen);
  };

  // Step 1: Phone number submitted, OTP sent
  const handlePhoneSuccess = (phone: string, sid: string) => {
    setPhoneNumber(phone);
    setSessionId(sid);
    setCurrentStep('otp');
  };

  // Step 2: OTP verified successfully
  const handleOTPSuccess = async (userId: string, token: string) => {
    try {
      setClerkUserId(userId);
      setSessionToken(token);

      // Login with Clerk (creates session cache and profile)
      await loginWithClerk(phoneNumber, '', userId, token);

      // Check the actual profile from database to determine if first-time user
      const savedProfile = await getUserProfile();

      if (!savedProfile?.name || savedProfile.name === '') {
        // First-time user -> go to profile step
        setCurrentStep('profile');
      } else {
        // Returning user -> close dialog
        toast.success(`Welcome back, ${savedProfile.name}!`);
        handleOpenChange(false);
        if (onSuccess) onSuccess();
      }
    } catch (error) {
      console.error('Error during OTP success handler:', error);
      toast.error('Login failed. Please try again.');
    }
  };

  // Step 3: Profile setup completed
  const handleProfileComplete = async (profile: ProfileFormData) => {
    try {
      // Update profile with all fields
      await updateProfile({
        name: profile.name,
        fatherName: profile.fatherName,
        motherName: profile.motherName,
        age: profile.age,
        gender: profile.gender,
        bloodGroup: profile.bloodGroup,
        address: profile.address,
        aadharNumber: profile.aadharNumber || '',
        profilePhoto: profile.profilePhoto,
        phone: phoneNumber,
      });

      toast.success(`Welcome, ${profile.name}!`);
      handleOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to save profile. Please try again.');
    }
  };

  // Skip profile setup (optional)
  const handleProfileSkip = () => {
    toast.info('You can complete your profile later in Settings');
    handleOpenChange(false);
    if (onSuccess) onSuccess();
  };

  // Go back to phone number step
  const handleBackToPhone = () => {
    setCurrentStep('phone');
    setSessionId('');
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader className="sr-only">
          <DialogTitle>
            {currentStep === 'phone' && 'Sign In with Phone Number'}
            {currentStep === 'otp' && 'Verify OTP Code'}
            {currentStep === 'profile' && 'Complete Your Profile'}
          </DialogTitle>
        </DialogHeader>

        {currentStep === 'phone' && (
          <PhoneNumberStep
            onSuccess={handlePhoneSuccess}
          />
        )}

        {currentStep === 'otp' && (
          <OTPVerificationStep
            phoneNumber={phoneNumber}
            sessionId={sessionId}
            onSuccess={handleOTPSuccess}
            onBack={handleBackToPhone}
          />
        )}

        {currentStep === 'profile' && (
          <ProfileSetupStep
            phoneNumber={phoneNumber}
            onComplete={handleProfileComplete}
            onSkip={handleProfileSkip}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
