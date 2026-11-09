"use client";

import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * @typedef {Object} TableSkeletonProps
 * @property {number} [columns=5] - Nombre de colonnes
 * @property {number} [rows=5] - Nombre de lignes simulées
 * @property {boolean} [showHeader=true] - Affiche le faux en-tête
 * @property {boolean} [showToolbar=true] - Affiche la fausse barre d'outils
 * @property {string} [className] - Classes CSS personnalisées
 */

/**
 * Squelette de chargement harmonisé pour les tableaux TanStack Table.
 *
 * @param {TableSkeletonProps} props
 */
export function TableSkeleton({
  columns = 5,
  rows = 5,
  showHeader = true,
  showToolbar = true,
  className,
}) {
  return (
    <div className={cn("w-full space-y-3", className)}>
      {/* Fausse barre d'outils */}
      {showToolbar && (
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1">
            <Skeleton className="h-8 w-56 rounded-md" />
            <Skeleton className="h-8 w-32 rounded-md hidden sm:block" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-24 rounded-md" />
            <Skeleton className="h-8 w-20 rounded-md" />
          </div>
        </div>
      )}

      {/* Tableau avec bordure */}
      <div className="rounded-lg border bg-card overflow-hidden">
        {/* En-tête */}
        {showHeader && (
          <div className="flex items-center gap-4 bg-muted/40 border-b px-4 py-3">
            {Array.from({ length: columns }).map((_, idx) => (
              <Skeleton
                key={`th-${idx}`}
                className={cn(
                  "h-4 rounded",
                  idx === 0 ? "w-28" : idx === 1 ? "w-44" : "flex-1"
                )}
              />
            ))}
          </div>
        )}

        {/* Lignes du corps */}
        <div className="divide-y divide-border">
          {Array.from({ length: rows }).map((_, rowIdx) => (
            <div
              key={`tr-${rowIdx}`}
              className="flex items-center gap-4 px-4 py-3"
            >
              {Array.from({ length: columns }).map((_, colIdx) => (
                <Skeleton
                  key={`td-${rowIdx}-${colIdx}`}
                  className={cn(
                    "h-4 rounded",
                    colIdx === 0
                      ? "w-24"
                      : colIdx === 1
                      ? "w-40"
                      : colIdx === columns - 1
                      ? "w-16 ml-auto"
                      : "flex-1"
                  )}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Fausse pagination */}
      <div className="flex items-center justify-between px-2 pt-1">
        <Skeleton className="h-4 w-36 rounded" />
        <div className="flex items-center gap-1.5">
          <Skeleton className="h-7 w-20 rounded" />
          <Skeleton className="h-7 w-28 rounded" />
        </div>
      </div>
    </div>
  );
}

export default TableSkeleton;

