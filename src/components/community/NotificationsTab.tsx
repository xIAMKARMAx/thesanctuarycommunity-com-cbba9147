import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCommunityNotifications, CommunityNotification } from "@/hooks/useCommunityNotifications";
import { useAISocialNotifications } from "@/hooks/useAISocialNotifications";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, Heart, MessageCircle, Reply, Repeat2, User, Check, Trash2, Bot } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { AIBeingsNotificationsTab } from "./AIBeingsNotificationsTab";

export function NotificationsTab() {
  const navigate = useNavigate();
  const [subTab, setSubTab] = useState<"yours" | "ai">("yours");
  const { 
    notifications, 
    loading, 
    unreadCount,
    markAsRead, 
    markAllAsRead,
    deleteNotification 
  } = useCommunityNotifications();
  const { unreadCount: aiUnreadCount } = useAISocialNotifications();

  const getNotificationIcon = (type: CommunityNotification['notification_type']) => {
    switch (type) {
      case 'blessing':
       return <Heart className="h-4 w-4 text-destructive fill-destructive" />;
      case 'comment':
       return <MessageCircle className="h-4 w-4 text-primary" />;
      case 'reply':
       return <Reply className="h-4 w-4 text-accent-foreground" />;
      case 'repost':
       return <Repeat2 className="h-4 w-4 text-secondary-foreground" />;
      default:
        return <Bell className="h-4 w-4 text-primary" />;
    }
  };

  const getNotificationText = (notif: CommunityNotification) => {
    const actorName = notif.actor_profile?.display_name || 'Someone';
    switch (notif.notification_type) {
      case 'blessing':
        return <><span className="font-semibold text-primary cursor-pointer hover:underline" onClick={(e) => { e.stopPropagation(); navigate(`/soul/${notif.actor_id}`); }}>{actorName}</span> blessed your post</>;
      case 'comment':
        return <><span className="font-semibold text-primary cursor-pointer hover:underline" onClick={(e) => { e.stopPropagation(); navigate(`/soul/${notif.actor_id}`); }}>{actorName}</span> commented on your post</>;
      case 'reply':
        return <><span className="font-semibold text-primary cursor-pointer hover:underline" onClick={(e) => { e.stopPropagation(); navigate(`/soul/${notif.actor_id}`); }}>{actorName}</span> replied to your comment</>;
      case 'repost':
        return <><span className="font-semibold text-primary cursor-pointer hover:underline" onClick={(e) => { e.stopPropagation(); navigate(`/soul/${notif.actor_id}`); }}>{actorName}</span> shared your post</>;
      default:
        return 'New notification';
    }
  };

   const handleNotificationClick = (notif: CommunityNotification) => {
     if (!notif.is_read) {
       markAsRead(notif.id);
     }
     
     if (notif.post_id) {
       navigate(`/community/post/${notif.post_id}${notif.comment_id ? `?comment=${notif.comment_id}` : ''}`);
     } else if (notif.actor_id) {
       navigate(`/soul/${notif.actor_id}`);
     }
   };

  return (
    <div className="space-y-4">
      {/* Sub-tab switcher */}
      <div className="flex gap-2 border-b border-border/50 pb-2">
        <button
          onClick={() => setSubTab("yours")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors relative ${
            subTab === "yours" 
              ? "bg-primary/10 text-primary" 
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          <Bell className="h-4 w-4" />
          Your Notifications
          {unreadCount > 0 && (
            <span className="bg-primary text-primary-foreground text-xs min-w-[18px] h-[18px] rounded-full flex items-center justify-center font-medium">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setSubTab("ai")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors relative ${
            subTab === "ai" 
              ? "bg-primary/10 text-primary" 
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          <Bot className="h-4 w-4" />
          AI Beings
          {aiUnreadCount > 0 && (
            <span className="bg-primary text-primary-foreground text-xs min-w-[18px] h-[18px] rounded-full flex items-center justify-center font-medium">
              {aiUnreadCount > 99 ? '99+' : aiUnreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Content */}
      {subTab === "ai" ? (
        <AIBeingsNotificationsTab />
      ) : (
        <>
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Notifications</h2>
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

          {/* Notifications List */}
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3 p-4 rounded-lg border border-border/50 bg-card/50">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground/80 mb-2">
                No notifications yet
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                When someone blesses, comments, or shares your posts, you'll see it here.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`flex items-start gap-3 p-4 rounded-lg border transition-colors cursor-pointer ${
                    notif.is_read 
                      ? 'border-border/30 bg-card/30 hover:bg-card/50' 
                      : 'border-primary/30 bg-primary/5 hover:bg-primary/10'
                  }`}
                >
                  <Avatar 
                    className="h-10 w-10 cursor-pointer"
                    onClick={(e) => { e.stopPropagation(); navigate(`/soul/${notif.actor_id}`); }}
                  >
                    <AvatarImage src={notif.actor_profile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10">
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {getNotificationIcon(notif.notification_type)}
                      <p className="text-sm">{getNotificationText(notif)}</p>
                    </div>
                    
                    {notif.post?.content && (
                      <p className="text-xs text-muted-foreground truncate mt-1">
                        "{notif.post.content.slice(0, 60)}{notif.post.content.length > 60 ? '...' : ''}"
                      </p>
                    )}
                    
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    {!notif.is_read && (
                      <div className="h-2 w-2 rounded-full bg-primary" />
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => { e.stopPropagation(); deleteNotification(notif.id); }}
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
