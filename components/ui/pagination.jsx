import * as React from "react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { ChevronLeftIcon, ChevronRightIcon, MoreHorizontalIcon } from "lucide-react";

function Pagination({ className, ...props }) {
  return (
    <nav
      role="navigation"
      aria-label="pagination"
      data-slot="pagination"
      className={cn("mx-auto flex w-full justify-center", className)}
      {...props}
    />
  );
}

function PaginationContent({ className, ...props }) {
  return (
    <ul
      data-slot="pagination-content"
      className={cn("flex items-center gap-0.5", className)}
      {...props}
    />
  );
}

function PaginationItem({ ...props }) {
  return <li data-slot="pagination-item" {...props} />;
}

function PaginationLink({
  className,
  isActive,
  size = "icon",
  children,
  ...props
}) {
  return (
    <Button
      variant={isActive ? "outline" : "ghost"}
      size={size}
      className={cn(className)}
      asChild
    >
      <a
        aria-current={isActive ? "page" : undefined}
        data-slot="pagination-link"
        data-active={isActive}
        {...props}
      >
        {children}
      </a>
    </Button>
  );
}

function PaginationPrevious({
  className,
  text = "Précédent",
  ...props
}) {
  return (
    <PaginationLink
      aria-label="Aller à la page précédente"
      size="default"
      className={cn("pl-1.5", className)}
      {...props}
    >
      <ChevronLeftIcon className="size-4 mr-1" />
      <span className="hidden sm:inline">{text}</span>
    </PaginationLink>
  );
}

function PaginationNext({
  className,
  text = "Suivant",
  ...props
}) {
  return (
    <PaginationLink
      aria-label="Aller à la page suivante"
      size="default"
      className={cn("pr-1.5", className)}
      {...props}
    >
      <span className="hidden sm:inline">{text}</span>
      <ChevronRightIcon className="size-4 ml-1" />
    </PaginationLink>
  );
}

function PaginationEllipsis({ className, ...props }) {
  return (
    <span
      aria-hidden
      data-slot="pagination-ellipsis"
      className={cn(
        "flex size-8 items-center justify-center text-muted-foreground",
        className
      )}
      {...props}
    >
      <MoreHorizontalIcon className="size-4" />
      <span className="sr-only">Plus de pages</span>
    </span>
  );
}

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
};

