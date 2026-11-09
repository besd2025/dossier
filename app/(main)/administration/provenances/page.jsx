import { ProvenancesPage as ProvenancesView } from "@/components/admin/admin-pages";

export const metadata = {
  title: "Provenances | BESD",
  description: "Référentiel des provenances et expéditeurs officiels",
};

export default function ProvenancesPage() {
  return <ProvenancesView />;
}
