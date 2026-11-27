"use client";

import { Copy } from "lucide-react";
import { useActionState } from "react";
import { toast } from "sonner";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { ThemedSelect } from "@/components/themed-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isActionError, useActionToast } from "@/components/use-action-toast";
import { decideJoinRequest, invitePerson, revokeInvitation } from "./invite-actions";
import type { JoinRequestRow, PendingInvitation } from "./data";
import { ROLE_CHOICES, ROLE_LABELS } from "./roles";

export function InviteForm() {
  const [state, formAction] = useActionState(invitePerson, null);
  useActionToast(state);

  return (
    <form action={formAction} className="flex flex-col gap-4 rounded-3xl bg-card p-4 md:p-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-medium">Invite someone</h2>
        <p className="text-base text-muted-foreground">They get the role as soon as they sign in or sign up with this email.</p>
      </div>
      <div className="flex flex-col gap-4 md:flex-row md:items-end">
        <div className="flex flex-1 flex-col gap-1.5">
          <Label htmlFor="invite-email">Email</Label>
          <Input id="invite-email" name="email" type="email" autoComplete="off" required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="invite-role">Role</Label>
          <ThemedSelect id="invite-role" name="role" defaultValue="examiner" className="min-w-56">
            {ROLE_CHOICES.map((choice) => (
              <option key={choice.role} value={choice.role}>
                {choice.label}
              </option>
            ))}
          </ThemedSelect>
        </div>
        <SubmitButton size="lg">Invite someone</SubmitButton>
      </div>
      <ul className="grid gap-1 text-sm text-muted-foreground md:grid-cols-2">
        {ROLE_CHOICES.map((choice) => (
          <li key={choice.role}>
            <span className="font-medium text-foreground">{choice.label}.</span> {choice.description}
          </li>
        ))}
      </ul>
      {isActionError(state) && <FormMessage tone="error">{state.message}</FormMessage>}
    </form>
  );
}

function InvitationRow({ invitation }: { invitation: PendingInvitation }) {
  const [state, formAction] = useActionState(revokeInvitation, null);
  useActionToast(state);

  async function copyLink() {
    const link = `${window.location.origin}/sign-up?email=${encodeURIComponent(invitation.email)}`;
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Sign-in link copied.");
    } catch {
      toast.error("Could not copy. Select the address and copy it by hand.");
    }
  }

  return (
    <li className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
      <span className="flex min-w-0 flex-col">
        <span className="truncate text-base font-medium">{invitation.email}</span>
        <span className="text-sm text-muted-foreground">{ROLE_LABELS[invitation.role] ?? invitation.role}</span>
      </span>
      <form action={formAction} className="flex gap-2">
        <input type="hidden" name="invitationId" value={invitation.id} />
        <Button type="button" variant="outline" size="lg" onClick={() => void copyLink()}>
          <Copy aria-hidden /> Copy sign-in link
        </Button>
        <SubmitButton size="lg" variant="outline">
          Revoke
        </SubmitButton>
      </form>
    </li>
  );
}

export function PendingInvitations({ invitations }: { invitations: PendingInvitation[] }) {
  if (invitations.length === 0) return null;
  return (
    <section aria-labelledby="pending-invitations" className="flex flex-col gap-2 rounded-3xl bg-card p-4 md:p-6">
      <h2 id="pending-invitations" className="text-xl font-medium">
        Pending invitations
      </h2>
      <ul className="divide-y divide-border">
        {invitations.map((invitation) => (
          <InvitationRow key={invitation.id} invitation={invitation} />
        ))}
      </ul>
    </section>
  );
}

function RequestRow({ request }: { request: JoinRequestRow }) {
  const [state, formAction] = useActionState(decideJoinRequest, null);
  useActionToast(state);

  return (
    <li className="py-3">
      <form action={formAction} className="flex flex-col gap-3">
        <input type="hidden" name="requestId" value={request.id} />
        <span className="flex flex-col">
          <span className="text-base font-medium">
            {request.name} <span className="font-normal text-muted-foreground">({request.email})</span>
          </span>
          <span className="text-sm text-muted-foreground">Asking to be {ROLE_LABELS[request.role] ?? request.role}</span>
          {request.note && <span className="text-base">{request.note}</span>}
        </span>
        <div className="flex flex-col gap-2 md:flex-row md:items-end">
          <div className="flex flex-1 flex-col gap-1.5">
            <Label htmlFor={`note-${request.id}`}>Note (needed to decline)</Label>
            <Input id={`note-${request.id}`} name="note" maxLength={300} autoComplete="off" />
          </div>
          <Button type="submit" name="decision" value="approve" size="lg">
            Approve request
          </Button>
          <Button type="submit" name="decision" value="decline" size="lg" variant="outline">
            Decline request
          </Button>
        </div>
        {isActionError(state) && <FormMessage tone="error">{state.message}</FormMessage>}
      </form>
    </li>
  );
}

export function JoinRequests({ requests }: { requests: JoinRequestRow[] }) {
  if (requests.length === 0) return null;
  return (
    <section aria-labelledby="join-requests" className="flex flex-col gap-2 rounded-3xl bg-card p-4 md:p-6">
      <h2 id="join-requests" className="text-xl font-medium">
        Requests to join
      </h2>
      <ul className="divide-y divide-border">
        {requests.map((request) => (
          <RequestRow key={request.id} request={request} />
        ))}
      </ul>
    </section>
  );
}
