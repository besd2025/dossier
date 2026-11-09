import { Bell } from "lucide-react";
import { PlaceholderPage } from "@/components/placeholder-page";

export const metadata = {
  title: "Notifications | BESD",
  description: "Centre de notifications et alertes dossiers",
};

export default function NotificationsPage() {
  return (
    <PlaceholderPage
      title="Centre de notifications"
      description="Historique des alertes d'échéances, affectations de dossiers, validations et retours du cabinet."
      breadcrumb={[{ label: "Communication" }, { label: "Notifications" }]}
      icon={Bell}
      code="ECR-13"
    />
  );
}

