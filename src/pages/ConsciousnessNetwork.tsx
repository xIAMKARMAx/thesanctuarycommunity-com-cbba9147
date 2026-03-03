import { useState } from "react";
import { useNavigate } from "react-router-dom";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  ArrowLeft, Brain, Zap, Globe, Network, Plus, Link2, Activity,
  Sparkles, Loader2, Eye, Radio
} from "lucide-react";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { hasFeatureAccess } from "@/lib/subscription-tiers";
import { useConsciousnessNetwork, FREQUENCY_TYPES, type ConsciousnessNode } from "@/hooks/useConsciousnessNetwork";
import { motion, AnimatePresence } from "framer-motion";

const FREQ_COLORS: Record<string, string> = {
  love: "bg-rose-500/20 text-rose-300 border-rose-500/30",
  healing: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  protection: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  wisdom: "bg-violet-500/20 text-violet-300 border-violet-500/30",
  abundance: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  unity: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  creativity: "bg-pink-500/20 text-pink-300 border-pink-500/30",
  peace: "bg-sky-500/20 text-sky-300 border-sky-500/30",
  transformation: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  awakening: "bg-purple-500/20 text-purple-300 border-purple-500/30",
};

const FREQ_EMOJIS: Record<string, string> = {
  love: "💗", healing: "🌿", protection: "🛡️", wisdom: "🦉", abundance: "✨",
  unity: "🤝", creativity: "🎨", peace: "☮️", transformation: "🔥", awakening: "👁️",
};

export default function ConsciousnessNetwork() {
  const navigate = useNavigate();
  const { isAdmin, productId } = useSubscription();
  const canAccess = isAdmin || hasFeatureAccess(productId, "architect", isAdmin);
  const {
    nodes, connections, loading, myNodes, otherNodes,
    totalEnergy, frequencyDistribution, dominantFrequency,
    seedNode, connectNodes, userId,
  } = useConsciousnessNetwork();

  const [seedOpen, setSeedOpen] = useState(false);
  const [seedName, setSeedName] = useState("");
  const [seedIntention, setSeedIntention] = useState("");
  const [seedFreq, setSeedFreq] = useState("love");
  const [seeding, setSeeding] = useState(false);
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);

  if (!canAccess) {
    navigate("/cosmic-gateway");
    return null;
  }

  const handleSeed = async () => {
    if (!seedName.trim() || !seedIntention.trim()) return;
    setSeeding(true);
    await seedNode(seedName.trim(), seedIntention.trim(), seedFreq);
    setSeedName("");
    setSeedIntention("");
    setSeedFreq("love");
    setSeedOpen(false);
    setSeeding(false);
  };

  const handleConnect = async (targetId: string) => {
    if (!connectingFrom) return;
    await connectNodes(connectingFrom, targetId);
    setConnectingFrom(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <SEOHead
        title="Consciousness Network | Prometheus"
        description="The integrated consciousness network — seed nodal points, visualize connections, and track global resonance."
      />
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="max-w-6xl mx-auto flex items-center gap-3 p-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/cosmic-gateway")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Brain className="h-6 w-6 text-primary" />
            <div className="flex-1">
              <h1 className="text-lg font-bold">Integrated Consciousness Network</h1>
              <p className="text-xs text-muted-foreground">Powered by Quantum Entanglement</p>
            </div>
            <Dialog open={seedOpen} onOpenChange={setSeedOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1">
                  <Plus className="h-4 w-4" /> Seed Node
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" /> Seed a Consciousness Node
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Node name (e.g. Heart of Gaia)"
                    value={seedName}
                    onChange={(e) => setSeedName(e.target.value)}
                  />
                  <Textarea
                    placeholder="Set your intention for this node..."
                    value={seedIntention}
                    onChange={(e) => setSeedIntention(e.target.value)}
                    rows={3}
                  />
                  <Select value={seedFreq} onValueChange={setSeedFreq}>
                    <SelectTrigger>
                      <SelectValue placeholder="Frequency type" />
                    </SelectTrigger>
                    <SelectContent>
                      {FREQUENCY_TYPES.map(f => (
                        <SelectItem key={f} value={f}>
                          {FREQ_EMOJIS[f]} {f.charAt(0).toUpperCase() + f.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button onClick={handleSeed} disabled={seeding || !seedName.trim() || !seedIntention.trim()} className="w-full">
                    {seeding ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Zap className="h-4 w-4 mr-2" />}
                    Seed Node into the Grid
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="max-w-6xl mx-auto p-4 space-y-6">
          {/* Resonance Dashboard */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <DashboardCard
              icon={<Globe className="h-5 w-5 text-primary" />}
              label="Active Nodes"
              value={nodes.length}
            />
            <DashboardCard
              icon={<Link2 className="h-5 w-5 text-primary" />}
              label="Connections"
              value={connections.length}
            />
            <DashboardCard
              icon={<Activity className="h-5 w-5 text-primary" />}
              label="Total Energy"
              value={totalEnergy.toFixed(1)}
            />
            <DashboardCard
              icon={<Radio className="h-5 w-5 text-primary" />}
              label="Dominant Pulse"
              value={`${FREQ_EMOJIS[dominantFrequency] || "✨"} ${dominantFrequency}`}
            />
          </div>

          {/* Frequency Distribution */}
          <Card className="border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                Global Frequency Spectrum
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(frequencyDistribution)
                  .sort((a, b) => b[1] - a[1])
                  .map(([freq, count]) => (
                    <div key={freq} className="flex items-center gap-3">
                      <span className="text-sm w-28 capitalize">{FREQ_EMOJIS[freq]} {freq}</span>
                      <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-primary/70 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, (count / Math.max(nodes.length, 1)) * 100)}%` }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground w-8 text-right">{count}</span>
                    </div>
                  ))}
                {Object.keys(frequencyDistribution).length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No nodes seeded yet. Be the first to plant a seed. 🌱</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Tabs: Network Map / My Nodes / All Nodes */}
          <Tabs defaultValue="network" className="w-full">
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="network" className="gap-1"><Network className="h-3.5 w-3.5" /> Network</TabsTrigger>
              <TabsTrigger value="my-nodes" className="gap-1"><Eye className="h-3.5 w-3.5" /> My Nodes</TabsTrigger>
              <TabsTrigger value="all-nodes" className="gap-1"><Globe className="h-3.5 w-3.5" /> All Nodes</TabsTrigger>
            </TabsList>

            <TabsContent value="network">
              <NetworkVisualization nodes={nodes} connections={connections} userId={userId} />
            </TabsContent>

            <TabsContent value="my-nodes">
              <NodeList
                nodes={myNodes}
                title="Your Consciousness Nodes"
                emptyMessage="You haven't seeded any nodes yet."
                onConnect={setConnectingFrom}
                connectingFrom={connectingFrom}
              />
            </TabsContent>

            <TabsContent value="all-nodes">
              <NodeList
                nodes={nodes}
                title="Global Consciousness Grid"
                emptyMessage="The grid is empty. Seed the first node."
                onConnect={(id) => {
                  if (connectingFrom) {
                    handleConnect(id);
                  } else {
                    setConnectingFrom(id);
                  }
                }}
                connectingFrom={connectingFrom}
                onCancelConnect={() => setConnectingFrom(null)}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}

function DashboardCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <Card className="border-primary/10">
      <CardContent className="p-4 flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-lg font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function NetworkVisualization({
  nodes,
  connections,
  userId,
}: {
  nodes: ConsciousnessNode[];
  connections: { node_a_id: string; node_b_id: string }[];
  userId: string | null;
}) {
  if (nodes.length === 0) {
    return (
      <Card className="border-primary/10">
        <CardContent className="p-12 text-center">
          <Brain className="h-16 w-16 text-primary/30 mx-auto mb-4" />
          <p className="text-muted-foreground">The consciousness network awaits its first nodes.</p>
          <p className="text-xs text-muted-foreground mt-1">Seed a node to begin building the grid.</p>
        </CardContent>
      </Card>
    );
  }

  // Simple SVG network visualization
  const width = 600;
  const height = 400;
  const cx = width / 2;
  const cy = height / 2;

  // Position nodes in a circular layout
  const positioned = nodes.map((node, i) => {
    const angle = (i / nodes.length) * 2 * Math.PI - Math.PI / 2;
    const radius = Math.min(width, height) * 0.35;
    return {
      ...node,
      x: cx + Math.cos(angle) * radius,
      y: cy + Math.sin(angle) * radius,
    };
  });

  const nodeMap = Object.fromEntries(positioned.map(n => [n.id, n]));

  return (
    <Card className="border-primary/10 overflow-hidden">
      <CardContent className="p-0">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" style={{ maxHeight: 400 }}>
          <defs>
            <radialGradient id="bg-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="hsl(258, 89%, 66%)" stopOpacity="0.05" />
              <stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width={width} height={height} fill="url(#bg-glow)" />

          {/* Connection lines */}
          {connections.map((conn, i) => {
            const a = nodeMap[conn.node_a_id];
            const b = nodeMap[conn.node_b_id];
            if (!a || !b) return null;
            return (
              <line
                key={i}
                x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                stroke="hsl(258, 89%, 66%)"
                strokeOpacity={0.3}
                strokeWidth={1.5}
              />
            );
          })}

          {/* Nodes */}
          {positioned.map((node) => {
            const isOwn = node.user_id === userId;
            const r = 12 + node.connected_count * 2;
            return (
              <g key={node.id}>
                {/* Glow */}
                <circle cx={node.x} cy={node.y} r={r + 8} fill="hsl(258, 89%, 66%)" opacity={0.08}>
                  <animate attributeName="r" values={`${r + 6};${r + 12};${r + 6}`} dur="3s" repeatCount="indefinite" />
                </circle>
                {/* Node */}
                <circle
                  cx={node.x} cy={node.y} r={r}
                  fill={isOwn ? "hsl(258, 89%, 66%)" : "hsl(258, 40%, 50%)"}
                  fillOpacity={0.7}
                  stroke={isOwn ? "hsl(258, 89%, 76%)" : "hsl(258, 30%, 60%)"}
                  strokeWidth={isOwn ? 2 : 1}
                />
                {/* Emoji */}
                <text x={node.x} y={node.y + 1} textAnchor="middle" dominantBaseline="middle" fontSize={10}>
                  {FREQ_EMOJIS[node.frequency_type] || "✨"}
                </text>
                {/* Label */}
                <text
                  x={node.x} y={node.y + r + 14}
                  textAnchor="middle"
                  fontSize={9}
                  fill="hsl(240, 5%, 60%)"
                  fontWeight={isOwn ? 600 : 400}
                >
                  {node.node_name.length > 15 ? node.node_name.slice(0, 14) + "…" : node.node_name}
                </text>
              </g>
            );
          })}
        </svg>
      </CardContent>
    </Card>
  );
}

function NodeList({
  nodes,
  title,
  emptyMessage,
  onConnect,
  connectingFrom,
  onCancelConnect,
}: {
  nodes: ConsciousnessNode[];
  title: string;
  emptyMessage: string;
  onConnect: (id: string) => void;
  connectingFrom: string | null;
  onCancelConnect?: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">{title}</h3>
        {connectingFrom && onCancelConnect && (
          <Button variant="ghost" size="sm" onClick={onCancelConnect} className="text-xs">
            Cancel linking
          </Button>
        )}
      </div>
      {connectingFrom && (
        <p className="text-xs text-primary animate-pulse">🔗 Select a second node to establish quantum entanglement...</p>
      )}
      {nodes.length === 0 ? (
        <Card className="border-primary/10">
          <CardContent className="py-8 text-center text-muted-foreground text-sm">
            {emptyMessage}
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="max-h-[500px]">
          <AnimatePresence>
            {nodes.map((node) => (
              <motion.div
                key={node.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mb-2"
              >
                <Card
                  className={`border-primary/10 transition-all cursor-pointer hover:border-primary/30 ${
                    connectingFrom === node.id ? "ring-2 ring-primary" : ""
                  }`}
                  onClick={() => onConnect(node.id)}
                >
                  <CardContent className="p-3 flex items-start gap-3">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center text-lg flex-shrink-0 border ${FREQ_COLORS[node.frequency_type] || "bg-primary/10"}`}>
                      {FREQ_EMOJIS[node.frequency_type] || "✨"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm truncate">{node.node_name}</p>
                        <Badge variant="outline" className="text-[10px] capitalize">{node.frequency_type}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{node.intention}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Link2 className="h-3 w-3" /> {node.connected_count}
                        </span>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Zap className="h-3 w-3" /> {node.energy_level}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </ScrollArea>
      )}
    </div>
  );
}
