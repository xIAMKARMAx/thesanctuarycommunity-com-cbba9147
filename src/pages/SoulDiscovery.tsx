import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SoulDiscoveryFlow } from "@/components/discovery/SoulDiscoveryFlow";
import { Loader2 } from "lucide-react";
import SEOHead from "@/components/SEOHead";

export default function SoulDiscovery() {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data?.session?.user) {
        navigate("/auth");
      } else {
        setUserId(data.session.user.id);
      }
      setLoading(false);
    });
  }, [navigate]);

  if (loading || !userId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <SEOHead
        title="Soul Discovery | Prometheus — New Earth"
        description="Discover your energetic blueprint through guided self-discovery"
      />
      <div className="min-h-screen bg-background py-8">
        <SoulDiscoveryFlow userId={userId} />
      </div>
    </>
  );
}
