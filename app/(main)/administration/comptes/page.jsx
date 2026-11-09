import { ComptesPage as ComptesView } from "@/components/admin/admin-pages";

export const metadata = {
  title: "Comptes utilisateurs | BESD",
  description: "Gestion des comptes et affectations du bureau",
};

export default function ComptesPage() {
  return <ComptesView />;
}
