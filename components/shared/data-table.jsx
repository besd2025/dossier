"use client";

import * as React from "react";
import {
  useTable,
  createCoreRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  createFilteredRowModel,
} from "@tanstack/react-table";
import {
  ArrowUpDown,
  Check,
  ChevronDown,
  Columns3,
  Download,
  Filter,
  RotateCcw,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { dataTableFeatures } from "@/lib/data-table-features";
import { cn } from "@/lib/utils";

function getPageNumbers(currentPage, pageCount) {
  if (pageCount <= 5) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }
  if (currentPage <= 3) return [1, 2, 3, 4, 5];
  if (currentPage >= pageCount - 2) {
    return [
      pageCount - 4,
      pageCount - 3,
      pageCount - 2,
      pageCount - 1,
      pageCount,
    ];
  }
  return [
    currentPage - 2,
    currentPage - 1,
    currentPage,
    currentPage + 1,
    currentPage + 2,
  ];
}

/**
 * @typedef {Object} DataTableProps
 * @property {import("@tanstack/react-table").Table<any>} [table] - Instance existante de TanStack Table
 * @property {Array} [data] - Données brutes (si table non fournie)
 * @property {Array} [columns] - Définition des colonnes TanStack (si table non fournie)
 * @property {string} [searchPlaceholder="Rechercher..."] - Placeholder du champ de recherche
 * @property {string} [searchColumn] - Colonne ciblée par la recherche (si omitted, utilise le filtre global)
 * @property {string} [emptyMessage="Aucun résultat trouvé."] - Message en cas de table vide
 * @property {boolean} [showSearch=true] - Affiche le champ de recherche
 * @property {boolean} [showColumnVisibility=true] - Affiche le sélecteur de visibilité des colonnes
 * @property {boolean} [showPagination=true] - Affiche les contrôles de pagination
 * @property {boolean} [showSelectionCount=true] - Affiche le nombre de lignes sélectionnées
 * @property {React.ReactNode} [toolbarActions] - Boutons d'action additionnels dans la barre d'outils
 * @property {React.ReactNode} [filters] - Filtres personnalisés (dropdowns, dates...)
 * @property {(row: any) => void} [onRowClick] - Callback lors du clic sur une ligne
 * @property {string} [className] - Classes CSS personnalisées
 */

/**
 * Composant DataTable générique basé sur TanStack Table v9.
 * Intègre tri, pagination, recherche, visibilité des colonnes et sélection.
 *
 * @param {DataTableProps} props
 */
export function DataTable({
  table: propTable,
  data,
  columns,
  searchPlaceholder = "Rechercher...",
  searchColumn,
  emptyMessage = "Aucun résultat trouvé.",
  showSearch = true,
  showColumnVisibility = true,
  showPagination = true,
  showSelectionCount = true,
  toolbarActions,
  filters,
  onRowClick,
  className,
}) {
  // États internes si le composant est utilisé avec data/columns directs
  const [internalSorting, setInternalSorting] = React.useState([]);
  const [internalColumnFilters, setInternalColumnFilters] = React.useState([]);
  const [internalGlobalFilter, setInternalGlobalFilter] = React.useState("");
  const [internalColumnVisibility, setInternalColumnVisibility] =
    React.useState({});
  const [internalRowSelection, setInternalRowSelection] = React.useState({});
  const [internalPagination, setInternalPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });

  // Table autonome créée si aucune prop table n'est transmise
  const internalTable = useTable({
    features: dataTableFeatures,
    data: data || [],
    columns: columns || [],
    state: {
      sorting: internalSorting,
      columnFilters: internalColumnFilters,
      globalFilter: internalGlobalFilter,
      columnVisibility: internalColumnVisibility,
      rowSelection: internalRowSelection,
      pagination: internalPagination,
    },
    onSortingChange: setInternalSorting,
    onColumnFiltersChange: setInternalColumnFilters,
    onGlobalFilterChange: setInternalGlobalFilter,
    onColumnVisibilityChange: setInternalColumnVisibility,
    onRowSelectionChange: setInternalRowSelection,
    onPaginationChange: setInternalPagination,
    getCoreRowModel: createCoreRowModel(),
    getFilteredRowModel: createFilteredRowModel(),
    getSortedRowModel: createSortedRowModel(),
    getPaginationRowModel: createPaginatedRowModel(),
  });

  const table = propTable || internalTable;

  const pageCount = Math.max(table.getPageCount(), 1);
  const currentPage = Math.min(
    (table.state?.pagination?.pageIndex ?? 0) + 1,
    pageCount,
  );
  const pageNumbers = getPageNumbers(currentPage, pageCount);
  const rowsPerPage = `${table.state?.pagination?.pageSize ?? 10}`;

  const selectedCount =
    table.getFilteredSelectedRowModel?.()?.rows?.length ?? 0;
  const totalCount = table.getFilteredRowModel?.()?.rows?.length ?? 0;

  // Gestion de la recherche
  const currentSearchValue = searchColumn
    ? (table.getColumn(searchColumn)?.getFilterValue() ?? "")
    : (table.state?.globalFilter ?? "");

  const handleSearchChange = (value) => {
    if (searchColumn) {
      table.getColumn(searchColumn)?.setFilterValue(value || undefined);
    } else {
      table.setGlobalFilter(value || undefined);
    }
    table.setPageIndex(0);
  };

  return (
    <div className={cn("flex flex-1 flex-col gap-3", className)}>
      {/* Barre d'outils (Recherche, Filtres, Colonnes, Actions) */}
      {(showSearch || showColumnVisibility || toolbarActions || filters) && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            {showSearch && (
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2.5 size-3.5 text-primary" />
                <Input
                  placeholder={searchPlaceholder}
                  value={currentSearchValue}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="h-8 pl-8 pr-7 text-xs bg-background"
                />
                {currentSearchValue && (
                  <button
                    type="button"
                    onClick={() => handleSearchChange("")}
                    className="absolute right-2 top-2 size-4 text-muted-foreground hover:text-foreground inline-flex items-center justify-center rounded-xs"
                    aria-label="Effacer la recherche"
                  >
                    <X className="size-3" />
                  </button>
                )}
              </div>
            )}

            {/* Emplacement pour les filtres externes */}
            {filters}
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {/* Menu de visibilité des colonnes */}
            {showColumnVisibility && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild nativeButton>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs gap-1.5"
                  >
                    <Columns3 className="size-3.5" />
                    <span>Colonnes</span>
                    <ChevronDown className="size-3 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel className="text-xs">
                    Colonnes visibles
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {table
                    .getAllColumns()
                    .filter((col) => col.getCanHide())
                    .map((column) => {
                      return (
                        <DropdownMenuCheckboxItem
                          key={column.id}
                          className="text-xs capitalize"
                          checked={column.getIsVisible()}
                          onCheckedChange={(value) =>
                            column.toggleVisibility(Boolean(value))
                          }
                        >
                          {typeof column.columnDef.header === "string"
                            ? column.columnDef.header
                            : column.id}
                        </DropdownMenuCheckboxItem>
                      );
                    })}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Actions additionnelles */}
            {toolbarActions}
          </div>
        </div>
      )}

      {/* Conteneur de tableau stylisé */}
      <div className="rounded-lg border bg-card overflow-hidden shadow-xs">
        <Table className="**:data-[slot='table-cell']:px-3 **:data-[slot='table-head']:px-3 text-sm">
          <TableHeader className="bg-muted border-b">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="py-2.5 select-none">
                    {header.isPlaceholder ? null : (
                      <table.FlexRender header={header} />
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className={cn(
                    "hover:bg-muted/40 transition-colors border-b last:border-b-0",
                    onRowClick && "cursor-pointer",
                  )}
                  data-state={row.getIsSelected() && "selected"}
                  onClick={() => onRowClick?.(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-2.5 align-middle">
                      <table.FlexRender cell={cell} />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={table.getVisibleLeafColumns().length}
                  className="h-32 text-center text-muted-foreground text-xs"
                >
                  <div className="flex flex-col items-center justify-center gap-1.5">
                    <Filter className="size-5 text-muted-foreground/50 mb-1" />
                    <span className="font-medium text-foreground">
                      {emptyMessage}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      Essayez de modifier vos critères de recherche ou vos
                      filtres.
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination et compteurs */}
      {showPagination && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-1 pt-1">
          <div className="text-muted-foreground flex items-center gap-4 text-xs">
            {showSelectionCount && (
              <span className="tabular-nums">
                {selectedCount > 0 ? (
                  <span className="font-medium text-primary">
                    {selectedCount} sélectionnée(s) sur {totalCount}
                  </span>
                ) : (
                  <span>{totalCount} élément(s) au total</span>
                )}
              </span>
            )}

            <div className="flex items-center gap-1.5">
              <span className="text-[11px]">Lignes / page :</span>
              <Select
                value={rowsPerPage}
                onValueChange={(value) => table.setPageSize(Number(value))}
              >
                <SelectTrigger
                  size="sm"
                  className="w-16 h-7 text-xs bg-background"
                >
                  <SelectValue placeholder={rowsPerPage} />
                </SelectTrigger>
                <SelectContent side="top">
                  <SelectGroup>
                    {[5, 10, 20, 50, 100].map((pageSize) => (
                      <SelectItem
                        key={pageSize}
                        value={`${pageSize}`}
                        className="text-xs"
                      >
                        {pageSize}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-muted-foreground mr-1 tabular-nums">
              Page {currentPage} sur {pageCount}
            </span>

            <Pagination className="mx-0 w-auto">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      if (table.getCanPreviousPage()) {
                        table.previousPage();
                      }
                    }}
                    className={
                      !table.getCanPreviousPage()
                        ? "pointer-events-none opacity-40 h-7 px-2"
                        : "h-7 px-2"
                    }
                  />
                </PaginationItem>

                {pageNumbers.map((pageNumber) => (
                  <PaginationItem key={pageNumber}>
                    <PaginationLink
                      href="#"
                      size="sm"
                      isActive={pageNumber === currentPage}
                      onClick={(e) => {
                        e.preventDefault();
                        table.setPageIndex(pageNumber - 1);
                      }}
                      className="size-7 text-xs"
                    >
                      {pageNumber}
                    </PaginationLink>
                  </PaginationItem>
                ))}

                {pageCount > 5 && currentPage < pageCount - 2 && (
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                )}

                <PaginationItem>
                  <PaginationNext
                    href="#"
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      if (table.getCanNextPage()) {
                        table.nextPage();
                      }
                    }}
                    className={
                      !table.getCanNextPage()
                        ? "pointer-events-none opacity-40 h-7 px-2"
                        : "h-7 px-2"
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataTable;
