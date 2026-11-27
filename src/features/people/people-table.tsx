"use client";

import { Search } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { saveRoles } from "./actions";
import { ROLE_CHOICES, ROLE_LABELS } from "./roles";

export type PersonRow = { id: string; name: string; email: string; roles: string[]; joined: string };

function RolesDialog({ person, isSelf, onClose }: { person: PersonRow; isSelf: boolean; onClose: () => void }) {
  const [state, formAction] = useActionState(saveRoles, null);

  useEffect(() => {
    if (state?.status !== "saved") return;
    toast.success(`${person.name}: ${state.message}`);
    onClose();
  }, [onClose, person.name, state]);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Roles for {person.name}</DialogTitle>
          <DialogDescription>{person.email}</DialogDescription>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="personId" value={person.id} />
          <fieldset className="flex flex-col gap-2">
            <legend className="sr-only">Roles</legend>
            {ROLE_CHOICES.map((choice) => (
              <label
                key={choice.role}
                className="flex min-h-14 cursor-pointer items-start gap-3 rounded-xl bg-muted px-4 py-3 hover:bg-accent has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring"
              >
                <input
                  type="checkbox"
                  name="roles"
                  value={choice.role}
                  defaultChecked={person.roles.includes(choice.role)}
                  className="mt-1 size-5 accent-primary"
                />
                <span className="flex flex-col">
                  <span className="text-base font-medium">{choice.label}</span>
                  <span className="text-sm text-muted-foreground">
                    {choice.description}
                    {isSelf && choice.role === "institution_admin" ? " You can't remove this from yourself." : ""}
                  </span>
                </span>
              </label>
            ))}
          </fieldset>
          {state?.status === "error" && <FormMessage tone="error">{state.message}</FormMessage>}
          <DialogFooter>
            <Button type="button" variant="outline" size="lg" onClick={onClose}>
              Cancel
            </Button>
            <SubmitButton size="lg">Save roles</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function PeopleTable({ people, selfId }: { people: PersonRow[]; selfId: string }) {
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<PersonRow | null>(null);
  const needle = query.trim().toLowerCase();
  const shown = needle
    ? people.filter((person) => person.name.toLowerCase().includes(needle) || person.email.includes(needle))
    : people;

  return (
    <div className="flex flex-col gap-4">
      <div className="relative max-w-sm">
        <Search aria-hidden className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          aria-label="Search people by name or email"
          placeholder="Search by name or email"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="rounded-full pl-11"
        />
      </div>
      {shown.length === 0 ? (
        <p className="text-base text-muted-foreground">Nobody matches “{query}”.</p>
      ) : (
        <div className="overflow-x-auto rounded-3xl bg-card p-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="hidden md:table-cell">Email</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead className="hidden sm:table-cell">Joined</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shown.map((person) => (
                <TableRow key={person.id}>
                  <TableCell className="font-medium">{person.name}</TableCell>
                  <TableCell className="hidden md:table-cell">{person.email}</TableCell>
                  <TableCell>{person.roles.map((role) => ROLE_LABELS[role] ?? role).join(", ")}</TableCell>
                  <TableCell className="hidden sm:table-cell">{person.joined}</TableCell>
                  <TableCell className="text-right">
                    <Button type="button" variant="ghost" onClick={() => setEditing(person)} aria-label={`Change roles for ${person.name}`}>
                      Change roles
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      {editing && <RolesDialog key={editing.id} person={editing} isSelf={editing.id === selfId} onClose={() => setEditing(null)} />}
    </div>
  );
}
