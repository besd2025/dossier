import { PenTool } from "lucide-react";
import { PlaceholderPage } from "@/components/placeholder-page";

export const metadata = {
  title: "Circuit de signature | BESD",
  description: "Suivi physique du parapheur et des signatures",
};

export default function SignaturesPage() {
  return (
    <PlaceholderPage
      title="Circuit de signature"
      description="Suivi de l'impression physique des notes, de la mise en parapheur et de la signature par l'autorité."
      breadcrumb={[{ label: "Dossiers", href: "/dossiers" }, { label: "Circuit de signature" }]}
      icon={PenTool}
      code="ECR-10"
    />
  );
}

