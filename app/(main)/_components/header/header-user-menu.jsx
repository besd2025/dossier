"use client";

import { useRouter } from "next/navigation";
import { CircleUser, LogOut } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { BESD_ROLES_CONFIG } from "@/config/permissions";
import { getInitials } from "@/lib/utils";
import { useSessionStore } from "@/stores/session/session-store";

export function HeaderUserMenu() {
  const router = useRouter();
  const user = useSessionStore((state) => state.user);
  const role = useSessionStore((state) => state.role);
  const isAuthenticated = useSessionStore((state) => state.isAuthenticated);
  const logout = useSessionStore((state) => state.logout);

  if (!isAuthenticated || !user) return null;

  const fullName = [user.prenom, user.nom].filter(Boolean).join(" ");
  const logoutAndRedirect = () => {
    logout();
    router.replace("/auth/login");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        nativeButton
        aria-label={`Menu utilisateur : ${fullName}`}
        className="flex size-8 items-center justify-center rounded-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Avatar className="bg-primary/10 text-primary">
          <AvatarFallback className="text-xs font-semibold">{getInitials(fullName)}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="font-normal">
            <span className="block truncate text-sm font-medium">{fullName}</span>
            <span className="mt-1 block truncate text-xs text-muted-foreground">{user.email}</span>
            <span className="mt-1 block text-xs text-muted-foreground">{BESD_ROLES_CONFIG[role]?.label || role}</span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/profil")}>
          <CircleUser aria-hidden="true" />
          Profil
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logoutAndRedirect} className="text-destructive focus:text-destructive">
          <LogOut aria-hidden="true" />
          Déconnexion
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
