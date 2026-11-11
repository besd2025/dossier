"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarDays, FileSearch, History, Search, Tag } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  EmptyState,
  ErrorState,
  StatusBadge,
  TableSkeleton,
} from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { searchDossiers, getSearchFacets } from "@/lib/services/search-service";
import { useSessionStore } from "@/stores/session/session-store";

function HighlightedText({ text, query }) {
  if (!text || !query?.trim()) return text || null;
  const value = String(text);
  const terms = query
    .trim()
    .split(/\s+/)
    .map((term) =>
      term
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase(),
    )
    .filter(Boolean);
  const normalized = [];
  const sourceMap = [];
  let sourceIndex = 0;
  for (const character of value) {
    const folded = character
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
    for (let index = 0; index < folded.length; index += 1) {
      normalized.push(folded[index]);
      sourceMap.push({
        start: sourceIndex,
        end: sourceIndex + character.length,
      });
    }
    sourceIndex += character.length;
  }
  const normalizedText = normalized.join("");
  const ranges = [];
  for (const term of terms) {
    let start = normalizedText.indexOf(term);
    while (start !== -1) {
      ranges.push({
        start: sourceMap[start].start,
        end: sourceMap[start + term.length - 1].end,
      });
      start = normalizedText.indexOf(term, start + term.length);
    }
  }
  ranges.sort((a, b) => a.start - b.start);
  const mergedRanges = ranges.reduce((merged, range) => {
    const previous = merged[merged.length - 1];
    if (previous && range.start <= previous.end)
      previous.end = Math.max(previous.end, range.end);
    else merged.push({ ...range });
    return merged;
  }, []);
  const parts = [];
  let cursor = 0;
  for (const range of mergedRanges) {
    if (cursor < range.start) parts.push(value.slice(cursor, range.start));
    parts.push(
      <mark
        key={`${range.start}-${range.end}`}
        className="rounded-sm bg-amber-300/70 px-0.5 text-foreground dark:bg-amber-400/40"
      >
        {value.slice(range.start, range.end)}
      </mark>,
    );
    cursor = range.end;
  }
  if (cursor < value.length) parts.push(value.slice(cursor));
  return parts;
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(date);
}

export default function RechercheClient() {
  const userId = useSessionStore(
    (state) => (state.currentUser || state.user)?.id,
  );
  const userCelluleId = useSessionStore(
    (state) => (state.currentUser || state.user)?.celluleId,
  );
  const role = useSessionStore((state) => state.role);
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");
  const [filters, setFilters] = useState({
    dateFrom: "",
    dateTo: "",
    celluleId: "",
    status: "",
    provenanceId: "",
  });
  const [facets, setFacets] = useState({
    cellules: [],
    provenances: [],
    statuts: [],
  });
  const [results, setResults] = useState([]);
  const [loadingFacets, setLoadingFacets] = useState(true);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");

  const runSearch = useCallback(
    async (searchQuery, searchFilters = {}) => {
      if (!searchQuery.trim()) {
        setResults([]);
        setSearched(false);
        setAppliedQuery("");
        return;
      }
      setSearching(true);
      setError("");
      try {
        const rows = await searchDossiers(
          searchQuery,
          searchFilters,
          { id: userId, celluleId: userCelluleId },
          role,
        );
        setResults(rows);
        setAppliedQuery(searchQuery.trim());
        setSearched(true);
        const params = new URLSearchParams();
        params.set("q", searchQuery.trim());
        router.replace(`/recherche?${params.toString()}`, { scroll: false });
      } catch (searchError) {
        setError(searchError.message || "La recherche a échoué.");
      } finally {
        setSearching(false);
      }
    },
    [role, router, userCelluleId, userId],
  );

  useEffect(() => {
    let active = true;
    getSearchFacets()
      .then((data) => {
        if (active) setFacets(data);
      })
      .catch((loadError) => {
        if (active)
          setError(
            loadError.message || "Les filtres n'ont pas pu être chargés.",
          );
      })
      .finally(() => {
        if (active) setLoadingFacets(false);
      });

    const timer = window.setTimeout(() => {
      const initialQuery =
        new URLSearchParams(window.location.search).get("q") || "";
      if (initialQuery) {
        setQuery(initialQuery);
        runSearch(initialQuery, {});
      }
    }, 0);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [runSearch]);

  const statusOptions = facets.statuts;

  function updateFilter(key, value) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    runSearch(query);
  }

  function clearFilters() {
    const cleared = {
      dateFrom: "",
      dateTo: "",
      celluleId: "",
      status: "",
      provenanceId: "",
    };
    setFilters(cleared);
    if (query.trim()) runSearch(query, cleared);
  }

  return (
    <div className="space-y-5">
      <div>
        <div className="mb-1 flex items-center gap-2 text-sm text-muted-foreground">
          <FileSearch className="size-4" />
          Pilotage
        </div>
        <h1 className="text-2xl font-bold tracking-tight">
          Recherche intelligente
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Recherchez dans les dossiers, les mots-clés, les notes et leur
          historique selon vos droits d’accès.
        </p>
      </div>

      <Card>
        <CardContent className="space-y-4 pt-5">
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-2 sm:flex-row"
          >
            <label htmlFor="global-search-query" className="sr-only">
              Terme de recherche
            </label>
            <Input
              id="global-search-query"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Référence, objet, mot-clé ou terme dans une note…"
              className="h-10"
            />
            <Button
              type="submit"
              className="h-10 sm:min-w-32"
              disabled={!query.trim() || searching}
            >
              <Search className="size-4" />
              Rechercher
            </Button>
          </form>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div className="flex flex-col space-y-2">
              <label
                htmlFor="search-date-from"
                className="text-xs font-medium text-muted-foreground"
              >
                Du
              </label>
              <Input
                id="search-date-from"
                type="date"
                value={filters.dateFrom}
                onChange={(event) =>
                  updateFilter("dateFrom", event.target.value)
                }
              />
            </div>
            <div className="flex flex-col space-y-2">
              <label
                htmlFor="search-date-to"
                className="text-xs font-medium text-muted-foreground"
              >
                Au
              </label>
              <Input
                id="search-date-to"
                type="date"
                value={filters.dateTo}
                onChange={(event) => updateFilter("dateTo", event.target.value)}
              />
            </div>
            <div className="flex flex-col space-y-2">
              <label
                htmlFor="search-cell"
                className="text-xs font-medium text-muted-foreground"
              >
                Cellule
              </label>
              <Select
                value={filters.celluleId || "Tous"}
                onValueChange={(value) =>
                  updateFilter("celluleId", value === "Tous" ? "" : value)
                }
                disabled={loadingFacets}
              >
                <SelectTrigger
                  id="search-cell"
                  className="h-9 w-full bg-background px-3 text-sm"
                >
                  <SelectValue placeholder="Toutes les cellules" />
                </SelectTrigger>
                <SelectContent className="px-2 py-1">
                  <SelectItem
                    value="Tous"
                    className="text-xs text-muted-foreground"
                  >
                    Toutes les cellules
                  </SelectItem>
                  {facets.cellules.map((cellule) => (
                    <SelectItem
                      key={cellule.id}
                      value={cellule.id}
                      className="text-sm"
                    >
                      {cellule.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col space-y-2">
              <label
                htmlFor="search-status"
                className="text-xs font-medium text-muted-foreground"
              >
                Statut
              </label>
              <Select
                value={filters.status || "Tous"}
                onValueChange={(value) =>
                  updateFilter("status", value === "Tous" ? "" : value)
                }
                disabled={loadingFacets}
              >
                <SelectTrigger
                  id="search-status"
                  className="h-9 w-full bg-background px-3 text-sm"
                >
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent className="px-2 py-1 w-max">
                  <SelectItem
                    value="Tous"
                    className="text-xs text-muted-foreground"
                  >
                    Tous les statuts
                  </SelectItem>
                  {statusOptions.map((status) => (
                    <SelectItem
                      key={`${status.type}-${status.id}`}
                      value={status.id}
                      className="text-sm"
                    >
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col space-y-2">
              <label
                htmlFor="search-provenance"
                className="text-xs font-medium text-muted-foreground"
              >
                Provenance
              </label>
              <Select
                value={filters.provenanceId || "Tous"}
                onValueChange={(value) =>
                  updateFilter("provenanceId", value === "Tous" ? "" : value)
                }
                disabled={loadingFacets}
              >
                <SelectTrigger
                  id="search-provenance"
                  className="h-9 w-full bg-background px-3 text-sm"
                >
                  <SelectValue placeholder="Toutes les provenances" />
                </SelectTrigger>
                <SelectContent className="px-2 py-1">
                  <SelectItem
                    value="Tous"
                    className="text-xs text-muted-foreground"
                  >
                    Toutes les provenances
                  </SelectItem>
                  {facets.provenances.map((provenance) => (
                    <SelectItem
                      key={provenance.id}
                      value={provenance.id}
                      className="text-sm"
                    >
                      {provenance.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearFilters}
            >
              Effacer les filtres
            </Button>
          </div>
        </CardContent>
      </Card>

      {searching ? (
        <TableSkeleton rows={4} columns={1} />
      ) : error ? (
        <ErrorState
          title="Recherche indisponible"
          message="Les résultats n'ont pas pu être chargés."
          error={error}
          onRetry={() => runSearch(appliedQuery || query, filters)}
        />
      ) : !searched ? (
        <EmptyState
          icon={Search}
          title="Lancez une recherche"
          description="Saisissez un terme pour rechercher dans les dossiers accessibles et les mots-clés."
        />
      ) : results.length ? (
        <section
          aria-label={`Résultats de recherche pour ${appliedQuery}`}
          className="space-y-3"
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground" aria-live="polite">
              {results.length} résultat{results.length > 1 ? "s" : ""} pour «{" "}
              {appliedQuery} »
            </p>
            <span className="hidden items-center gap-1 text-xs text-muted-foreground sm:inline-flex">
              <CalendarDays className="size-3.5" />
              Date de réception BESD
            </span>
          </div>
          {results.map((result) => (
            <Card
              key={result.dossierId}
              onClick={() => router.push(`/dossiers/${result.dossierId}`)}
              className="cursor-pointer"
            >
              <CardContent className="space-y-3 p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    {result.inScope ? (
                      <Link
                        href={`/dossiers/${result.dossierId}`}
                        className="font-mono text-sm font-semibold text-primary underline-offset-4 hover:underline"
                      >
                        <HighlightedText
                          text={result.reference}
                          query={appliedQuery}
                        />
                      </Link>
                    ) : (
                      <p className="text-sm font-semibold text-muted-foreground">
                        {result.reference}
                      </p>
                    )}
                    {result.objet && (
                      <p className="mt-1 text-sm font-medium">
                        <HighlightedText
                          text={result.objet}
                          query={appliedQuery}
                        />
                      </p>
                    )}
                    {result.inScope && result.date && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Reçu le {formatDate(result.date)}
                      </p>
                    )}
                  </div>
                  {result.statutDossier && (
                    <StatusBadge status={result.statutDossier} size="sm" />
                  )}
                  {!result.statutDossier && (
                    <span className="rounded-md border px-2 py-1 text-xs text-muted-foreground">
                      Hors périmètre : détails limités
                    </span>
                  )}
                </div>

                <div
                  className="flex flex-wrap gap-1.5"
                  aria-label="Types de correspondance"
                >
                  {result.matchTypes.map((type) => (
                    <span
                      key={type}
                      className="rounded-full border bg-muted/40 px-2 py-0.5 text-[11px] text-muted-foreground"
                    >
                      {type}
                    </span>
                  ))}
                </div>

                {result.matchingKeywords.length > 0 && (
                  <div className="flex flex-wrap items-start gap-2">
                    <span className="inline-flex items-center gap-1 pt-1 text-xs font-medium text-muted-foreground">
                      <Tag className="size-3.5" /> Mots-clés
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {result.matchingKeywords.map((keyword) => (
                        <span
                          key={keyword}
                          className="rounded-md bg-primary/10 px-2 py-1 text-xs text-primary"
                        >
                          <HighlightedText
                            text={keyword}
                            query={appliedQuery}
                          />
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {result.excerpt && (
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <p className="mb-1 text-xs font-medium text-muted-foreground">
                      Extrait de la dernière version de la note
                    </p>
                    <p className="text-sm leading-6">
                      <HighlightedText
                        text={result.excerpt}
                        query={appliedQuery}
                      />
                    </p>
                  </div>
                )}

                {result.matchingHistory.length > 0 && (
                  <div className="space-y-2">
                    <p className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
                      <History className="size-3.5" /> Historique correspondant
                    </p>
                    <ul className="space-y-1.5">
                      {result.matchingHistory.map((entry, index) => (
                        <li
                          key={`${entry.date}-${index}`}
                          className="flex flex-wrap gap-x-2 text-xs"
                        >
                          <time className="shrink-0 text-muted-foreground">
                            {formatDate(entry.date)}
                          </time>
                          <span>
                            <HighlightedText
                              text={entry.description}
                              query={appliedQuery}
                            />
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </section>
      ) : (
        <EmptyState
          icon={FileSearch}
          title="Aucun résultat"
          description="Aucun dossier accessible ne correspond à ces termes et filtres."
        />
      )}
    </div>
  );
}
