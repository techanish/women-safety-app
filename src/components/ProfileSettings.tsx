import React, { useState, useEffect } from 'react';
import { User, Phone, Mail, MapPin, Heart, Languages, Camera, ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useAppAuth, UserProfile } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface ProfileSettingsProps {
  onClose: () => void;
}

export function ProfileSettings({ onClose }: ProfileSettingsProps) {
  const { userProfile, updateProfile, isAuthenticated } = useAppAuth();
  const [formData, setFormData] = useState<Partial<UserProfile>>({
    name: '',
    fatherName: '',
    motherName: '',
    age: 0,
    bloodGroup: '',
    phone: '',
    email: '',
    aadharNumber: '',
    address: '',
    languagePreference: 'English',
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setFormData({
        name: userProfile.name || '',
        fatherName: userProfile.fatherName || '',
        motherName: userProfile.motherName || '',
        age: userProfile.age || 0,
        bloodGroup: userProfile.bloodGroup || '',
        phone: userProfile.phone || '',
        email: userProfile.email || '',
        aadharNumber: userProfile.aadharNumber || '',
        address: userProfile.address || '',
        languagePreference: userProfile.languagePreference || 'English',
      });
    }
  }, [userProfile]);

  const handleChange = (field: keyof UserProfile, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.name?.trim()) {
      toast.error('Name is required');
      return;
    }
    if (!formData.phone?.trim()) {
      toast.error('Phone number is required');
      return;
    }

    setIsSaving(true);
    try {
      await updateProfile(formData);
      toast.success('Profile saved successfully');
      onClose();
    } catch (error) {
      toast.error('Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const languages = ['English', 'Hindi', 'Telugu', 'Tamil', 'Kannada', 'Malayalam', 'Bengali', 'Marathi', 'Gujarati', 'Other'];

  return (
    <div className="fixed inset-0 z-50 bg-background overflow-y-auto">
      <div className="min-h-full p-6 pb-24">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={onClose}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h2 className="text-2xl font-display font-bold text-foreground">Profile</h2>
            <p className="text-sm text-muted-foreground">
              Your personal and emergency details
            </p>
          </div>
        </div>

        {/* Profile Photo */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center overflow-hidden">
              {formData.profilePhoto ? (
                <img src={formData.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User className="w-10 h-10 text-muted-foreground" />
              )}
            </div>
            <button className="absolute bottom-0 right-0 p-2 rounded-full bg-primary text-primary-foreground">
              <Camera className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="space-y-4">
          {/* Personal Info */}
          <div className="glass p-4 rounded-2xl space-y-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <User className="w-4 h-4" />
              Personal Information
            </h3>

            <div>
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="fatherName">Father's Name</Label>
                <Input
                  id="fatherName"
                  placeholder="Father's name"
                  value={formData.fatherName}
                  onChange={(e) => handleChange('fatherName', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="motherName">Mother's Name</Label>
                <Input
                  id="motherName"
                  placeholder="Mother's name"
                  value={formData.motherName}
                  onChange={(e) => handleChange('motherName', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  placeholder="Age"
                  value={formData.age || ''}
                  onChange={(e) => handleChange('age', parseInt(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label htmlFor="bloodGroup">Blood Group</Label>
                <Select
                  value={formData.bloodGroup}
                  onValueChange={(value) => handleChange('bloodGroup', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {bloodGroups.map(bg => (
                      <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="glass p-4 rounded-2xl space-y-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Contact Information
            </h3>

            <div>
              <Label htmlFor="phone">Phone Number * (Verified)</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+91 XXXXX XXXXX"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
              />
            </div>
          </div>

          {/* ID & Address */}
          <div className="glass p-4 rounded-2xl space-y-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Identification & Address
            </h3>

            <div>
              <Label htmlFor="aadhar">Aadhar Number</Label>
              <Input
                id="aadhar"
                placeholder="XXXX XXXX XXXX"
                value={formData.aadharNumber}
                onChange={(e) => handleChange('aadharNumber', e.target.value)}
                maxLength={14}
              />
            </div>

            <div>
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                placeholder="Enter your full address"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                rows={3}
              />
            </div>
          </div>

          {/* Preferences */}
          <div className="glass p-4 rounded-2xl space-y-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Languages className="w-4 h-4" />
              Preferences
            </h3>

            <div>
              <Label htmlFor="language">Language Preference</Label>
              <Select
                value={formData.languagePreference}
                onValueChange={(value) => handleChange('languagePreference', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  {languages.map(lang => (
                    <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border">
          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={isSaving}
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Profile'}
          </Button>
        </div>
      </div>
    </div>
  );
}
