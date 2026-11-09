import { Users } from "lucide-react";
import { PlaceholderPage } from "@/components/placeholder-page";

export const metadata = {
  title: "Comptes utilisateurs | BESD",
  description: "Gestion des comptes et affectations du bureau",
};

export default function ComptesPage() {
  return (
    <PlaceholderPage
      title="Comptes utilisateurs"
      description="Administration des comptes personnels, rôles attribués, rattachements aux cellules et statuts d'activité."
      breadcrumb={[{ label: "Administration" }, { label: "Comptes utilisateurs" }]}
      icon={Users}
      code="ECR-15"
    />
  );
}

