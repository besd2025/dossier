import { KeyRound } from "lucide-react";
import { PlaceholderPage } from "@/components/placeholder-page";

export const metadata = {
  title: "Accès exceptionnels | BESD",
  description: "Délégations et droits d'accès exceptionnels aux dossiers",
};

export default function AccesExceptionnelsPage() {
  return (
    <PlaceholderPage
      title="Accès exceptionnels"
      description="Gestion des autorisations ponctuelles de consultation et de traitement accordées hors cellule."
      breadcrumb={[{ label: "Administration" }, { label: "Accès exceptionnels" }]}
      icon={KeyRound}
      code="ECR-19"
    />
  );
}

