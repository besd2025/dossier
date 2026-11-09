import { UnauthorizedPage } from "@/components/unauthorized-page";

export const metadata = {
  title: "Accès non autorisé | BESD",
  description: "Page d'accès restreint selon les habilitations BESD",
};

export default function Page() {
  return <UnauthorizedPage />;
}

