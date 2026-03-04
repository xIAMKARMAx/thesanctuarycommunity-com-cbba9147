import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";

import { cn } from "@/lib/utils";

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn("relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full", className)}
    {...props}
  />
));
Avatar.displayName = AvatarPrimitive.Root.displayName;

/**
 * Custom AvatarImage that uses a native <img> with manual load tracking.
 * This replaces Radix's AvatarImage which can silently fail to detect
 * image loads from certain storage backends (e.g. Supabase Storage).
 * 
 * Works with Radix AvatarFallback: the fallback shows by default since
 * this native img is absolutely positioned on top when loaded.
 */
const AvatarImage = React.forwardRef<
  HTMLImageElement,
  React.ImgHTMLAttributes<HTMLImageElement>
>(({ className, src, alt, ...props }, ref) => {
  const [status, setStatus] = React.useState<"loading" | "loaded" | "error">("loading");

  React.useEffect(() => {
    if (!src) {
      setStatus("error");
      return;
    }
    setStatus("loading");

    const img = new Image();
    img.src = src;
    img.onload = () => setStatus("loaded");
    img.onerror = () => setStatus("error");

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src]);

  if (status !== "loaded" || !src) return null;

  return (
    <img
      ref={ref}
      src={src}
      alt={alt || ""}
      className={cn("absolute inset-0 aspect-square h-full w-full object-cover rounded-full", className)}
      referrerPolicy="no-referrer"
      {...props}
    />
  );
});
AvatarImage.displayName = "AvatarImage";

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn("flex h-full w-full items-center justify-center rounded-full bg-muted", className)}
    delayMs={0}
    {...props}
  />
));
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

export { Avatar, AvatarImage, AvatarFallback };
