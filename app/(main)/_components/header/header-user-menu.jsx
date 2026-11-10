"use client";

import { useRouter } from "next/navigation";
import { CircleUser, LogOut, User } from "lucide-react";

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
          <AvatarFallback className="text-xs font-semibold">
            {getInitials(fullName)}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 p-2">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex flex-col gap-y-2">
            <span className="block  text-lg font-medium text-card-foreground">
              {fullName}
            </span>
            <div className="relative pl-2">
              <span className="mt-1  text-sm text-primary flex items-center gap-1">
                <User size={16} /> {BESD_ROLES_CONFIG[role]?.label || role}
              </span>
              <span className="mt-1 block truncate text-xs text-muted-foreground">
                {user.email}
              </span>
              <div className="h-full border absolute top-0 left-0 border-primary"></div>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => router.push("/profil")}
          className="text-card-foreground py-2"
        >
          <CircleUser aria-hidden="true" />
          Profil
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={logoutAndRedirect}
          className="text-destructive focus:text-destructive py-2"
        >
          <LogOut aria-hidden="true" />
          Déconnexion
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
