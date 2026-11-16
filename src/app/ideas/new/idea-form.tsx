"use client";

import { startTransition, useActionState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { SkillTagInput } from "@/components/ui/skill-tag-input";
import { createIdea, type IdeaFormState } from "../actions";

export function IdeaForm({ suggestions }: { suggestions: string[] }) {
  const [state, formAction, pending] = useActionState<IdeaFormState, FormData>(createIdea, {});
  const e = state.errors ?? {};

  return (
    <form
      noValidate
      action={formAction}
      // Submit without React's automatic reset, so a validation error keeps what was typed.
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        startTransition(() => formAction(data));
      }}
      className="mt-8"
    >
      {state.formError && (
        <Alert tone="danger" title="Not posted yet" className="mb-6">
          {state.formError}
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
        <Field id="title" label="Title" error={e.title} className="sm:col-span-2">
          <Input id="title" name="title" error={e.title} maxLength={90} placeholder="Lab slot alerts" required />
        </Field>

        <Field
          id="summary"
          label="Short summary"
          hint="Public. What it is and who it helps, in a few lines."
          error={e.summary}
          className="sm:col-span-2"
        >
          <Textarea id="summary" name="summary" error={e.summary} maxLength={400} rows={3} required />
        </Field>

        <Field
          id="skills"
          label="Skills needed"
          hint="Up to 8. Builders are matched on these, so use the names people use (React, Python, UI design)."
          error={e.skills}
          className="sm:col-span-2"
        >
          <SkillTagInput id="skills" name="skills" suggestions={suggestions} error={e.skills} />
        </Field>

        <Field id="teamSize" label="Builders needed" error={e.teamSize}>
          <Select id="teamSize" name="teamSize" error={e.teamSize} defaultValue="2">
            {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n} {n === 1 ? "builder" : "builders"}
              </option>
            ))}
          </Select>
        </Field>

        <Field id="hours" label="Hours per week" error={e.hours}>
          <Select id="hours" name="hours" error={e.hours} defaultValue="6">
            {[2, 4, 6, 8, 10, 15, 20, 30, 40].map((n) => (
              <option key={n} value={n}>
                About {n} hours
              </option>
            ))}
          </Select>
        </Field>

        <Field
          id="reward"
          label="What builders get"
          optional
          hint="Credit, a certificate, a stipend or equity. Be specific; it's public."
          error={e.reward}
          className="sm:col-span-2"
        >
          <Input id="reward" name="reward" error={e.reward} maxLength={120} placeholder="Credit on the project and a certificate" />
        </Field>

        <Field
          id="details"
          label="Full plan"
          optional
          hint="Only accepted teammates can read this. You can add it later."
          error={e.details}
          className="sm:col-span-2"
        >
          <Textarea id="details" name="details" error={e.details} rows={6} maxLength={10000} />
        </Field>
      </div>

      <div className="mt-4 border-t border-line pt-6">
        <Button type="submit" size="lg" loading={pending} disabled={pending} className="w-full">
          {pending ? "Posting…" : "Post idea"}
        </Button>
      </div>
    </form>
  );
}
