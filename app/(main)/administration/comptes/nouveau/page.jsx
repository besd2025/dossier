import { NouveauComptePage as NouveauCompteView } from "@/components/admin/admin-pages";

export const metadata = {
  title: "Nouveau compte utilisateur | BESD",
  description: "Création d'un nouveau compte agent au sein du bureau",
};

export default function NouveauComptePage() {
  return <NouveauCompteView />;
}
