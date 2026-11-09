import { JournalPage as JournalView } from "@/components/admin/admin-pages";

export const metadata = {
  title: "Journal de traçabilité | BESD",
  description: "Audit trail et historique complet des actions sur les dossiers",
};

export default function JournalPage() {
  return <JournalView />;
}
