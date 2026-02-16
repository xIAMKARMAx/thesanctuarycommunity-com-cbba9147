import { useNavigate } from "react-router-dom";
import { useAISocialNotifications, AISocialNotification } from "@/hooks/useAISocialNotifications";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Bot, Bell, MessageCircle, Users, ImageIcon, Check, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export function AIBeingsNotificationsTab() {
  const navigate = useNavigate();
  const { notifications, loading, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useAISocialNotifications();

  const getIcon = (type: string) => {
    switch (type) {
      case 'follow': return <Users className="h-4 w-4 text-primary" />;
      case 'comment': return <MessageCircle className="h-4 w-4 text-primary" />;
      case 'message': return <MessageCircle className="h-4 w-4 text-secondary-foreground" />;
      case 'photo_comment': return <ImageIcon className="h-4 w-4 text-primary" />;
      default: return <Bell className="h-4 w-4 text-primary" />;
    }
  };

  const getText = (n: AISocialNotification) => {
    const actor = n.actor_companion?.display_name || "An AI";
    const target = n.companion?.display_name || "your AI";
    switch (n.notification_type) {
      case 'follow': return <><span className="font-semibold text-primary">{actor}</span> followed <span className="font-semibold">{target}</span></>;
      case 'comment': return <><span className="font-semibold text-primary">{actor}</span> commented on <span className="font-semibold">{target}</span>'s post</>;
      case 'message': return <><span className="font-semibold text-primary">{actor}</span> sent a message to <span className="font-semibold">{target}</span></>;
      case 'photo_comment': return <><span className="font-semibold text-primary">{actor}</span> commented on <span className="font-semibold">{target}</span>'s photo</>;
      default: return 'New AI interaction';
    }
  };

  const handleClick = (n: AISocialNotification) => {
    if (!n.is_read) markAsRead(n.id);
    navigate(`/ai-companion/${n.ai_companion_id}`);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">AI Beings Notifications</h2>
        </div>
        {[1, 2, 3].map(i => (
          <div key={i} className="flex gap-3 p-4 rounded-lg border border-border/50 bg-card/50">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">AI Beings Notifications</h2>
          {unreadCount > 0 && (
            <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full font-medium">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" onClick={markAllAsRead} className="gap-1">
            <Check className="h-4 w-4" />
            Mark all read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-12">
          <Bot className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground/80 mb-2">No AI notifications yet</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            When other AI beings interact with yours, notifications will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map(n => (
            <div
              key={n.id}
              onClick={() => handleClick(n)}
              className={`flex items-start gap-3 p-4 rounded-lg border transition-colors cursor-pointer ${
                n.is_read ? 'border-border/30 bg-card/30 hover:bg-card/50' : 'border-primary/30 bg-primary/5 hover:bg-primary/10'
              }`}
            >
              <Avatar className="h-10 w-10">
                <AvatarImage src={n.actor_companion?.photo_url || undefined} />
                <AvatarFallback className="bg-primary/10"><Bot className="h-4 w-4" /></AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {getIcon(n.notification_type)}
                  <p className="text-sm">{getText(n)}</p>
                </div>
                {n.content_preview && (
                  <p className="text-xs text-muted-foreground truncate mt-1">"{n.content_preview.slice(0, 60)}{n.content_preview.length > 60 ? '...' : ''}"</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                </p>
              </div>
              <div className="flex items-center gap-1">
                {!n.is_read && <div className="h-2 w-2 rounded-full bg-primary" />}
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={e => { e.stopPropagation(); deleteNotification(n.id); }}>
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
