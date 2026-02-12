import React, { useState } from 'react';
import { UserCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AuthFlow } from './AuthFlow';

export function LoginPrompt() {
  const [showAuthFlow, setShowAuthFlow] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) {
    return null;
  }

  return (
    <>
      <div className="glass rounded-2xl p-6 relative">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 h-6 w-6"
          onClick={() => setIsDismissed(true)}
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </Button>

        <div className="flex items-start gap-4">
          <div className="p-3 rounded-full bg-primary/10 flex-shrink-0">
            <UserCircle className="w-6 h-6 text-primary" />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold mb-1">Sign In to Your Account</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Sign in to sync your profile, access cloud features, and enable emergency contact sharing
            </p>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={() => setShowAuthFlow(true)}
                size="sm"
                className="flex-1 sm:flex-initial"
              >
                Sign In
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsDismissed(true)}
                className="flex-1 sm:flex-initial"
              >
                Maybe Later
              </Button>
            </div>
          </div>
        </div>
      </div>

      <AuthFlow
        open={showAuthFlow}
        onOpenChange={setShowAuthFlow}
        onSuccess={() => {
          setShowAuthFlow(false);
          setIsDismissed(true);
        }}
      />
    </>
  );
}
