import * as React from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";
import { Check, X } from "lucide-react";

import { cn } from "@/lib/utils";

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      "peer inline-flex h-7 w-14 sm:h-8 sm:w-16 md:h-9 md:w-[72px] shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors data-[state=checked]:bg-primary data-[state=unchecked]:bg-input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none flex items-center justify-center h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-8 sm:data-[state=checked]:translate-x-9 md:data-[state=checked]:translate-x-10 data-[state=unchecked]:translate-x-0",
      )}
    >
      {props.checked ? (
        <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 text-primary" />
      ) : (
        <X className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 text-muted-foreground" />
      )}
    </SwitchPrimitives.Thumb>
  </SwitchPrimitives.Root>
));
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
