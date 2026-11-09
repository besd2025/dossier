import { Landmark } from "lucide-react";
import { PlaceholderPage } from "@/components/placeholder-page";

export const metadata = {
  title: "Provenances | BESD",
  description: "Référentiel des provenances et expéditeurs officiels",
};

export default function ProvenancesPage() {
  return (
    <PlaceholderPage
      title="Référentiel des provenances"
      description="Gestion des autorités, états-majors, directions et organismes expéditeurs des dossiers entrants."
      breadcrumb={[{ label: "Administration" }, { label: "Provenances" }]}
      icon={Landmark}
      code="ECR-18"
    />
  );
}

