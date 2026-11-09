"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { sidebarItems } from "@/navigation/sidebar/sidebar-items";

const searchItems = sidebarItems.flatMap((group) =>
  group.items.flatMap((item) => {
    if (item.subItems) {
      return item.subItems.map((sub) => ({
        id: sub.id,
        group: item.title,
        label: sub.title,
        url: sub.url,
        icon: sub.icon || item.icon,
      }));
    }
    return [
      {
        id: item.id,
        group: group.label ?? "Général",
        label: item.title,
        url: item.url,
        icon: item.icon,
      },
    ];
  }),
);

function groupBy(items) {
  const groups = [...new Set(items.map((item) => item.group))];
  return groups.map((group) => ({
    group,
    items: items.filter((item) => item.group === group),
  }));
}

export function SearchDialog() {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const router = useRouter();

  React.useEffect(() => {
    const down = (e) => {
      if ((e.key === "k" || e.key === "j") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleOpenChange = (value) => {
    setOpen(value);
    if (!value) setQuery("");
  };

  const handleSelect = (item) => {
    handleOpenChange(false);
    router.push(item.url);
  };

  const filteredItems = query
    ? searchItems.filter(
        (item) =>
          item.label.toLowerCase().includes(query.toLowerCase()) ||
          item.group.toLowerCase().includes(query.toLowerCase()),
      )
    : searchItems;

  const grouped = groupBy(filteredItems);

  return (
    <>
      <Button
        onClick={() => handleOpenChange(true)}
        variant="outline"
        size="sm"
        className="text-muted-foreground font-normal h-8 text-xs gap-2 px-2.5 bg-background/50 hover:bg-muted"
      >
        <Search className="size-3.5" />
        <span className="hidden sm:inline">Rechercher...</span>
        <kbd className="bg-muted inline-flex h-4 items-center gap-0.5 rounded border px-1 text-[10px] font-medium text-muted-foreground select-none">
          <span className="text-[9px]">⌘</span>K
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={handleOpenChange}>
        <Command>
          <CommandInput
            placeholder="Rechercher une section, un écran..."
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            <CommandEmpty>Aucun résultat trouvé.</CommandEmpty>
            {grouped.map(({ group, items: groupItems }, index) => (
              <React.Fragment key={group}>
                {index > 0 && <CommandSeparator />}
                <CommandGroup heading={group}>
                  {groupItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <CommandItem
                        key={`${group}-${item.id}`}
                        value={`${item.group} ${item.label}`}
                        onSelect={() => handleSelect(item)}
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          {Icon && <Icon className="size-4" />}
                          <span className="truncate">{item.label}</span>
                        </span>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </React.Fragment>
            ))}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}

