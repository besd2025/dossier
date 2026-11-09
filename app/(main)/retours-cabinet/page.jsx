import { Undo2 } from "lucide-react";
import { PlaceholderPage } from "@/components/placeholder-page";

export const metadata = {
  title: "Retours du cabinet | BESD",
  description: "Liste et enregistrement des retours du cabinet ministériel",
};

export default function RetoursCabinetPage() {
  return (
    <PlaceholderPage
      title="Retours du cabinet"
      description="Historique et enregistrement des décisions, annotations et retours émanant du cabinet du ministre."
      breadcrumb={[{ label: "Secrétariat" }, { label: "Retours du cabinet" }]}
      icon={Undo2}
      code="ECR-12"
    />
  );
}

