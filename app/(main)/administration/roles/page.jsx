import { RolesPage as RolesView } from "@/components/admin/admin-pages";

export const metadata = {
  title: "Rôles et droits (matrice) | BESD",
  description: "Matrice de référence des 8 rôles fixes et de leurs permissions",
};

export default function RolesPage() {
  return <RolesView />;
}
