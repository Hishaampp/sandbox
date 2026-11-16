"use client";

import { Check, X } from "lucide-react";
import { useActionState, useId, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Field, Textarea } from "@/components/ui/field";
import { reviewVerification, type ReviewState } from "./actions";

export type QueueItem = {
  id: string;
  fullName: string;
  department: string;
  yearLabel: string;
  regNo: string;
  collegeName: string;
  submittedLabel: string;
  cardValidUntilLabel: string | null;
  avatarUrl: string | null;
  photoUrl: string | null;
};

export function ReviewRow({ item }: { item: QueueItem }) {
  const [state, action, pending] = useActionState<ReviewState, FormData>(reviewVerification, {});
  const [rejecting, setRejecting] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const reasonId = useId();

  return (
    <li className="grid grid-cols-1 gap-8 p-6 md:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:gap-12">
      <div className="min-w-0">
        <div className="flex items-start gap-3">
          <Avatar name={item.fullName} src={item.avatarUrl} />
          <div className="min-w-0">
            <h3 className="truncate font-medium text-ink">{item.fullName}</h3>
            <p className="text-body-sm text-muted">
              {item.department}, {item.yearLabel}
            </p>
          </div>
        </div>

        <dl className="mt-5 grid grid-cols-1 gap-x-8 gap-y-4 text-body-sm sm:grid-cols-2 xl:grid-cols-4">
          <div>
            <dt className="text-caption text-muted">Registration number</dt>
            <dd className="font-medium text-ink tabular-nums">{item.regNo}</dd>
          </div>
          <div>
            <dt className="text-caption text-muted">College</dt>
            <dd className="text-ink">{item.collegeName}</dd>
          </div>
          <div>
            <dt className="text-caption text-muted">Submitted</dt>
            <dd className="text-ink">{item.submittedLabel}</dd>
          </div>
          <div>
            <dt className="text-caption text-muted">Card valid until</dt>
            <dd className="text-ink">{item.cardValidUntilLabel ?? "Not given"}</dd>
          </div>
        </dl>

        {state.error && (
          <Alert tone="danger" className="mt-5">
            {state.error}
          </Alert>
        )}

        {rejecting ? (
          <form action={action} className="mt-5">
            <input type="hidden" name="id" value={item.id} />
            <input type="hidden" name="decision" value="rejected" />
            <Field id={reasonId} label="Reason for rejecting" hint="The student sees this, so say what to fix.">
              <Textarea
                id={reasonId}
                name="reason"
                required
                minLength={3}
                maxLength={300}
                placeholder="The photo is blurry, so the registration number can't be read."
                autoFocus
              />
            </Field>
            <div className="mt-2 flex flex-wrap gap-2">
              <Button type="submit" variant="primary" loading={pending} disabled={pending}>
                Reject with this reason
              </Button>
              <Button type="button" variant="ghost" onClick={() => setRejecting(false)} disabled={pending}>
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <div className="mt-6 flex flex-wrap gap-2">
            <form action={action}>
              <input type="hidden" name="id" value={item.id} />
              <input type="hidden" name="decision" value="approved" />
              <Button
                type="submit"
                loading={pending}
                disabled={pending}
                icon={<Check className="size-4" aria-hidden="true" />}
              >
                Approve
              </Button>
            </form>
            <Button
              variant="secondary"
              onClick={() => setRejecting(true)}
              disabled={pending}
              icon={<X className="size-4" aria-hidden="true" />}
            >
              Reject
            </Button>
          </div>
        )}
      </div>

      <div>
        <p className="mb-1.5 text-caption text-muted">ID card photo</p>
        {item.photoUrl ? (
          <button
            type="button"
            onClick={() => setZoomed((z) => !z)}
            aria-expanded={zoomed}
            aria-label={zoomed ? "Show smaller photo" : "Enlarge ID card photo"}
            className="block w-full overflow-hidden rounded-control border border-line bg-sunken"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- short-lived signed URL from private storage */}
            <img
              src={item.photoUrl}
              alt={`ID card submitted by ${item.fullName}`}
              className={zoomed ? "w-full object-contain" : "aspect-3/2 w-full object-cover"}
            />
          </button>
        ) : (
          <div className="flex aspect-3/2 items-center justify-center rounded-control border border-dashed border-line-strong px-4 text-center text-caption text-muted">
            Photo unavailable. Reject and ask the student to upload again.
          </div>
        )}
      </div>
    </li>
  );
}
