import React, { useState } from 'react';
import { UserCircle, LogOut, Edit, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAppAuth } from '@/contexts/AuthContext';
import { ProfileSetupStep } from './ProfileSetupStep';
import { FullProfileDialog } from './FullProfileDialog';
import { toast } from '@/lib/toast';

export function UserProfileCard() {
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showFullProfile, setShowFullProfile] = useState(false);
  const { userProfile, logout, isOnline, updateProfile } = useAppAuth();

  if (!userProfile) {
    return null;
  }

  const handleLogout = async () => {
    await logout();
    setShowLogoutDialog(false);
  };

  const handleEditProfile = async (profile: any) => {
    try {
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
      });
      toast.success('Profile updated successfully!');
      setShowEditDialog(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    }
  };

  // Format phone number for display
  const formatPhone = (phone: string) => {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
    }
    return phone;
  };

  return (
    <>
      <div className="glass rounded-2xl p-6">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            {userProfile.profilePhoto ? (
              <img
                src={userProfile.profilePhoto}
                alt={userProfile.name}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <UserCircle className="w-10 h-10 text-primary" />
              </div>
            )}
            {isOnline && (
              <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-background" />
            )}
          </div>

          {/* Profile Info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold truncate">{userProfile.name || 'User'}</h3>
            {userProfile.phone && (
              <p className="text-sm text-muted-foreground">{formatPhone(userProfile.phone)}</p>
            )}

            {/* Additional Info */}
            {(userProfile.age || userProfile.bloodGroup) && (
              <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                {userProfile.age && <span>Age: {userProfile.age}</span>}
                {userProfile.bloodGroup && <span>Blood: {userProfile.bloodGroup}</span>}
              </div>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-3 gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFullProfile(true)}
                className="flex flex-col items-center gap-1 p-2 h-auto"
              >
                <QrCode className="w-4 h-4" />
                <span className="text-xs">View Profile</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowEditDialog(true)}
                className="flex flex-col items-center gap-1 p-2 h-auto"
              >
                <Edit className="w-4 h-4" />
                <span className="text-xs">Edit</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowLogoutDialog(true)}
                className="flex flex-col items-center gap-1 p-2 h-auto"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-xs">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Logout Confirmation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to logout? Your safety features (SOS, location sharing) will continue to work, but your profile data won't sync to the cloud.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout} className="bg-destructive hover:bg-destructive/90">
              Logout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Profile Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader className="sr-only">
            <DialogTitle>Edit Your Profile</DialogTitle>
          </DialogHeader>
          <ProfileSetupStep
            phoneNumber={userProfile.phone}
            onComplete={handleEditProfile}
            onSkip={() => setShowEditDialog(false)}
            initialData={{
              name: userProfile.name,
              fatherName: userProfile.fatherName,
              motherName: userProfile.motherName,
              age: userProfile.age,
              gender: userProfile.gender,
              bloodGroup: userProfile.bloodGroup,
              address: userProfile.address,
              aadharNumber: userProfile.aadharNumber,
              profilePhoto: userProfile.profilePhoto,
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Full Profile Dialog with QR Code */}
      <FullProfileDialog
        open={showFullProfile}
        onOpenChange={setShowFullProfile}
        profile={userProfile}
      />
    </>
  );
}
