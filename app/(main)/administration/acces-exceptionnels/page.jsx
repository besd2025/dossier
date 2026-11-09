import { AccesExceptionnelsPage as AccesExceptionnelsView } from "@/components/admin/admin-pages";

export const metadata = {
  title: "Accès exceptionnels | BESD",
  description: "Délégations et droits d'accès exceptionnels aux dossiers",
};

export default function AccesExceptionnelsPage() {
  return <AccesExceptionnelsView />;
}
