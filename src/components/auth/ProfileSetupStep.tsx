import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { User, AlertCircle, Camera, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

interface ProfileSetupStepProps {
  phoneNumber: string;
  onComplete: (profile: ProfileFormData) => void;
  onSkip?: () => void;
  initialData?: Partial<ProfileFormData>;
}

export function ProfileSetupStep({
  phoneNumber,
  onComplete,
  onSkip,
  initialData,
}: ProfileSetupStepProps) {
  const [showSkipDialog, setShowSkipDialog] = useState(false);
  const [selectedGender, setSelectedGender] = useState<string>(initialData?.gender || '');
  const [selectedBloodGroup, setSelectedBloodGroup] = useState<string>(initialData?.bloodGroup || '');
  const [profilePhoto, setProfilePhoto] = useState<string>(initialData?.profilePhoto || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
  } = useForm<ProfileFormData>({
    defaultValues: initialData,
  });

  // Initialize form values when editing
  useEffect(() => {
    if (initialData) {
      if (initialData.gender) {
        setSelectedGender(initialData.gender);
        setValue('gender', initialData.gender);
      }
      if (initialData.bloodGroup) {
        setSelectedBloodGroup(initialData.bloodGroup);
      }
      if (initialData.profilePhoto) {
        setProfilePhoto(initialData.profilePhoto);
        setValue('profilePhoto', initialData.profilePhoto);
      }
    }
  }, [initialData, setValue]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert('Photo size must be less than 2MB');
        return;
      }

      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setProfilePhoto(base64String);
        setValue('profilePhoto', base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: ProfileFormData) => {
    // Add gender, blood group and photo from state
    const profileData = {
      ...data,
      gender: selectedGender as 'male' | 'female' | 'other',
      bloodGroup: selectedBloodGroup || undefined,
      profilePhoto: profilePhoto || undefined,
    };

    onComplete(profileData);
  };

  const handleSkip = () => {
    if (onSkip) {
      setShowSkipDialog(false);
      onSkip();
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="space-y-1 sm:space-y-2">
        <div className="flex items-center gap-2 mb-1 sm:mb-2">
          <div className="p-2 rounded-full bg-primary/10">
            <User className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
          </div>
          <h3 className="text-base sm:text-lg font-semibold">Complete Your Profile</h3>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground">
          This information helps emergency contacts and authorities assist you better
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 sm:space-y-4">
        {/* Profile Photo */}
        <div className="space-y-2">
          <Label>Profile Photo (Optional)</Label>
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-muted flex items-center justify-center border-2 border-border">
                {profilePhoto ? (
                  <img
                    src={profilePhoto}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-12 h-12 text-muted-foreground" />
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 p-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={isSubmitting}
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isSubmitting}
                className="w-full"
              >
                <Upload className="w-4 h-4 mr-2" />
                {profilePhoto ? 'Change Photo' : 'Upload Photo'}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Max 2MB • JPG, PNG
              </p>
            </div>
          </div>
        </div>

        {/* Full Name */}
        <div className="space-y-2">
          <Label htmlFor="name">Full Name *</Label>
          <Input
            id="name"
            {...register('name', { required: 'Full name is required' })}
            placeholder="Enter your full name"
            disabled={isSubmitting}
          />
          {errors.name && (
            <p className="text-xs text-destructive">{errors.name.message}</p>
          )}
        </div>

        {/* Father's Name */}
        <div className="space-y-2">
          <Label htmlFor="fatherName">Father's Name *</Label>
          <Input
            id="fatherName"
            {...register('fatherName', { required: "Father's name is required" })}
            placeholder="Enter father's name"
            disabled={isSubmitting}
          />
          {errors.fatherName && (
            <p className="text-xs text-destructive">{errors.fatherName.message}</p>
          )}
        </div>

        {/* Mother's Name */}
        <div className="space-y-2">
          <Label htmlFor="motherName">Mother's Name *</Label>
          <Input
            id="motherName"
            {...register('motherName', { required: "Mother's name is required" })}
            placeholder="Enter mother's name"
            disabled={isSubmitting}
          />
          {errors.motherName && (
            <p className="text-xs text-destructive">{errors.motherName.message}</p>
          )}
        </div>

        {/* Age and Gender Row */}
        <div className="grid grid-cols-2 gap-4">
          {/* Age */}
          <div className="space-y-2">
            <Label htmlFor="age">Age *</Label>
            <Input
              id="age"
              type="number"
              {...register('age', {
                required: 'Age is required',
                min: { value: 10, message: 'Must be at least 10' },
                max: { value: 100, message: 'Must be 100 or less' },
              })}
              placeholder="Age"
              disabled={isSubmitting}
              min={10}
              max={100}
            />
            {errors.age && (
              <p className="text-xs text-destructive">{errors.age.message}</p>
            )}
          </div>

          {/* Gender */}
          <div className="space-y-2">
            <Label htmlFor="gender">Gender *</Label>
            <Select
              value={selectedGender}
              onValueChange={(value) => {
                setSelectedGender(value);
                setValue('gender', value as 'male' | 'female' | 'other');
              }}
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            {!selectedGender && (
              <p className="text-xs text-destructive">Gender is required</p>
            )}
          </div>
        </div>

        {/* Blood Group */}
        <div className="space-y-2">
          <Label htmlFor="bloodGroup">Blood Group (Optional)</Label>
          <Select
            value={selectedBloodGroup}
            onValueChange={setSelectedBloodGroup}
            disabled={isSubmitting}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select blood group" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="A+">A+</SelectItem>
              <SelectItem value="A-">A-</SelectItem>
              <SelectItem value="B+">B+</SelectItem>
              <SelectItem value="B-">B-</SelectItem>
              <SelectItem value="AB+">AB+</SelectItem>
              <SelectItem value="AB-">AB-</SelectItem>
              <SelectItem value="O+">O+</SelectItem>
              <SelectItem value="O-">O-</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Address */}
        <div className="space-y-2">
          <Label htmlFor="address">Address *</Label>
          <Textarea
            id="address"
            {...register('address', { required: 'Address is required' })}
            placeholder="Enter your full address"
            disabled={isSubmitting}
            rows={3}
          />
          {errors.address && (
            <p className="text-xs text-destructive">{errors.address.message}</p>
          )}
        </div>

        {/* Aadhar Number */}
        <div className="space-y-2">
          <Label htmlFor="aadharNumber">Aadhar Number (Optional)</Label>
          <Input
            id="aadharNumber"
            {...register('aadharNumber', {
              pattern: {
                value: /^\d{12}$/,
                message: 'Aadhar must be 12 digits',
              },
            })}
            placeholder="Enter 12-digit Aadhar number"
            disabled={isSubmitting}
            maxLength={12}
          />
          {errors.aadharNumber && (
            <p className="text-xs text-destructive">{errors.aadharNumber.message}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Your Aadhar number is stored securely and only used for emergency identification
          </p>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-2 pt-4">
          <Button
            type="submit"
            disabled={isSubmitting || !selectedGender}
            size="lg"
            className="w-full"
          >
            {isSubmitting ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Saving Profile...
              </>
            ) : (
              'Complete Profile'
            )}
          </Button>

          {onSkip && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowSkipDialog(true)}
              disabled={isSubmitting}
              className="w-full"
            >
              Skip for Now
            </Button>
          )}
        </div>
      </form>

      {/* Skip Confirmation Dialog */}
      <AlertDialog open={showSkipDialog} onOpenChange={setShowSkipDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-destructive" />
              Skip Profile Setup?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Your profile information helps emergency contacts and authorities assist you
              better during emergencies. You can complete it later in Settings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue Setup</AlertDialogCancel>
            <AlertDialogAction onClick={handleSkip} className="bg-destructive hover:bg-destructive/90">
              Skip Anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
