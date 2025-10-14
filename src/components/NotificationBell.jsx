import React, { useEffect, useState, useRef, useMemo } from "react";
import {
  Bell,
  CheckCheck,
  MessageCircle,
  Reply,
  Flag,
  Sparkles,
  ThumbsUp,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import api from "@/services/api";
import authService from "@/services/authService";
import { formatDistanceToNow, isToday, isYesterday, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

const NotificationBell = () => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef(null);

  const byType = {
    comment: {
      icon: MessageCircle,
      color: "text-sky-600",
      bg: "bg-sky-50 dark:bg-sky-950/20",
    },
    reply: {
      icon: Reply,
      color: "text-indigo-600",
      bg: "bg-indigo-50 dark:bg-indigo-950/20",
    },
    like: {
      icon: ThumbsUp,
      color: "text-emerald-600",
      bg: "bg-emerald-50 dark:bg-emerald-950/20",
    },
    report: {
      icon: Flag,
      color: "text-rose-600",
      bg: "bg-rose-50 dark:bg-rose-950/20",
    },
    modification: {
      icon: Sparkles,
      color: "text-amber-600",
      bg: "bg-amber-50 dark:bg-amber-950/20",
    },
    author_pending: {
      icon: Users,
      color: "text-fuchsia-600",
      bg: "bg-fuchsia-50 dark:bg-fuchsia-950/20",
    },
    default: { icon: Bell, color: "text-primary", bg: "bg-primary/5" },
  };

  const groupByDay = useMemo(() => {
    const groups = {};
    for (const n of items) {
      const d = new Date(n.createdAt);
      const k = new Date(
        d.getFullYear(),
        d.getMonth(),
        d.getDate()
      ).toISOString();
      if (!groups[k]) groups[k] = [];
      groups[k].push(n);
    }
    return Object.entries(groups)
      .sort((a, b) => new Date(b[0]) - new Date(a[0]))
      .map(([k, list]) => {
        const d = new Date(list[0].createdAt);
        const label = isToday(d)
          ? "Aujourd'hui"
          : isYesterday(d)
          ? "Hier"
          : d.toLocaleDateString("fr-FR");
        return {
          label,
          items: list.sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
          ),
        };
      });
  }, [items]);

  const load = async () => {
    try {
      setLoading(true);
      const [list, count] = await Promise.all([
        api.getNotifications(20),
        api.getUnreadNotificationsCount(),
      ]);
      setItems(Array.isArray(list?.data) ? list.data : list);
      setUnread(count?.data?.count ?? count?.count ?? 0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Don't fetch if not authenticated (extra guard)
    if (!authService.isAuthenticated()) return;
    load();
    // Poll only when dropdown is open to reduce background churn
    if (!open) return;
    const i = setInterval(load, 45000);
    return () => clearInterval(i);
  }, [open]);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  const markAll = async () => {
    await api.markAllNotificationsRead();
    setUnread(0);
    // Reflect read status locally
    setItems((prev) =>
      prev.map((it) => ({ ...it, readAt: new Date().toISOString() }))
    );
  };

  const markOne = async (id) => {
    try {
      await api.markNotificationRead(id);
      setItems((prev) =>
        prev.map((it) =>
          it.id === id ? { ...it, readAt: new Date().toISOString() } : it
        )
      );
      setUnread((u) => Math.max(0, u - 1));
    } catch {}
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className="relative p-2 rounded-full hover:bg-muted"
        onClick={() => setOpen((o) => !o)}
        title="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] min-w-[16px] h-[16px] px-1 rounded-full flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-96 max-w-[95vw] bg-background border rounded-lg shadow-xl z-50">
          <div className="flex items-center justify-between p-3 border-b">
            <div className="font-medium">Notifications</div>
            <button
              type="button"
              onClick={markAll}
              className="text-sm inline-flex items-center gap-1 px-2 py-1 rounded hover:bg-muted"
            >
              <CheckCheck className="h-4 w-4" /> Tout marquer lu
            </button>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-3 space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-3 p-2">
                    <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-40 bg-muted rounded animate-pulse" />
                      <div className="h-3 w-56 bg-muted rounded animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="p-6 text-sm text-muted-foreground text-center">
                <div className="mx-auto w-10 h-10 rounded-full bg-muted flex items-center justify-center mb-2">
                  <Bell className="h-5 w-5 text-muted-foreground" />
                </div>
                Aucune notification pour le moment
              </div>
            ) : (
              <div className="divide-y">
                {groupByDay.map((group) => (
                  <div key={group.label}>
                    <div className="px-3 py-2 text-[11px] uppercase tracking-wide text-muted-foreground bg-muted/30">
                      {group.label}
                    </div>
                    {group.items.map((n) => {
                      const conf = byType[n.type] || byType.default;
                      const Icon = conf.icon;
                      const rel = formatDistanceToNow(parseISO(n.createdAt), {
                        addSuffix: true,
                        locale: fr,
                      });
                      return (
                        <div
                          key={n.id}
                          className={`px-3 py-2 flex items-start gap-3 ${
                            !n.readAt ? conf.bg : ""
                          }`}
                        >
                          <div className={`mt-0.5 p-1 rounded-full ${conf.bg}`}>
                            <Icon className={`h-4 w-4 ${conf.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium flex items-center gap-2">
                              <span>{n.title}</span>
                              {!n.readAt && (
                                <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
                              )}
                            </div>
                            {n.message && (
                              <div className="text-xs text-muted-foreground mt-0.5 truncate">
                                {n.message}
                              </div>
                            )}
                            <div className="mt-1 text-[11px] text-muted-foreground">
                              {rel}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {n.link && (
                              <Link
                                to={n.link}
                                className="text-primary hover:underline text-xs"
                                onClick={async () => {
                                  if (!n.readAt) await markOne(n.id);
                                }}
                              >
                                Ouvrir
                              </Link>
                            )}
                            {!n.readAt && (
                              <button
                                className="text-xs text-muted-foreground hover:text-foreground"
                                onClick={() => markOne(n.id)}
                              >
                                Marquer lu
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
