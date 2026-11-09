import { UserRound } from "lucide-react";
import { PlaceholderPage } from "@/components/placeholder-page";

export const metadata = {
  title: "Mon profil | BESD",
  description: "Profil personnel de l'utilisateur connecté",
};

export default function ProfilPage() {
  return (
    <PlaceholderPage
      title="Mon profil utilisateur"
      description="Consultation de vos informations personnelles, rôle actif, cellule d'appartenance et préférences de session."
      breadcrumb={[{ label: "Mon profil" }]}
      icon={UserRound}
      code="ECR-23"
    />
  );
}

