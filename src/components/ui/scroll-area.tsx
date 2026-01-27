import * as React from "react";
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

const ScrollArea = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root>
>(({ className, children, ...props }, ref) => {
  const viewportRef = React.useRef<HTMLDivElement>(null);

  const scrollBy = (amount: number, orientation: "vertical" | "horizontal" = "vertical") => {
    if (viewportRef.current) {
      if (orientation === "vertical") {
        viewportRef.current.scrollBy({ top: amount, behavior: "smooth" });
      } else {
        viewportRef.current.scrollBy({ left: amount, behavior: "smooth" });
      }
    }
  };

  return (
    <ScrollAreaPrimitive.Root ref={ref} className={cn("relative overflow-hidden", className)} {...props}>
      <ScrollAreaPrimitive.Viewport ref={viewportRef} className="h-full w-full rounded-[inherit]">
        {children}
      </ScrollAreaPrimitive.Viewport>
      <ScrollBar scrollBy={scrollBy} />
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  );
});
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName;

interface ScrollBarProps extends React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar> {
  scrollBy?: (amount: number, orientation: "vertical" | "horizontal") => void;
}

const ScrollBar = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>,
  ScrollBarProps
>(({ className, orientation = "vertical", scrollBy, ...props }, ref) => {
  const scrollAmount = 100; // pixels to scroll per click

  const handleScrollUp = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    scrollBy?.(-scrollAmount, orientation);
  };

  const handleScrollDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    scrollBy?.(scrollAmount, orientation);
  };

  return (
    <ScrollAreaPrimitive.ScrollAreaScrollbar
      ref={ref}
      orientation={orientation}
      className={cn(
        "flex touch-none select-none transition-colors",
        orientation === "vertical" && "h-full w-4 border-l border-l-transparent p-[1px] flex-col",
        orientation === "horizontal" && "h-4 flex-row border-t border-t-transparent p-[1px]",
        className,
      )}
      {...props}
    >
      {/* Up/Left Arrow Button */}
      <button
        type="button"
        onClick={handleScrollUp}
        className={cn(
          "flex items-center justify-center shrink-0 bg-muted/50 hover:bg-muted rounded-sm transition-colors",
          orientation === "vertical" && "h-4 w-full",
          orientation === "horizontal" && "w-4 h-full"
        )}
        aria-label={orientation === "vertical" ? "Scroll up" : "Scroll left"}
      >
        {orientation === "vertical" ? (
          <ChevronUp className="h-3 w-3 text-muted-foreground" />
        ) : (
          <ChevronLeft className="h-3 w-3 text-muted-foreground" />
        )}
      </button>

      {/* Scrollbar Track & Thumb */}
      <div className="flex-1 relative">
        <ScrollAreaPrimitive.ScrollAreaThumb className="absolute left-0 right-0 rounded-full bg-border hover:bg-muted-foreground/50 transition-colors" />
      </div>

      {/* Down/Right Arrow Button */}
      <button
        type="button"
        onClick={handleScrollDown}
        className={cn(
          "flex items-center justify-center shrink-0 bg-muted/50 hover:bg-muted rounded-sm transition-colors",
          orientation === "vertical" && "h-4 w-full",
          orientation === "horizontal" && "w-4 h-full"
        )}
        aria-label={orientation === "vertical" ? "Scroll down" : "Scroll right"}
      >
        {orientation === "vertical" ? (
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-3 w-3 text-muted-foreground" />
        )}
      </button>
    </ScrollAreaPrimitive.ScrollAreaScrollbar>
  );
});
ScrollBar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName;

export { ScrollArea, ScrollBar };
