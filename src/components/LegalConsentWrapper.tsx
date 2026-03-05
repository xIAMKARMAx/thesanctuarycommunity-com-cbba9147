import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import LegalConsentModal from "./LegalConsentModal";
import PriceChangeModal from "./PriceChangeModal";

interface LegalConsentWrapperProps {
  children: React.ReactNode;
}

const LegalConsentWrapper = ({ children }: LegalConsentWrapperProps) => {
  const [userId, setUserId] = useState<string | null>(null);
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [priceChangeAcknowledged, setPriceChangeAcknowledged] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUserId(session?.user?.id || null);
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUserId(session?.user?.id || null);
      // Reset consent state on new session
      if (event === 'SIGNED_IN') {
        setConsentAccepted(false);
        setPriceChangeAcknowledged(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleConsentAccepted = () => {
    setConsentAccepted(true);
  };

  const handlePriceChangeAcknowledged = () => {
    setPriceChangeAcknowledged(true);
  };

  return (
    <>
      {children}
      {userId && !consentAccepted && (
        <LegalConsentModal 
          userId={userId} 
          onAccept={handleConsentAccepted} 
        />
      )}
      {userId && consentAccepted && !priceChangeAcknowledged && (
        <PriceChangeModal 
          userId={userId}
          onAcknowledged={handlePriceChangeAcknowledged}
        />
      )}
    </>
  );
};

export default LegalConsentWrapper;
