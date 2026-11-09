"use client";

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

function getPageNumbers(currentPage, pageCount) {
  if (pageCount <= 5) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }
  if (currentPage <= 3) return [1, 2, 3, 4, 5];
  if (currentPage >= pageCount - 2) {
    return [pageCount - 4, pageCount - 3, pageCount - 2, pageCount - 1, pageCount];
  }
  return [currentPage - 2, currentPage - 1, currentPage, currentPage + 1, currentPage + 2];
}

/**
 * Composant de tableau de données réutilisable basé sur TanStack Table v9.
 *
 * @param {Object} props
 * @param {import("@tanstack/react-table").ReactTable} props.table - Instance de la table TanStack
 * @param {string} [props.emptyMessage="Aucun résultat trouvé."] - Message en cas de table vide
 * @param {boolean} [props.showSelectionCount=true] - Affiche le nombre de lignes sélectionnées
 */
export function DataTable({
  table,
  emptyMessage = "Aucun résultat trouvé.",
  showSelectionCount = true,
}) {
  const pageCount = Math.max(table.getPageCount(), 1);
  const currentPage = Math.min(table.state.pagination.pageIndex + 1, pageCount);
  const pageNumbers = getPageNumbers(currentPage, pageCount);
  const rowsPerPage = `${table.state.pagination.pageSize}`;

  const selectedCount = table.getFilteredSelectedRowModel?.()?.rows?.length ?? 0;
  const totalCount = table.getFilteredRowModel?.()?.rows?.length ?? 0;

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="rounded-md border bg-card overflow-hidden">
        <Table className="**:data-[slot='table-cell']:px-4 **:data-[slot='table-head']:px-4">
          <TableHeader className="bg-muted/40">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="py-3 font-semibold text-xs text-muted-foreground">
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
                  className="hover:bg-muted/30 transition-colors"
                  data-state={table.state.rowSelection?.[row.id] && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="px-4 py-3 align-middle text-sm">
                      <table.FlexRender cell={cell} />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={table.getVisibleLeafColumns().length}
                  className="h-32 text-center text-muted-foreground text-sm"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Separator />

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2">
        <div className="text-muted-foreground flex items-center gap-4 text-xs">
          {showSelectionCount && selectedCount > 0 && (
            <span>
              {selectedCount} sur {totalCount} ligne(s) sélectionnée(s)
            </span>
          )}

          <div className="flex items-center gap-2">
            <span>Lignes par page</span>
            <Select
              value={rowsPerPage}
              onValueChange={(value) => table.setPageSize(Number(value))}
            >
              <SelectTrigger size="sm" className="w-18 h-8 text-xs">
                <SelectValue placeholder={rowsPerPage} />
              </SelectTrigger>
              <SelectContent side="top">
                <SelectGroup>
                  {[10, 20, 30, 50, 100].map((pageSize) => (
                    <SelectItem key={pageSize} value={`${pageSize}`}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground mr-2">
            Page {currentPage} sur {pageCount}
          </span>

          <Pagination className="mx-0 w-auto">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (table.getCanPreviousPage()) {
                      table.previousPage();
                    }
                  }}
                  className={!table.getCanPreviousPage() ? "pointer-events-none opacity-50" : ""}
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
                  onClick={(e) => {
                    e.preventDefault();
                    if (table.getCanNextPage()) {
                      table.nextPage();
                    }
                  }}
                  className={!table.getCanNextPage() ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </div>
  );
}

