import RechercheClient from "./recherche-client";

export const metadata = {
  title: "Recherche intelligente | BESD",
  description: "Recherche avancée multi-critères sur les dossiers et notes",
};

export default function RecherchePage() {
  return <RechercheClient />;
}
