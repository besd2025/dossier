import MesDossiersClient from "./mes-dossiers-client";

export const metadata = {
  title: "Mes dossiers à traiter | BESD",
  description: "Dossiers attribués à l'utilisateur courant",
};

export default function MesDossiersPage() {
  return <MesDossiersClient />;
}
