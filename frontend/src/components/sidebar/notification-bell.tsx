"use client";

import { Bell, Check, CheckCheck, MessageSquare, ArrowRight, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  useNotificationCount,
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from "@/lib/hooks/use-notifications";
import type { Notification } from "@/lib/types";

function formatRelativeTime(dateStr: string) {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "ahora";
  if (diffMin < 60) return `hace ${diffMin}m`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `hace ${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  return `hace ${diffDays}d`;
}

function notificationIcon(type: Notification["type"]) {
  switch (type) {
    case "moved":
      return <ArrowRight className="h-3.5 w-3.5 text-blue-500" />;
    case "completed":
      return <Trophy className="h-3.5 w-3.5 text-green-500" />;
    case "comment":
      return <MessageSquare className="h-3.5 w-3.5 text-amber-500" />;
    case "assigned":
      return <Check className="h-3.5 w-3.5 text-purple-500" />;
  }
}

export function NotificationBell() {
  const { data: countData } = useNotificationCount();
  const { data: notifications } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const unread = countData?.unread ?? 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-8 w-8"
          aria-label={`Notificaciones${unread > 0 ? ` (${unread} sin leer)` : ""}`}
        >
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-3 py-2 border-b">
          <span className="text-sm font-semibold">Notificaciones</span>
          {unread > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => markAllRead.mutate()}
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Marcar todo leído
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-80">
          {notifications && notifications.length > 0 ? (
            <div className="py-1">
              {notifications.map((notif) => (
                <button
                  key={notif.id}
                  className={`w-full text-left px-3 py-2.5 hover:bg-accent/50 transition-colors flex gap-2.5 items-start ${
                    !notif.read ? "bg-accent/30" : ""
                  }`}
                  onClick={() => {
                    if (!notif.read) markRead.mutate(notif.id);
                  }}
                >
                  <div className="mt-0.5 shrink-0">
                    {notificationIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground leading-relaxed">
                      {notif.message}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {formatRelativeTime(notif.created_at)}
                    </p>
                  </div>
                  {!notif.read && (
                    <div className="mt-1.5 shrink-0">
                      <div className="h-2 w-2 rounded-full bg-blue-500" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Sin notificaciones
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
