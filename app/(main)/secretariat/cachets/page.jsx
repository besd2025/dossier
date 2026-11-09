import { Send } from "lucide-react";
import { PlaceholderPage } from "@/components/placeholder-page";

export const metadata = {
  title: "Secrétariat — Cachet / Transmission | BESD",
  description: "Notes signées en attente d'apposition de cachet et de transmission",
};

export default function CachetsPage() {
  return (
    <PlaceholderPage
      title="Secrétariat : Cachet & Transmission"
      description="Traitement des notes revenues signées : apposition du cachet officiel, numérisation et transmission finale au destinataire."
      breadcrumb={[{ label: "Secrétariat" }, { label: "Cachet / Transmission" }]}
      icon={Send}
      code="ECR-11"
    />
  );
}

