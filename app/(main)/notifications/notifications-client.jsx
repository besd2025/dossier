"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck, Mail, MailOpen, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import {
  EmptyState,
  ErrorState,
} from "@/components/shared";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getNotifications, markAllNotificationsAsRead, markNotificationAsRead } from "@/lib/services/notifications-service";
import { useSessionStore } from "@/stores/session/session-store";

const TYPE_LABELS = {
  RECEPTION: "Réception",
  AFFECTATION: "Affectation",
  DEPOT_VERSION: "Dépôt de version",
  OBSERVATION: "Observation",
  VALIDATION: "Validation",
  IMPRESSION: "Impression",
  SIGNATURE: "Signature",
  CACHET: "Cachet",
  TRANSMISSION: "Transmission",
  RETOUR: "Retour du cabinet",
  REOUVERTURE: "Réouverture",
  CREATION_COMPTE: "Création de compte",
  ACCES: "Accès",
};

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(date);
}

export default function NotificationsPage() {
  const userId = useSessionStore((state) => (state.currentUser || state.user)?.id);
  const [notifications, setNotifications] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [filter, setFilter] = useState("TOUTES");
  const [typeFilter, setTypeFilter] = useState("TOUS");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [working, setWorking] = useState(false);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const rows = await getNotifications(userId);
      setNotifications(rows);
      setSelectedId((current) => current && rows.some((item) => item.id === current)
        ? current
        : rows[0]?.id || null);
    } catch (loadError) {
      setError(loadError.message || "Impossible de charger les notifications.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    const timer = window.setTimeout(loadNotifications, 0);
    return () => window.clearTimeout(timer);
  }, [loadNotifications]);

  const types = useMemo(
    () => [...new Set(notifications.map((item) => item.type).filter(Boolean))].sort(),
    [notifications]
  );
  const filteredNotifications = useMemo(
    () => notifications.filter((notification) =>
      (filter !== "NON_LUES" || !notification.lue) &&
      (typeFilter === "TOUS" || notification.type === typeFilter)
    ),
    [notifications, filter, typeFilter]
  );
  const selected = filteredNotifications.find((item) => item.id === selectedId) || filteredNotifications[0] || null;

  async function handleSelect(notification) {
    setSelectedId(notification.id);
    if (notification.lue) return;
    try {
      await markNotificationAsRead(notification.id, userId);
      setNotifications((rows) => rows.map((row) =>
        row.id === notification.id ? { ...row, lue: true } : row
      ));
    } catch (markError) {
      toast.error(markError.message || "La notification n'a pas pu être marquée comme lue.");
    }
  }

  async function markAllAsRead() {
    if (working) return;
    setWorking(true);
    try {
      await markAllNotificationsAsRead(userId);
      setNotifications((rows) => rows.map((row) => ({ ...row, lue: true })));
      toast.success("Toutes les notifications sont marquées comme lues.");
    } catch (markError) {
      toast.error(markError.message || "Les notifications n'ont pas pu être mises à jour.");
    } finally {
      setWorking(false);
    }
  }

  const unreadCount = notifications.filter((notification) => !notification.lue).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="mb-1 flex items-center gap-2 text-sm text-muted-foreground">
            <Bell className="size-4" />
            Communication
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Centre de notifications</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Vos alertes de dossiers, affectations et étapes de traitement.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" disabled={loading} onClick={loadNotifications}>
            <RefreshCw className="size-4" />
            Actualiser
          </Button>
          <Button type="button" variant="outline" disabled={!unreadCount || working} onClick={markAllAsRead}>
            <CheckCheck className="size-4" />
            Tout marquer comme lu
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <label htmlFor="notification-read-filter" className="text-xs font-medium text-muted-foreground">État</label>
          <select
            id="notification-read-filter"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            className="h-9 min-w-36 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="TOUTES">Toutes</option>
            <option value="NON_LUES">Non lues</option>
          </select>
        </div>
        <div className="space-y-1">
          <label htmlFor="notification-type-filter" className="text-xs font-medium text-muted-foreground">Type</label>
          <select
            id="notification-type-filter"
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
            className="h-9 min-w-48 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="TOUS">Tous les types</option>
            {types.map((type) => <option key={type} value={type}>{TYPE_LABELS[type] || type}</option>)}
          </select>
        </div>
        <p className="ml-auto text-sm text-muted-foreground" aria-live="polite">
          {unreadCount} non lue{unreadCount > 1 ? "s" : ""}
        </p>
      </div>

      {loading ? (
        <div className="grid gap-4 lg:grid-cols-[minmax(18rem,0.8fr)_minmax(0,1.2fr)]">
          <div className="h-[28rem] animate-pulse rounded-xl bg-muted" />
          <div className="h-[28rem] animate-pulse rounded-xl bg-muted" />
        </div>
      ) : error ? (
        <ErrorState
          title="Notifications indisponibles"
          message="Le centre de notifications n'a pas pu être chargé."
          error={error}
          onRetry={loadNotifications}
        />
      ) : filteredNotifications.length ? (
        <div className="grid min-h-[30rem] gap-4 lg:grid-cols-[minmax(18rem,0.8fr)_minmax(0,1.2fr)]">
          <Card className="min-h-0">
            <CardHeader className="border-b py-3">
              <CardTitle className="text-sm">Messages ({filteredNotifications.length})</CardTitle>
            </CardHeader>
            <CardContent className="max-h-[34rem] overflow-y-auto p-0">
              <ul className="divide-y">
                {filteredNotifications.map((notification) => (
                  <li key={notification.id}>
                    <button
                      type="button"
                      onClick={() => handleSelect(notification)}
                      aria-current={selected?.id === notification.id ? "true" : undefined}
                      className={`w-full px-4 py-3 text-left transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring ${
                        selected?.id === notification.id ? "bg-muted" : ""
                      }`}
                    >
                      <span className="flex items-start gap-3">
                        <span className="mt-0.5 text-muted-foreground" aria-hidden="true">
                          {notification.lue ? <MailOpen className="size-4" /> : <Mail className="size-4" />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-start justify-between gap-2">
                            <span className="text-sm font-medium">{TYPE_LABELS[notification.type] || notification.type}</span>
                            {!notification.lue && <span className="mt-1 size-2 shrink-0 rounded-full bg-primary" aria-label="Non lue" />}
                          </span>
                          <span className="mt-1 line-clamp-2 block text-sm text-muted-foreground">{notification.message}</span>
                          <span className="mt-2 block text-xs text-muted-foreground">{formatDate(notification.date)}</span>
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {selected ? (
            <Card className="min-h-[24rem]">
              <CardHeader className="border-b">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle>{TYPE_LABELS[selected.type] || selected.type}</CardTitle>
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    {selected.canal === "COURRIEL" ? <Mail className="size-3.5" /> : <Bell className="size-3.5" />}
                    {selected.canal === "COURRIEL" ? "Courriel" : selected.canal === "TOUS" ? "Courriel et application" : "Application"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{formatDate(selected.date)}</p>
              </CardHeader>
              <CardContent className="space-y-5 pt-5">
                <p className="whitespace-pre-wrap text-sm leading-6">{selected.message}</p>
                {selected.dossier && (
                  <div className="rounded-lg border p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Dossier associé</p>
                    <p className="mt-2 font-mono text-sm font-semibold text-primary">{selected.dossier.reference}</p>
                    <p className="mt-1 text-sm">{selected.dossier.objet}</p>
                    {selected.dossier.statutDossier && (
                      <div className="mt-3">
                        <StatusBadge status={selected.dossier.statutDossier} size="sm" />
                      </div>
                    )}
                    <Button className="mt-4" size="sm" variant="outline" asChild>
                      <Link href={`/dossiers/${selected.dossierId}`}>Ouvrir le dossier</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="grid min-h-[24rem] place-items-center">
              <CardContent className="pt-6 text-sm text-muted-foreground">Sélectionnez une notification.</CardContent>
            </Card>
          )}
        </div>
      ) : (
        <EmptyState
          icon={Bell}
          title={filter === "NON_LUES" ? "Aucune notification non lue" : "Aucune notification"}
          description="Les événements liés à votre compte apparaîtront ici."
        />
      )}
    </div>
  );
}
