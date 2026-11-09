import { UserPlus } from "lucide-react";
import { PlaceholderPage } from "@/components/placeholder-page";

export const metadata = {
  title: "Nouveau compte utilisateur | BESD",
  description: "Création d'un nouveau compte agent au sein du bureau",
};

export default function NouveauComptePage() {
  return (
    <PlaceholderPage
      title="Création d'un compte utilisateur"
      description="Formulaire de création d'un compte interne (identité, rôle, cellule de rattachement, statut)."
      breadcrumb={[
        { label: "Administration" },
        { label: "Comptes", href: "/administration/comptes" },
        { label: "Nouveau compte" },
      ]}
      icon={UserPlus}
      code="ECR-16"
    />
  );
}

