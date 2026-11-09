import CachetsClient from "./cachets-client";

export const metadata = {
  title: "Secrétariat — Cachet / Transmission | BESD",
  description: "Notes signées en attente d'apposition de cachet et de transmission",
};

export default function CachetsPage() {
  return <CachetsClient />;
}
