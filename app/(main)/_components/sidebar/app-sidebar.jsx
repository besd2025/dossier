"use client";

import * as React from "react";
import Link from "next/link";
import { useShallow } from "zustand/react/shallow";

import { AppLogo } from "@/components/app-logo";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { APP_CONFIG } from "@/config/app-config";
import { filterSidebarByRole } from "@/config/permissions";
import { sidebarItems } from "@/navigation/sidebar/sidebar-items";
import { usePreferencesStore } from "@/stores/preferences/preferences-provider";
import { useSessionStore } from "@/stores/session/session-store";

import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";

export function AppSidebar({ ...props }) {
  const currentRole = useSessionStore((s) => s.role);

  const { sidebarVariant, sidebarCollapsible, isSynced } = usePreferencesStore(
    useShallow((s) => ({
      sidebarVariant: s.values.sidebar_variant,
      sidebarCollapsible: s.values.sidebar_collapsible,
      isSynced: s.isSynced,
    })),
  );

  const variant = isSynced ? sidebarVariant : props.variant;
  const collapsible = isSynced ? sidebarCollapsible : props.collapsible;

  // Filtrage réactif de la barre latérale selon le rôle actif (Section 2)
  const filteredNavItems = React.useMemo(() => {
    return filterSidebarByRole(sidebarItems, currentRole);
  }, [currentRole]);

  return (
    <Sidebar {...props} variant={variant} collapsible={collapsible}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link prefetch={false} href="/dashboard">
                <AppLogo className="size-8 rounded-lg" />
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-bold text-sm tracking-wide">{APP_CONFIG.name}</span>
                  <span className="text-muted-foreground text-xs truncate max-w-[160px]">
                    Gestion des dossiers
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={filteredNavItems} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}

