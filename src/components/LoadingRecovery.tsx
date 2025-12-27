import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertTriangle } from "lucide-react";

interface LoadingRecoveryProps {
  loadingStep: string;
  onRecovery: () => void;
  showAfterMs?: number;
}

export const LoadingRecovery = ({ 
  loadingStep, 
  onRecovery, 
  showAfterMs = 5000 
}: LoadingRecoveryProps) => {
  const [showRecovery, setShowRecovery] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setElapsedTime(elapsed);
      
      if (elapsed * 1000 >= showAfterMs) {
        setShowRecovery(true);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [showAfterMs]);

  const handleRecovery = () => {
    // Clear all cached data including Supabase session
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('chat_conversation_') || 
          key.startsWith('active_ai_profile_') ||
          key.startsWith('sb-')) {
        localStorage.removeItem(key);
      }
    });
    
    // Clear session storage
    sessionStorage.clear();
    
    onRecovery();
  };

  const handleRetry = () => {
    // Just refresh the page without clearing cache
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4 max-w-md px-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="text-muted-foreground">
          {loadingStep}
          {elapsedTime > 3 && ` (${elapsedTime}s)`}
        </p>
        
        {showRecovery && (
          <div className="mt-6 p-4 border border-border rounded-lg bg-card space-y-4 animate-in fade-in duration-300">
            <div className="flex items-center gap-2 text-amber-500 justify-center">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-medium">Taking longer than expected</span>
            </div>
            <p className="text-sm text-muted-foreground">
              This may be due to a slow connection. Try refreshing first, or clear cache if the problem persists.
            </p>
            <div className="flex flex-col gap-2">
              <Button 
                onClick={handleRetry}
                variant="default"
                className="w-full gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh Page
              </Button>
              <Button 
                onClick={handleRecovery}
                variant="outline"
                className="w-full gap-2"
              >
                Clear Cache & Sign Out
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
