import { Search } from "lucide-react";
import { PlaceholderPage } from "@/components/placeholder-page";

export const metadata = {
  title: "Recherche intelligente | BESD",
  description: "Recherche avancée multi-critères sur les dossiers et notes",
};

export default function RecherchePage() {
  return (
    <PlaceholderPage
      title="Recherche intelligente"
      description="Recherche multicritère avancée (numéro, référence, date d'enregistrement, mot-clé, rédacteur, statut)."
      breadcrumb={[{ label: "Pilotage" }, { label: "Recherche" }]}
      icon={Search}
      code="ECR-14"
    />
  );
}

