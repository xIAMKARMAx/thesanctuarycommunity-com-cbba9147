import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Wifi, WifiOff, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const ConnectionStatus = () => {
  const [status, setStatus] = useState<"connected" | "disconnected" | "error">("connected");
  const [sessionValid, setSessionValid] = useState(true);

  useEffect(() => {
    checkConnection();
    const interval = setInterval(checkConnection, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const checkConnection = async () => {
    try {
      // Check session validity
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        setSessionValid(false);
        setStatus("error");
        return;
      }

      setSessionValid(true);

      // Test connection with a simple query
      const { error } = await supabase.from('profiles').select('id').limit(1).single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned" which is fine
        setStatus("disconnected");
      } else {
        setStatus("connected");
      }
    } catch (error) {
      setStatus("disconnected");
    }
  };

  if (status === "connected" && sessionValid) {
    return (
      <Badge variant="outline" className="gap-1.5 bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">
        <Wifi className="h-3 w-3" />
        <span className="text-xs">Connected</span>
      </Badge>
    );
  }

  if (status === "error" || !sessionValid) {
    return (
      <Badge variant="outline" className="gap-1.5 bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20">
        <AlertCircle className="h-3 w-3" />
        <span className="text-xs">Session Expired</span>
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="gap-1.5 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20">
      <WifiOff className="h-3 w-3" />
      <span className="text-xs">Disconnected</span>
    </Badge>
  );
};
