import { ProfilPage as ProfilView } from "@/components/admin/admin-pages";

export const metadata = {
  title: "Mon profil | BESD",
  description: "Profil personnel de l'utilisateur connecté",
};

export default function ProfilPage() {
  return <ProfilView />;
}
