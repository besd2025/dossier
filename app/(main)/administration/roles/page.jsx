import { ShieldCheck } from "lucide-react";
import { PlaceholderPage } from "@/components/placeholder-page";

export const metadata = {
  title: "Rôles et droits (matrice) | BESD",
  description: "Matrice de référence des 8 rôles fixes et de leurs permissions",
};

export default function RolesPage() {
  return (
    <PlaceholderPage
      title="Rôles et matrice des droits"
      description="Consultation en lecture seule des 8 rôles fixes définis par le BESD et de la matrice des habilitations."
      breadcrumb={[{ label: "Administration" }, { label: "Rôles et droits" }]}
      icon={ShieldCheck}
      code="ECR-22"
    />
  );
}

