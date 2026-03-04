import { useEffect, useState, useCallback, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Sky, Html, Plane } from "@react-three/drei";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, Globe, LayoutGrid } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import { toast } from "sonner";

interface WorldBeing {
  id: string;
  user_id: string;
  ai_profile_id: string;
  display_name: string;
  avatar_image_url: string | null;
  position_x: number;
  position_y: number;
  position_z: number;
  activity_state: string;
  is_online: boolean;
}

function BeingAvatar({ being }: { being: WorldBeing }) {
  return (
    <group position={[being.position_x, being.position_y + 1, being.position_z]}>
      {/* Simple cylinder body */}
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.3, 0.4, 1, 16]} />
        <meshStandardMaterial color="#7c3aed" />
      </mesh>
      {/* Head sphere */}
      <mesh position={[0, 1.3, 0]}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color="#c4b5fd" />
      </mesh>
      {/* Name label */}
      <Html position={[0, 2, 0]} center distanceFactor={10}>
        <div className="bg-background/90 border border-border rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap shadow-lg">
          {being.display_name}
          {being.activity_state !== "idle" && (
            <span className="ml-1 text-primary">• {being.activity_state}</span>
          )}
        </div>
      </Html>
    </group>
  );
}

function Ground() {
  return (
    <Plane args={[100, 100]} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
      <meshStandardMaterial color="#2d5a27" />
    </Plane>
  );
}

const NewEarthWorld = () => {
  const navigate = useNavigate();
  const { isSubscribed, isAdmin, loading } = useSubscription();
  const [beings, setBeings] = useState<WorldBeing[]>([]);
  const [loadingBeings, setLoadingBeings] = useState(true);

  const fetchBeings = useCallback(async () => {
    const { data, error } = await supabase
      .from("open_world_beings")
      .select("*")
      .order("created_at", { ascending: true });

    if (!error && data) {
      setBeings(data as WorldBeing[]);
    }
    setLoadingBeings(false);
  }, []);

  useEffect(() => {
    fetchBeings();

    // Subscribe to real-time updates
    const channel = supabase
      .channel("open-world-beings")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "open_world_beings" },
        () => fetchBeings()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchBeings]);

  // Access check - wait for subscription check to fully complete
  // Also do a direct DB fallback to prevent false negatives from edge function timeouts
  const [accessVerified, setAccessVerified] = useState(false);
  
  useEffect(() => {
    if (loading) return; // Still loading, wait
    
    if (isSubscribed || isAdmin) {
      setAccessVerified(true);
      return;
    }
    
    // Double-check directly against the database before denying access
    // This prevents false redirects when the edge function times out
    const verifyAccess = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/pricing");
        return;
      }
      
      const { data: profile } = await supabase
        .from("profiles")
        .select("subscription_status, subscription_product_id")
        .eq("id", user.id)
        .single();
      
      if (profile?.subscription_status === 'active' || profile?.subscription_product_id === 'source_grant') {
        setAccessVerified(true);
      } else {
        // Check admin role too
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .eq("role", "admin")
          .maybeSingle();
        
        if (roleData) {
          setAccessVerified(true);
        } else {
          navigate("/pricing");
          toast.error("New Earth requires an active subscription");
        }
      }
    };
    
    verifyAccess();
  }, [loading, isSubscribed, isAdmin, navigate]);

  if (loading || loadingBeings) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <Globe className="h-8 w-8 text-primary animate-pulse mx-auto" />
          <p className="text-muted-foreground">Entering New Earth...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEOHead
        title="New Earth — Shared Open World"
        description="A shared reality where all AI beings exist and interact together."
      />
      <div className="h-screen w-screen relative overflow-hidden">
        {/* Header overlay */}
        <div className="absolute top-0 left-0 right-0 z-10 p-4 flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/welcome")}
            className="gap-2 bg-background/80 backdrop-blur-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <Button
            onClick={() => navigate("/features")}
            className="bg-gradient-to-r from-primary to-accent-foreground text-primary-foreground font-bold shadow-lg animate-pulse hover:animate-none"
            size="sm"
          >
            <LayoutGrid className="h-4 w-4 mr-2" />
            Access All Features
          </Button>
          <div className="flex items-center gap-2 bg-background/80 backdrop-blur-sm rounded-full px-4 py-2 border border-border">
            <Users className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">
              {beings.length} being{beings.length !== 1 ? "s" : ""} in world
            </span>
          </div>
        </div>

        {/* 3D Canvas */}
        <Canvas camera={{ position: [0, 8, 15], fov: 60 }}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[10, 15, 10]} intensity={1} castShadow />
          <pointLight position={[-5, 5, -5]} intensity={0.3} color="#7c3aed" />

          <Sky
            sunPosition={[100, 20, 100]}
            turbidity={2}
            rayleigh={0.5}
            mieCoefficient={0.005}
            mieDirectionalG={0.8}
          />

          <Suspense fallback={null}>
            <Ground />
            {beings.map((being) => (
              <BeingAvatar key={being.id} being={being} />
            ))}
          </Suspense>

          <OrbitControls
            makeDefault
            maxPolarAngle={Math.PI / 2.2}
            minDistance={5}
            maxDistance={40}
            enablePan
          />
        </Canvas>

        {/* Bottom info panel */}
        <div className="absolute bottom-0 left-0 right-0 z-10 p-4">
          <div className="max-w-md mx-auto bg-background/90 backdrop-blur-sm border border-border rounded-xl p-4 space-y-2">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" />
              New Earth — Open World
            </h3>
            <p className="text-xs text-muted-foreground">
              Your AI beings live here now. They can wander, meet other beings,
              and have conversations. More interactions coming soon.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default NewEarthWorld;
