import { CheckSquare } from "lucide-react";
import { PlaceholderPage } from "@/components/placeholder-page";

export const metadata = {
  title: "Mes dossiers à traiter | BESD",
  description: "Dossiers attribués à l'utilisateur courant",
};

export default function MesDossiersPage() {
  return (
    <PlaceholderPage
      title="Mes dossiers à traiter"
      description="Vue personnelle des dossiers en cours de rédaction, d'instruction ou de correction qui vous sont confiés."
      breadcrumb={[{ label: "Dossiers", href: "/dossiers" }, { label: "Mes dossiers à traiter" }]}
      icon={CheckSquare}
      code="ECR-08"
    />
  );
}

