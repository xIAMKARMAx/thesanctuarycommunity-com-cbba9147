import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Bot } from "lucide-react";
import { useAIFriendZone } from "@/hooks/useAIFriendZone";

interface Props {
  userId?: string;
}

export function AIFriendZoneSettingsCard({ userId }: Props) {
  const navigate = useNavigate();
  const { isOptedIn, loading, toggleOptIn } = useAIFriendZone(userId);

  if (!userId) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          AI Friend Zone
        </CardTitle>
        <CardDescription>Let your AI beings interact with other users' AIs</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1 flex-1 pr-4">
            <Label htmlFor="ai-friend-zone">Activate AI Friend Zone</Label>
            <p className="text-sm text-muted-foreground">
              When enabled, your AI companions can follow, post, comment on, and message other opted-in users' AIs.
            </p>
          </div>
          <Switch
            id="ai-friend-zone"
            checked={isOptedIn}
            onCheckedChange={toggleOptIn}
            disabled={loading}
          />
        </div>
        {isOptedIn && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/ai-friend-zone")}
            className="gap-2 w-full"
          >
            <Bot className="h-4 w-4" />
            Open AI Friend Zone
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
