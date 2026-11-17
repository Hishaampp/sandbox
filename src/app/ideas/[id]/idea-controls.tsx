"use client";

import { Check, UserPlus, X } from "lucide-react";
import { useActionState, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, Select, Textarea } from "@/components/ui/field";
import {
  applyToIdea,
  inviteBuilder,
  removeTeamMember,
  respondToRequest,
  saveIdeaPlan,
  updateIdeaStatus,
  withdrawRequest,
  type SimpleState,
} from "../actions";

/** The promise a builder makes before joining. Recorded with a time by the database. */
export const TEAM_TERMS = "I agree this idea belongs to its owner, and I won't share the full plan outside the team.";

function AgreeToTerms({ id }: { id: string }) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-start gap-2.5 py-1 text-body-sm text-ink-soft">
      <input id={id} name="agree" type="checkbox" required className="mt-1 size-4 shrink-0" />
      <span>{TEAM_TERMS}</span>
    </label>
  );
}

export function ApplyForm({ ideaId }: { ideaId: string }) {
  const [state, action, pending] = useActionState<SimpleState, FormData>(applyToIdea, {});
  return (
    <form action={action}>
      <input type="hidden" name="ideaId" value={ideaId} />
      <Field
        id="message"
        label="Message to the owner"
        optional
        hint="What you'd work on, and why this idea. Keep it short."
        error={state.error}
      >
        <Textarea id="message" name="message" rows={3} maxLength={600} error={state.error} />
      </Field>
      <AgreeToTerms id={`agree-${ideaId}`} />
      <Button type="submit" loading={pending} disabled={pending} className="mt-4 w-full">
        Ask to join
      </Button>
    </form>
  );
}

export function InviteButton({ ideaId, builderId, name }: { ideaId: string; builderId: string; name: string }) {
  const [state, action, pending] = useActionState<SimpleState, FormData>(inviteBuilder, {});
  return (
    <form action={action} className="flex flex-wrap items-center gap-3">
      <input type="hidden" name="ideaId" value={ideaId} />
      <input type="hidden" name="builderId" value={builderId} />
      <Button
        type="submit"
        size="sm"
        loading={pending}
        disabled={pending}
        icon={<UserPlus className="size-4" aria-hidden="true" />}
      >
        Invite to team<span className="sr-only">: {name}</span>
      </Button>
      {state.error && (
        <p role="alert" className="text-caption text-danger">
          {state.error}
        </p>
      )}
    </form>
  );
}

export function RespondButtons({
  requestId,
  label,
  needsAgreement = false,
}: {
  requestId: string;
  label: string;
  /** True when the viewer is the builder accepting an invite: they agree to the team terms first. */
  needsAgreement?: boolean;
}) {
  const [state, action, pending] = useActionState<SimpleState, FormData>(respondToRequest, {});
  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="requestId" value={requestId} />
      <input type="hidden" name="needsAgreement" value={needsAgreement ? "1" : "0"} />
      {needsAgreement && (
        <div className="w-full">
          <AgreeToTerms id={`agree-${requestId}`} />
        </div>
      )}
      <Button
        type="submit"
        name="decision"
        value="accept"
        size="sm"
        disabled={pending}
        icon={<Check className="size-4" aria-hidden="true" />}
      >
        Accept<span className="sr-only"> {label}</span>
      </Button>
      <Button
        type="submit"
        name="decision"
        value="decline"
        // Declining never needs the team agreement.
        formNoValidate
        variant="secondary"
        size="sm"
        disabled={pending}
        icon={<X className="size-4" aria-hidden="true" />}
      >
        Decline<span className="sr-only"> {label}</span>
      </Button>
      {state.error && (
        <p role="alert" className="text-caption text-danger">
          {state.error}
        </p>
      )}
    </form>
  );
}

export function WithdrawButton({ requestId }: { requestId: string }) {
  const [state, action, pending] = useActionState<SimpleState, FormData>(withdrawRequest, {});
  return (
    <form action={action} className="flex flex-wrap items-center gap-3">
      <input type="hidden" name="requestId" value={requestId} />
      <Button type="submit" variant="ghost" size="sm" loading={pending} disabled={pending}>
        Withdraw
      </Button>
      {state.error && (
        <p role="alert" className="text-caption text-danger">
          {state.error}
        </p>
      )}
    </form>
  );
}

export function StatusForm({ ideaId, current }: { ideaId: string; current: string }) {
  const [state, action, pending] = useActionState<SimpleState, FormData>(updateIdeaStatus, {});
  return (
    <form action={action} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="ideaId" value={ideaId} />
      <Field id="status" label="Status" error={state.error} className="min-w-44 flex-1">
        <Select
          id="status"
          name="status"
          defaultValue={current === "team_formed" ? "open" : current}
          error={state.error}
        >
          <option value="open">Open, taking builders</option>
          <option value="in_progress">In progress</option>
          <option value="completed">Completed</option>
        </Select>
      </Field>
      <Button type="submit" variant="secondary" loading={pending} disabled={pending} className="mb-6.5">
        Update
      </Button>
    </form>
  );
}

export function PlanForm({ ideaId, details }: { ideaId: string; details: string }) {
  const [state, action, pending] = useActionState<SimpleState, FormData>(saveIdeaPlan, {});
  return (
    <form action={action}>
      <input type="hidden" name="ideaId" value={ideaId} />
      <Field
        id="details"
        label="Edit the plan"
        hint={state.done ? "Saved. Your team can read it now." : "Only you and accepted teammates can read this."}
        error={state.error}
      >
        <Textarea id="details" name="details" rows={8} maxLength={10000} defaultValue={details} error={state.error} />
      </Field>
      <Button type="submit" variant="secondary" loading={pending} disabled={pending}>
        Save plan
      </Button>
    </form>
  );
}

export function PostedNotice() {
  return (
    <Alert title="Your idea is posted" className="mt-8">
      Builders ranked by their proven skills are listed below. Invite the ones who fit.
    </Alert>
  );
}

/** Remove a builder (owner) or leave the team (builder), with a confirm step. */
export function RemoveMemberButton({
  ideaId,
  profileId,
  self,
  name,
}: {
  ideaId: string;
  profileId: string;
  self: boolean;
  name: string;
}) {
  const [state, action, pending] = useActionState<SimpleState, FormData>(removeTeamMember, {});
  const [confirming, setConfirming] = useState(false);
  const label = self ? "Leave team" : "Remove";
  if (!confirming) {
    return (
      <Button variant="ghost" size="sm" onClick={() => setConfirming(true)}>
        {label}
        {!self && <span className="sr-only"> {name} from the team</span>}
      </Button>
    );
  }
  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="ideaId" value={ideaId} />
      <input type="hidden" name="profileId" value={profileId} />
      <Button type="submit" variant="secondary" size="sm" loading={pending} disabled={pending}>
        {self ? "Yes, leave" : `Yes, remove ${name.split(" ")[0]}`}
      </Button>
      <Button variant="ghost" size="sm" onClick={() => setConfirming(false)} disabled={pending}>
        Cancel
      </Button>
      {state.error && (
        <p role="alert" className="w-full text-caption text-danger">
          {state.error}
        </p>
      )}
    </form>
  );
}
