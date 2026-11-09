import { ShieldCheck } from "lucide-react";
import { PlaceholderPage } from "@/components/placeholder-page";

export const metadata = {
  title: "Validation de la note | BESD",
  description: "Écran de validation de la note par le Chef de bureau",
};

export default async function ValidationNotePage({ params }) {
  const { id, noteId } = await params;

  return (
    <PlaceholderPage
      title={`Validation de la note n° ${noteId} — Dossier ${id}`}
      description="Validation finale ou demande de corrections avant impression et passage en circuit de signature."
      breadcrumb={[
        { label: "Dossiers", href: "/dossiers" },
        { label: `Dossier ${id}`, href: `/dossiers/${id}` },
        { label: `Note ${noteId}`, href: `/dossiers/${id}/notes/${noteId}` },
        { label: "Validation" },
      ]}
      icon={ShieldCheck}
      code="ECR-06"
    />
  );
}

