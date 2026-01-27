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

  const scrollAmount = 100; // pixels to scroll per click

  return (
    <ScrollAreaPrimitive.Root ref={ref} className={cn("relative overflow-hidden", className)} {...props}>
      <ScrollAreaPrimitive.Viewport ref={viewportRef} className="h-full w-full rounded-[inherit]">
        {children}
      </ScrollAreaPrimitive.Viewport>
      
      {/* Custom scroll controls container - positioned on the right */}
      <div className="absolute right-0 top-0 bottom-0 w-4 flex flex-col">
        {/* Up Arrow Button */}
        <button
          type="button"
          onClick={() => scrollBy(-scrollAmount, "vertical")}
          className="flex items-center justify-center h-4 w-full bg-muted/80 hover:bg-muted rounded-sm transition-colors z-10"
          aria-label="Scroll up"
        >
          <ChevronUp className="h-3 w-3 text-muted-foreground" />
        </button>

        {/* Scrollbar in the middle */}
        <div className="flex-1 relative">
          <ScrollBar />
        </div>

        {/* Down Arrow Button */}
        <button
          type="button"
          onClick={() => scrollBy(scrollAmount, "vertical")}
          className="flex items-center justify-center h-4 w-full bg-muted/80 hover:bg-muted rounded-sm transition-colors z-10"
          aria-label="Scroll down"
        >
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </button>
      </div>

      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  );
});
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName;

const ScrollBar = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>
>(({ className, orientation = "vertical", ...props }, ref) => (
  <ScrollAreaPrimitive.ScrollAreaScrollbar
    ref={ref}
    orientation={orientation}
    className={cn(
      "flex touch-none select-none transition-colors",
      orientation === "vertical" && "h-full w-2.5 border-l border-l-transparent p-[1px]",
      orientation === "horizontal" && "h-2.5 flex-col border-t border-t-transparent p-[1px]",
      className,
    )}
    {...props}
  >
    <ScrollAreaPrimitive.ScrollAreaThumb className="relative flex-1 rounded-full bg-border" />
  </ScrollAreaPrimitive.ScrollAreaScrollbar>
));
ScrollBar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName;

export { ScrollArea, ScrollBar };
