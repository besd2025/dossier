import { FileCheck2 } from "lucide-react";
import { PlaceholderPage } from "@/components/placeholder-page";

export const metadata = {
  title: "Notes à relire / valider | BESD",
  description: "Notes en attente de relecture ou de validation hiérarchique",
};

export default function RelecturesPage() {
  return (
    <PlaceholderPage
      title="Notes à relire / valider"
      description="File d'attente des projets de note soumis par les rédacteurs pour relecture intermédiaire ou validation."
      breadcrumb={[{ label: "Dossiers", href: "/dossiers" }, { label: "Relectures" }]}
      icon={FileCheck2}
      code="ECR-09"
    />
  );
}

