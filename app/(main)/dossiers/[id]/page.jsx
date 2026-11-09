import DossierDetailClient from "./dossier-detail-client";

export const metadata = {
  title: "Fiche dossier | BESD",
  description: "Consultation détaillée et suivi d'un dossier",
};

export default async function FicheDossierPage({ params }) {
  const { id } = await params;
  return <DossierDetailClient dossierId={id} />;
}
