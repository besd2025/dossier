import { notFound } from "next/navigation";
import DetailNoteClient from "./detail-note-client";
import { getNote } from "@/lib/services/notes-service";

export const metadata = {
  title: "Détail de la note | BESD",
  description: "Versions Word, observations et historique de la note",
};

export default async function DetailNotePage({ params }) {
  const { id, noteId } = await params;
  const note = await getNote(noteId);
  if (!note || note.dossierId !== id) notFound();

  return <DetailNoteClient initialNote={note} dossierId={id} />;
}
