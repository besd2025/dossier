import { notFound } from "next/navigation";
import ValidationClient from "./validation-client";
import { getNote } from "@/lib/services/notes-service";

export const metadata = {
  title: "Validation de la note | BESD",
  description: "Écran de validation de la note par le Chef de bureau",
};

export default async function ValidationNotePage({ params }) {
  const { id, noteId } = await params;
  const note = await getNote(noteId);
  if (!note || note.dossierId !== id) notFound();

  return <ValidationClient initialNote={note} dossierId={id} />;
}
