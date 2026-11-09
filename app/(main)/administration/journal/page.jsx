import { History } from "lucide-react";
import { PlaceholderPage } from "@/components/placeholder-page";

export const metadata = {
  title: "Journal de traçabilité | BESD",
  description: "Audit trail et historique complet des actions sur les dossiers",
};

export default function JournalPage() {
  return (
    <PlaceholderPage
      title="Journal de traçabilité"
      description="Historique inaltérable de l'ensemble des opérations (créations, modifications, affectations, validations, suppressions)."
      breadcrumb={[{ label: "Administration" }, { label: "Journal de traçabilité" }]}
      icon={History}
      code="ECR-21"
    />
  );
}

