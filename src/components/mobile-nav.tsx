"use client";

import { MenuIcon } from "lucide-react";
import { useState } from "react";
import { NavLinks } from "@/components/nav-links";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { NavItem } from "@/lib/nav";

export function MobileNav({ items }: { items: NavItem[] }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="size-11 md:hidden" aria-label="Open menu">
          <MenuIcon aria-hidden />
        </Button>
      </SheetTrigger>
      <SheetContent side="left">
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>
        <nav aria-label="Main" className="flex flex-col gap-1 px-4">
          <NavLinks items={items} onNavigate={() => setIsOpen(false)} />
        </nav>
      </SheetContent>
    </Sheet>
  );
}
