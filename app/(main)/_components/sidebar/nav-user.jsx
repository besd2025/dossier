"use client";

import Link from "next/link";
import { CircleUser, EllipsisVertical, LogOut, Shield } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { getInitials } from "@/lib/utils";
import { useSessionStore } from "@/stores/session/session-store";
import { BESD_ROLES_CONFIG } from "@/config/permissions";

export function NavUser({ user }) {
  const { isMobile } = useSidebar();
  const sessionUser = useSessionStore((s) => s.user);
  const sessionRole = useSessionStore((s) => s.role);

  const roleConfig = BESD_ROLES_CONFIG[sessionRole];
  const displayName =
    sessionUser?.name ||
    (sessionUser?.prenom && sessionUser?.nom
      ? `${sessionUser.prenom} ${sessionUser.nom}`
      : roleConfig?.defaultUser?.name || "Alexandre Martin");

  const currentUser = user || {
    name: displayName,
    email: sessionUser?.email || roleConfig?.defaultUser?.email || "chef.bureau@besd.defense.gouv",
    role: roleConfig?.label || sessionRole,
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg bg-primary/10 text-primary">
                <AvatarFallback className="rounded-lg text-xs font-semibold">
                  {getInitials(currentUser.name)}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{currentUser.name}</span>
                <span className="text-muted-foreground truncate text-xs">
                  {currentUser.role || currentUser.email}
                </span>
              </div>
              <EllipsisVertical className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg bg-primary/10 text-primary">
                  <AvatarFallback className="rounded-lg text-xs font-semibold">
                    {getInitials(currentUser.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{currentUser.name}</span>
                  <span className="text-muted-foreground truncate text-xs">
                    {currentUser.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href="/profil" className="flex items-center gap-2">
                  <CircleUser className="size-4" />
                  <span>Mon profil</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/administration/roles" className="flex items-center gap-2">
                  <Shield className="size-4" />
                  <span>Mes droits</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/auth/login" className="flex items-center gap-2 text-destructive">
                <LogOut className="size-4" />
                <span>Déconnexion</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

