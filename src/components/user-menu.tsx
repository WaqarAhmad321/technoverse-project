"use client";

import Link from "next/link";
import { useTransition } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut } from "@/features/auth/actions";

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
}

export function UserMenu({ name, email }: { name: string; email: string }) {
  const [isSigningOut, startSignOut] = useTransition();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-11 gap-2 px-2 text-base" aria-label="Account menu">
          <Avatar className="size-8">
            <AvatarFallback>{initialsOf(name)}</AvatarFallback>
          </Avatar>
          <span className="hidden max-w-40 truncate sm:inline">{name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="flex flex-col gap-1">
          <span className="truncate text-base font-medium text-foreground">{name}</span>
          <span className="truncate font-normal">{email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="min-h-11 text-base">
          <Link href="/account">Your account</Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          className="min-h-11 text-base"
          disabled={isSigningOut}
          onSelect={() => startSignOut(() => signOut())}
        >
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
