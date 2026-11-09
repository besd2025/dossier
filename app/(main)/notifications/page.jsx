import NotificationsClient from "./notifications-client";

export const metadata = {
  title: "Notifications | BESD",
  description: "Centre de notifications et alertes dossiers",
};

export default function NotificationsPage() {
  return <NotificationsClient />;
}
