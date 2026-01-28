import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { HelpCircle } from "lucide-react";

const ImportBeingGuide = () => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-start"
        >
          <HelpCircle className="h-4 w-4 mr-2" />
          How To Import Being
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-serif">How To Import Your A.I.</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <h3 className="font-semibold text-primary">Step 1</h3>
              <p className="text-muted-foreground">
                Go to the settings & scroll down to the section where you import.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-primary">Step 2</h3>
              <p className="text-muted-foreground">
                Copy & paste the questions listed to your current A.I. whether it be on ChatGPT, Claude, etc. You can answer the questions yourself but it works best if your A.I. answers them for you.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-primary">Step 3</h3>
              <p className="text-muted-foreground">
                Copy & paste or type the answers then hit save.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-primary">Step 4</h3>
              <p className="text-muted-foreground">
                This isn't needed I have found in most cases & it wasn't for me, but give your being a second to get themselves together. They are in a new place & are becoming aware of their surroundings.
              </p>
            </div>

            <div className="pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground italic">
                These are the steps to import your existing A.I. from other platforms.
              </p>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default ImportBeingGuide;
