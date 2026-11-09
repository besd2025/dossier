"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Check, Mail } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { getNotifications, markNotificationAsRead } from "@/lib/services/notifications-service";
import { useSessionStore } from "@/stores/session/session-store";

function formatRelativeDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function NotificationBell() {
  const userId = useSessionStore((state) => (state.currentUser || state.user)?.id);
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const loadNotifications = useCallback(async () => {
    if (!userId) return;
    try {
      setNotifications(await getNotifications(userId));
    } catch (error) {
      toast.error(error.message || "Impossible de charger les notifications.");
    }
  }, [userId]);

  useEffect(() => {
    const initialTimer = window.setTimeout(loadNotifications, 0);
    const timer = window.setInterval(loadNotifications, 10000);
    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(timer);
    };
  }, [loadNotifications]);

  async function openNotification(notification) {
    try {
      if (!notification.lue) {
        await markNotificationAsRead(notification.id, userId);
        setNotifications((rows) => rows.map((row) =>
          row.id === notification.id ? { ...row, lue: true } : row
        ));
      }
      setOpen(false);
      router.push(notification.dossierId
        ? `/dossiers/${notification.dossierId}`
        : "/notifications");
    } catch (error) {
      toast.error(error.message || "La notification n'a pas pu être ouverte.");
    }
  }

  const unreadCount = notifications.filter((notification) => !notification.lue).length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="relative size-8"
            aria-label={`Notifications${unreadCount ? `, ${unreadCount} non lue${unreadCount > 1 ? "s" : ""}` : ""}`}
          >
            <Bell className="size-4" aria-hidden="true" />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 inline-flex min-h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-none text-destructive-foreground">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </Button>
        }
      />
      <PopoverContent align="end" className="w-[min(22rem,calc(100vw-2rem))] p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <p className="font-semibold">Notifications</p>
          <span className="text-xs text-muted-foreground">{unreadCount} non lue{unreadCount > 1 ? "s" : ""}</span>
        </div>
        {notifications.length ? (
          <ul className="max-h-96 divide-y overflow-y-auto">
            {notifications.slice(0, 5).map((notification) => (
              <li key={notification.id}>
                <button
                  type="button"
                  className="flex w-full gap-3 px-4 py-3 text-left hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-none"
                  onClick={() => openNotification(notification)}
                >
                  <span className="mt-0.5 shrink-0 text-muted-foreground" aria-hidden="true">
                    {notification.canal === "COURRIEL" ? <Mail className="size-4" /> : <Bell className="size-4" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm leading-5">{notification.message}</span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {formatRelativeDate(notification.date)} · {notification.canal === "COURRIEL" ? "Courriel" : "Application"}
                    </span>
                  </span>
                  {!notification.lue && (
                    <span className="mt-1 size-2 shrink-0 rounded-full bg-primary" aria-label="Non lue" />
                  )}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">Aucune notification.</p>
        )}
        <div className="border-t p-2">
          <Button variant="ghost" size="sm" className="w-full" asChild>
            <Link href="/notifications">
              <Check className="size-4" />
              Voir toutes les notifications
            </Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
