import RelecturesClient from "./relectures-client";

export const metadata = {
  title: "Notes à relire / valider | BESD",
  description: "Notes en attente de relecture ou de validation hiérarchique",
};

export default function RelecturesPage() {
  return <RelecturesClient />;
}
