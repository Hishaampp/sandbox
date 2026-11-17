"use client";

import { Ban, Flag } from "lucide-react";
import { useActionState, useId, useState } from "react";
import { closeReport, sendReport, toggleBlock, type SafetyState } from "@/app/safety/actions";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, Textarea } from "@/components/ui/field";

/** Report a student or an idea to the coordinator. Opens in place; the reported person never sees it. */
export function ReportForm({ kind, targetId, label }: { kind: "profile" | "idea"; targetId: string; label: string }) {
  const [state, action, pending] = useActionState<SafetyState, FormData>(sendReport, {});
  const [open, setOpen] = useState(false);
  const id = useId();

  if (state.done) {
    return (
      <Alert title="Report sent">
        The coordinator will review it. The person you reported isn&rsquo;t told who sent it.
      </Alert>
    );
  }
  if (!open) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        icon={<Flag className="size-4" aria-hidden="true" />}
      >
        {label}
      </Button>
    );
  }
  return (
    <form action={action} className="w-full">
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="targetId" value={targetId} />
      <Field id={id} label="What's wrong?" hint="Only the coordinator reads this." error={state.error}>
        <Textarea
          id={id}
          name="reason"
          rows={3}
          maxLength={600}
          error={state.error}
          placeholder={kind === "idea" ? "Copied from another student's idea" : "Not a real student"}
        />
      </Field>
      <div className="flex gap-2">
        <Button type="submit" size="sm" variant="secondary" loading={pending} disabled={pending}>
          Send report
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)} disabled={pending}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

/** Block or unblock, with a confirm step for blocking. */
export function BlockButton({ profileId, blocked, name }: { profileId: string; blocked: boolean; name: string }) {
  const [state, action, pending] = useActionState<SafetyState, FormData>(toggleBlock, {});
  const [confirming, setConfirming] = useState(false);

  if (!blocked && !confirming) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setConfirming(true)}
        icon={<Ban className="size-4" aria-hidden="true" />}
      >
        Block
      </Button>
    );
  }
  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="profileId" value={profileId} />
      <input type="hidden" name="action" value={blocked ? "unblock" : "block"} />
      {!blocked && (
        <p className="w-full text-caption text-muted">
          {name.split(" ")[0]} won&rsquo;t be able to invite you or ask to join your ideas, and you won&rsquo;t see each
          other in matches.
        </p>
      )}
      <Button type="submit" size="sm" variant="secondary" loading={pending} disabled={pending}>
        {blocked ? "Unblock" : `Yes, block ${name.split(" ")[0]}`}
      </Button>
      {!blocked && (
        <Button size="sm" variant="ghost" onClick={() => setConfirming(false)} disabled={pending}>
          Cancel
        </Button>
      )}
      {state.error && (
        <p role="alert" className="w-full text-caption text-danger">
          {state.error}
        </p>
      )}
    </form>
  );
}

/** Admin: resolve or dismiss a report. */
export function CloseReportButtons({ reportId }: { reportId: string }) {
  const [state, action, pending] = useActionState<SafetyState, FormData>(closeReport, {});
  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="reportId" value={reportId} />
      <Button type="submit" name="status" value="resolved" size="sm" disabled={pending}>
        Resolve
      </Button>
      <Button type="submit" name="status" value="dismissed" variant="secondary" size="sm" disabled={pending}>
        Dismiss
      </Button>
      {state.error && (
        <p role="alert" className="w-full text-caption text-danger">
          {state.error}
        </p>
      )}
    </form>
  );
}
