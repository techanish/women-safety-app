import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { User, Phone, Users, Calendar, Droplet, MapPin, CreditCard, Download } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { UserProfile } from '@/contexts/AuthContext';

interface FullProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: UserProfile;
}

export function FullProfileDialog({ open, onOpenChange, profile }: FullProfileDialogProps) {
  // Generate emergency info for QR code
  const emergencyData = JSON.stringify({
    name: profile.name,
    phone: profile.phone,
    age: profile.age,
    gender: profile.gender,
    bloodGroup: profile.bloodGroup,
    address: profile.address,
    fatherName: profile.fatherName,
    motherName: profile.motherName,
    aadharNumber: profile.aadharNumber ? `****${profile.aadharNumber.slice(-4)}` : '',
  });

  // Format phone number
  const formatPhone = (phone: string) => {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
    }
    return phone;
  };

  // Download QR code as image
  const downloadQR = () => {
    const svg = document.getElementById('emergency-qr-code');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');

      const downloadLink = document.createElement('a');
      downloadLink.download = `${profile.name}-emergency-qr.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Emergency Profile & QR Code</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Profile Header */}
          <div className="flex items-center gap-4 p-4 bg-muted rounded-xl">
            {profile.profilePhoto ? (
              <img
                src={profile.profilePhoto}
                alt={profile.name}
                className="w-20 h-20 rounded-full object-cover border-2 border-primary"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary">
                <User className="w-12 h-12 text-primary" />
              </div>
            )}
            <div>
              <h3 className="text-xl font-bold">{profile.name}</h3>
              <p className="text-sm text-muted-foreground">{formatPhone(profile.phone)}</p>
            </div>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Profile Details */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                Personal Information
              </h4>

              <div className="space-y-3">
                <InfoItem icon={<Calendar />} label="Age" value={`${profile.age} years`} />
                <InfoItem icon={<User />} label="Gender" value={profile.gender?.toUpperCase() || 'N/A'} />
                {profile.bloodGroup && (
                  <InfoItem icon={<Droplet />} label="Blood Group" value={profile.bloodGroup} />
                )}
                <InfoItem icon={<Phone />} label="Phone" value={formatPhone(profile.phone)} />
              </div>

              <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mt-6">
                Family Information
              </h4>

              <div className="space-y-3">
                <InfoItem icon={<Users />} label="Father's Name" value={profile.fatherName} />
                <InfoItem icon={<Users />} label="Mother's Name" value={profile.motherName} />
              </div>

              <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mt-6">
                Additional Details
              </h4>

              <div className="space-y-3">
                <InfoItem icon={<MapPin />} label="Address" value={profile.address} />
                {profile.aadharNumber && (
                  <InfoItem
                    icon={<CreditCard />}
                    label="Aadhar"
                    value={`****-****-${profile.aadharNumber.slice(- 4)}`}
                  />
                )}
              </div>
            </div>

            {/* QR Code */}
            <div className="flex flex-col items-center justify-start space-y-4">
              <div className="bg-white p-6 rounded-2xl shadow-lg">
                <QRCodeSVG
                  id="emergency-qr-code"
                  value={emergencyData}
                  size={220}
                  level="H"
                  includeMargin={true}
                />
              </div>

              <div className="text-center space-y-2">
                <p className="text-sm font-semibold">Emergency QR Code</p>
                <p className="text-xs text-muted-foreground">
                  Scan this QR code to quickly access emergency contact information
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadQR}
                  className="mt-2"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download QR Code
                </Button>
              </div>

              <div className="text-xs text-muted-foreground text-center p-4 bg-muted/50 rounded-lg">
                💡 <strong>Tip:</strong> Print this QR code and keep it in your wallet or save it on your phone's lock screen for emergency situations.
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Helper component for info items
function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="p-2 rounded-lg bg-primary/10 text-primary flex-shrink-0">
        {React.cloneElement(icon as React.ReactElement, { className: 'w-4 h-4' })}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium break-words">{value}</p>
      </div>
    </div>
  );
}
