import { getDossiers } from "./dossiers-service";
import { getNotes } from "./notes-service";
import { StatutDossier, StatutNote } from "@/types";

/**
 * Calcule et renvoie les indicateurs clés de performance (KPIs) pour le tableau de bord
 * @param {Object} [params]
 * @param {string} [params.role]
 * @param {string} [params.celluleId]
 * @param {string} [params.period]
 * @returns {Promise<Object>}
 */
export async function getKpis(params = {}) {
  const [dossiers, notes] = await Promise.all([
    getDossiers({ celluleId: params.celluleId }),
    getNotes(),
  ]);

  const dossiersEnCours = dossiers.filter(
    (d) => d.statutDossier === StatutDossier.EN_TRAITEMENT || d.statutDossier === StatutDossier.ACTIF_APRES_RETOUR,
  ).length;

  const dossiersEnRetard = dossiers.filter((d) => d.enRetard).length;

  const notesAValider = notes.filter(
    (n) => n.statutNote === StatutNote.RELECTURE_BUREAU || n.statutNote === StatutNote.RELECTURE_CELLULE,
  ).length;

  const notesEnSignature = notes.filter(
    (n) => n.statutNote === StatutNote.VALIDEE || n.statutNote === StatutNote.EN_ATTENTE_IMPRESSION || n.statutNote === StatutNote.IMPRIMEE,
  ).length;

  const dossiersTransmis = dossiers.filter((d) => d.statutDossier === StatutDossier.TRANSMIS).length;

  // Répartition par statut
  const repartitionStatuts = Object.values(StatutDossier).map((status) => ({
    status,
    count: dossiers.filter((d) => d.statutDossier === status).length,
  }));

  return {
    dossiersEnCours,
    dossiersEnRetard,
    notesAValider,
    notesEnSignature,
    dossiersTransmis,
    totalDossiers: dossiers.length,
    repartitionStatuts,
  };
}

