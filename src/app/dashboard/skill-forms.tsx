"use client";

import { Check } from "lucide-react";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { addSkill, savePortfolio, type FormState } from "./actions";

export function AddSkillForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(addSkill, {});
  return (
    <form action={action}>
      <Field id="skill" label="Add a skill by hand" hint="Labelled self-added and counted less than skills from code." error={state.error}>
        <div className="flex gap-2">
          <Input id="skill" name="skill" error={state.error} placeholder="UI design" maxLength={40} autoComplete="off" />
          <Button type="submit" variant="secondary" loading={pending} disabled={pending}>
            Add
          </Button>
        </div>
      </Field>
    </form>
  );
}

export function PortfolioForm({ current }: { current: string | null }) {
  const [state, action, pending] = useActionState<FormState, FormData>(savePortfolio, {});
  return (
    <form action={action}>
      <Field
        id="portfolio"
        label="Portfolio link"
        optional
        hint={state.saved ? "Saved." : "Behance, Figma, Dribbble or a Drive folder, for work that isn't on GitHub."}
        error={state.error}
      >
        <div className="flex gap-2">
          <Input
            id="portfolio"
            name="portfolio"
            type="url"
            inputMode="url"
            defaultValue={current ?? ""}
            error={state.error}
            placeholder="https://"
            autoComplete="url"
          />
          <Button
            type="submit"
            variant="secondary"
            loading={pending}
            disabled={pending}
            icon={state.saved ? <Check className="size-4" aria-hidden="true" /> : undefined}
          >
            Save
          </Button>
        </div>
      </Field>
    </form>
  );
}
