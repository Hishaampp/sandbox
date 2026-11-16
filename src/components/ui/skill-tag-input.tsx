"use client";

import { X } from "lucide-react";
import { useId, useState, type KeyboardEvent } from "react";
import { cn } from "@/lib/cn";

/**
 * Type a skill, press Enter or comma to add it as a tag. Suggestions come from
 * skills real students have (a native datalist, so keyboards and screen readers
 * get the platform's own behaviour). Each tag is submitted as a hidden input.
 */
export function SkillTagInput({
  id,
  name,
  suggestions,
  defaultValue = [],
  max = 8,
  error,
  placeholder = "Type a skill, then press Enter",
}: {
  id: string;
  name: string;
  suggestions: string[];
  defaultValue?: string[];
  max?: number;
  error?: string;
  placeholder?: string;
}) {
  const [tags, setTags] = useState<string[]>(defaultValue);
  const [draft, setDraft] = useState("");
  const listId = useId();
  const full = tags.length >= max;

  function add(raw: string) {
    const value = raw.trim().replace(/,$/, "").trim();
    if (!value || full) return;
    if (tags.some((t) => t.toLowerCase() === value.toLowerCase())) return setDraft("");
    setTags([...tags, value.slice(0, 40)]);
    setDraft("");
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      add(draft);
    } else if (event.key === "Backspace" && !draft && tags.length) {
      setTags(tags.slice(0, -1));
    }
  }

  return (
    <div>
      <div
        className={cn(
          "flex min-h-10 flex-wrap items-center gap-1.5 rounded-control border bg-paper px-2 py-1.5 focus-within:border-accent focus-within:outline-2 focus-within:outline-accent",
          error ? "border-danger" : "border-line-strong",
        )}
      >
        {tags.map((tag) => (
          <span key={tag} className="inline-flex h-7 items-center gap-1 rounded-full bg-sunken pr-1 pl-2.5 text-caption font-medium text-ink">
            {tag}
            <button
              type="button"
              onClick={() => setTags(tags.filter((t) => t !== tag))}
              className="inline-flex size-5 items-center justify-center rounded-full text-muted hover:bg-line hover:text-ink"
              aria-label={`Remove ${tag}`}
            >
              <X className="size-3.5" aria-hidden="true" />
            </button>
            <input type="hidden" name={name} value={tag} />
          </span>
        ))}
        <input
          id={id}
          value={draft}
          onChange={(e) => (e.target.value.endsWith(",") ? add(e.target.value) : setDraft(e.target.value))}
          onKeyDown={onKeyDown}
          onBlur={() => add(draft)}
          list={listId}
          disabled={full}
          placeholder={full ? `Up to ${max} skills` : tags.length ? "Add another" : placeholder}
          aria-invalid={error ? true : undefined}
          aria-describedby={`${id}-message`}
          className="h-7 min-w-32 flex-1 bg-transparent px-1 text-body-sm text-ink outline-none placeholder:text-muted disabled:cursor-not-allowed"
        />
        <datalist id={listId}>
          {suggestions
            .filter((s) => !tags.some((t) => t.toLowerCase() === s.toLowerCase()))
            .map((s) => (
              <option key={s} value={s} />
            ))}
        </datalist>
      </div>
    </div>
  );
}
