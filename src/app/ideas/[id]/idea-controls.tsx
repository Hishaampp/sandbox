"use client";

import { Check, UserPlus, X } from "lucide-react";
import { useActionState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, Select, Textarea } from "@/components/ui/field";
import {
  applyToIdea,
  inviteBuilder,
  respondToRequest,
  saveIdeaPlan,
  updateIdeaStatus,
  withdrawRequest,
  type SimpleState,
} from "../actions";

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
      <Button type="submit" loading={pending} disabled={pending} className="w-full">
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

export function RespondButtons({ requestId, label }: { requestId: string; label: string }) {
  const [state, action, pending] = useActionState<SimpleState, FormData>(respondToRequest, {});
  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="requestId" value={requestId} />
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
        <Select id="status" name="status" defaultValue={current === "team_formed" ? "open" : current} error={state.error}>
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
