import { mockRuntime } from "@/lib/mock/runtime-state";

const delay = (ms = 40) => new Promise((resolve) => setTimeout(resolve, ms));

export async function getNotifications(userId) {
  await delay();
  if (!userId) throw new Error("Utilisateur non identifié.");
  return mockRuntime.notifications
    .filter((notification) =>
      notification.destinataireId === userId || notification.destinataireId === "TOUS"
    )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .map((notification) => ({
      ...notification,
      dossier: notification.dossierId
        ? mockRuntime.dossiers.find((dossier) => dossier.id === notification.dossierId) || null
        : null,
    }));
}

export async function markNotificationAsRead(notificationId, userId) {
  await delay(20);
  const notification = mockRuntime.notifications.find(
    (item) => item.id === notificationId &&
      (item.destinataireId === userId || item.destinataireId === "TOUS")
  );
  if (!notification) throw new Error("Notification introuvable.");
  notification.lue = true;
  return notification;
}

export async function markAllNotificationsAsRead(userId) {
  await delay(30);
  if (!userId) throw new Error("Utilisateur non identifié.");
  for (const notification of mockRuntime.notifications) {
    if (
      notification.destinataireId === userId ||
      notification.destinataireId === "TOUS"
    ) {
      notification.lue = true;
    }
  }
}
