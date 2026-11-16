"use client";

import { startTransition, useActionState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { ImageInput } from "@/components/ui/image-input";
import { submitVerification } from "./actions";
import { MAX_ID_PHOTO_BYTES, type VerificationFormState } from "./schema";

type College = { id: string; name: string };

export function VerifyForm({
  colleges,
  defaults,
}: {
  colleges: College[];
  defaults: { fullName: string; department: string; year: number | null };
}) {
  const [state, formAction, pending] = useActionState<VerificationFormState, FormData>(submitVerification, {});
  const e = state.errors ?? {};

  return (
    <form
      noValidate
      // Before JavaScript loads, the form posts to the server action (never a GET that would put
      // the registration number in the URL). Once loaded, onSubmit takes over and skips React's
      // automatic form reset, so typed values and the chosen photo survive a validation error.
      action={formAction}
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        startTransition(() => formAction(data));
      }}
      className="mt-8"
    >
      {state.formError && (
        <Alert tone="danger" title="Not sent yet" className="mb-6">
          {state.formError}
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
        <Field id="collegeId" label="College" error={e.collegeId} className="sm:col-span-2">
          <Select
            id="collegeId"
            name="collegeId"
            error={e.collegeId}
            defaultValue={colleges.length === 1 ? colleges[0].id : ""}
            required
          >
            {colleges.length !== 1 && <option value="">Choose your college</option>}
            {colleges.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field
          id="fullName"
          label="Full name"
          hint="Exactly as it appears on your ID card."
          error={e.fullName}
          className="sm:col-span-2"
        >
          <Input
            id="fullName"
            name="fullName"
            error={e.fullName}
            defaultValue={defaults.fullName}
            autoComplete="name"
            required
          />
        </Field>

        <Field id="department" label="Department" error={e.department}>
          <Input
            id="department"
            name="department"
            error={e.department}
            defaultValue={defaults.department}
            placeholder="Computer Science"
            required
          />
        </Field>

        <Field id="year" label="Year of study" error={e.year}>
          <Select id="year" name="year" error={e.year} defaultValue={defaults.year ?? ""} required>
            <option value="">Choose a year</option>
            {[1, 2, 3, 4, 5, 6].map((y) => (
              <option key={y} value={y}>
                Year {y}
              </option>
            ))}
          </Select>
        </Field>

        <Field
          id="regNo"
          label="Registration number"
          hint="Never shown to other students. Used to keep one account per student."
          error={e.regNo}
        >
          <Input
            id="regNo"
            name="regNo"
            error={e.regNo}
            inputMode="text"
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            className="tabular-nums"
            required
          />
        </Field>

        <Field
          id="cardValidUntil"
          label="Card valid until"
          optional
          hint="From your ID card. Your verification ends on this date."
          error={e.cardValidUntil}
        >
          <Input id="cardValidUntil" name="cardValidUntil" type="date" error={e.cardValidUntil} />
        </Field>

        <div className="sm:col-span-2">
          <ImageInput id="idCard" name="idCard" label="ID card photo" maxBytes={MAX_ID_PHOTO_BYTES} error={e.idCard} errorToken={state} required />
        </div>
      </div>

      <div className="mt-4 border-t border-line pt-6">
        <Button type="submit" size="lg" loading={pending} disabled={pending} className="w-full">
          {pending ? "Sending…" : "Submit for review"}
        </Button>
        <p className="mt-3 text-caption text-muted">
          A coordinator compares the photo with your details. The photo is deleted as soon as they decide.
        </p>
      </div>
    </form>
  );
}
