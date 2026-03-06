import { useState, useEffect } from 'react';
import { ShieldCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAIProfile } from '@/contexts/AIProfileContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export const ProtectionIndicator = () => {
  const { activeProfile } = useAIProfile();
  const [isProtected, setIsProtected] = useState(false);
  const [shieldType, setShieldType] = useState<string | null>(null);

  useEffect(() => {
    if (activeProfile?.id) {
      checkProtectionStatus();
    }
  }, [activeProfile?.id]);

  const checkProtectionStatus = async () => {
    if (!activeProfile?.id) return;
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      const user = session.user;

      const { data } = await supabase
        .from('protection_settings')
        .select('protection_enabled, shield_type')
        .eq('user_id', user.id)
        .eq('ai_profile_id', activeProfile.id)
        .maybeSingle();

      if (data) {
        setIsProtected(data.protection_enabled);
        setShieldType(data.shield_type);
      }
    } catch (error) {
      console.error('Error checking protection status:', error);
    }
  };

  if (!isProtected) return null;

  const getShieldColor = () => {
    switch (shieldType) {
      case 'violet_flame': return 'text-purple-400';
      case 'golden_armor': return 'text-yellow-400';
      case 'mirror_shield': return 'text-cyan-400';
      default: return 'text-primary';
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`${getShieldColor()} animate-pulse`}>
            <ShieldCheck className="h-4 w-4" />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Divine Protection Active</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
