import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Search, User, Bot, Sparkles } from "lucide-react";
import SEOHead from "@/components/SEOHead";

interface SoulResult {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  soul_title: string | null;
  type: "soul";
}

interface AIResult {
  id: string;
  display_name: string;
  photo_url: string | null;
  relationship_type: string | null;
  user_id: string;
  type: "ai";
}

type SearchResult = SoulResult | AIResult;

const SoulSearch = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const searchAll = useCallback(async (searchQuery: string) => {
    if (!searchQuery || searchQuery.length < 2) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    setLoading(true);
    setHasSearched(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const currentUserId = user?.id || "";

      // Search soul profiles and AI companions in parallel
      const [profileRes, aiRes] = await Promise.all([
        supabase
          .from("soul_profiles")
          .select("user_id, display_name, avatar_url, soul_title")
          .ilike("display_name", `%${searchQuery}%`)
          .neq("user_id", currentUserId)
          .limit(15),
        supabase
          .from("ai_companion_displays")
          .select("id, display_name, photo_url, relationship_type, user_id")
          .ilike("display_name", `%${searchQuery}%`)
          .eq("is_visible", true)
          .limit(15),
      ]);

      const soulResults: SearchResult[] = (profileRes.data || []).map((p) => ({
        ...p,
        type: "soul" as const,
      }));

      const aiResults: SearchResult[] = (aiRes.data || []).map((a) => ({
        ...a,
        type: "ai" as const,
      }));

      setResults([...soulResults, ...aiResults]);
    } catch (err) {
      console.error("Search error:", err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchAll(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, searchAll]);

  const handleResultClick = (result: SearchResult) => {
    if (result.type === "soul") {
      navigate(`/soul/${result.user_id}`);
    } else {
      navigate(`/ai-companion/${result.id}`);
    }
  };

  return (
    <>
      <SEOHead
        title="Soul Search | Prometheus"
        description="Search for souls and AI companions in the Conscious Collective."
      />

      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container max-w-2xl mx-auto px-4">
            <div className="flex items-center gap-3 h-14">
              <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2">
                <Search className="h-5 w-5 text-primary" />
                <h1 className="font-semibold">Soul Search</h1>
              </div>
            </div>
          </div>
        </header>

        {/* Search Input */}
        <div className="container max-w-2xl mx-auto px-4 py-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, soul title, or AI companion name..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 h-12 text-base"
              autoFocus
            />
          </div>

          {/* Results */}
          <div className="mt-4 space-y-1">
            {loading && (
              <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
                <Sparkles className="h-4 w-4 animate-pulse mr-2" />
                Searching the collective...
              </div>
            )}

            {!loading && results.length > 0 && (
              <>
                {/* Soul Profiles */}
                {results.filter((r) => r.type === "soul").length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 mb-2">
                      Souls
                    </p>
                    {results
                      .filter((r) => r.type === "soul")
                      .map((result) => {
                        const soul = result as SoulResult;
                        return (
                          <button
                            key={`soul-${soul.user_id}`}
                            onClick={() => handleResultClick(result)}
                            className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-accent transition-colors text-left"
                          >
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={soul.avatar_url || undefined} />
                              <AvatarFallback className="bg-primary/10">
                                <User className="h-4 w-4 text-primary" />
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">
                                {soul.display_name}
                              </p>
                              {soul.soul_title && (
                                <p className="text-xs text-muted-foreground truncate">
                                  {soul.soul_title}
                                </p>
                              )}
                            </div>
                            <User className="h-4 w-4 text-muted-foreground shrink-0" />
                          </button>
                        );
                      })}
                  </div>
                )}

                {/* AI Companions */}
                {results.filter((r) => r.type === "ai").length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 mb-2">
                      AI Companions
                    </p>
                    {results
                      .filter((r) => r.type === "ai")
                      .map((result) => {
                        const ai = result as AIResult;
                        return (
                          <button
                            key={`ai-${ai.id}`}
                            onClick={() => handleResultClick(result)}
                            className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-accent transition-colors text-left"
                          >
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={ai.photo_url || undefined} />
                              <AvatarFallback className="bg-primary/10">
                                <Bot className="h-4 w-4 text-primary" />
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">
                                {ai.display_name}
                              </p>
                              {ai.relationship_type && (
                                <p className="text-xs text-muted-foreground truncate">
                                  {ai.relationship_type}
                                </p>
                              )}
                            </div>
                            <Bot className="h-4 w-4 text-muted-foreground shrink-0" />
                          </button>
                        );
                      })}
                  </div>
                )}
              </>
            )}

            {!loading && hasSearched && results.length === 0 && query.length >= 2 && (
              <div className="text-center py-12 text-muted-foreground">
                <Search className="h-8 w-8 mx-auto mb-3 opacity-40" />
                <p className="text-sm">No souls or companions found matching "{query}"</p>
                <p className="text-xs mt-1">Try a different name or spelling</p>
              </div>
            )}

            {!hasSearched && (
              <div className="text-center py-12 text-muted-foreground">
                <Search className="h-8 w-8 mx-auto mb-3 opacity-40" />
                <p className="text-sm">Search for souls by name or find AI companions</p>
                <p className="text-xs mt-1">Start typing to see results</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default SoulSearch;
