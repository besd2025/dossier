import { Building2 } from "lucide-react";
import { PlaceholderPage } from "@/components/placeholder-page";

export const metadata = {
  title: "Cellules | BESD",
  description: "Gestion des cellules de travail du bureau",
};

export default function CellulesPage() {
  return (
    <PlaceholderPage
      title="Cellules du bureau"
      description="Configuration des cellules fonctionnelles, désignation des chefs et adjoints de cellule."
      breadcrumb={[{ label: "Administration" }, { label: "Cellules" }]}
      icon={Building2}
      code="ECR-17"
    />
  );
}

