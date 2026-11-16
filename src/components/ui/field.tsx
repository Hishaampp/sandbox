import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Label above, control, then one line that holds the hint or the error.
 * The line is always reserved, so an error never pushes the form down.
 */
export function Field({
  id,
  label,
  hint,
  error,
  optional = false,
  className,
  children,
}: {
  id: string;
  label: string;
  hint?: ReactNode;
  error?: string;
  optional?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("flex flex-col", className)}>
      <label htmlFor={id} className="mb-1.5 text-body-sm font-medium text-ink">
        {label}
        {optional && <span className="ml-1.5 font-normal text-muted">Optional</span>}
      </label>
      {children}
      <p
        id={`${id}-message`}
        className={cn("min-h-5 pt-1.5 text-caption", error ? "text-danger" : "text-muted")}
        aria-live={error ? "polite" : undefined}
      >
        {error ?? hint}
      </p>
    </div>
  );
}

const control =
  "w-full rounded-control border bg-paper px-3 text-body-sm text-ink placeholder:text-muted " +
  "transition-colors outline-none focus-visible:border-accent focus-visible:outline-2 focus-visible:outline-offset-0 " +
  "disabled:bg-sunken disabled:text-muted aria-invalid:border-danger";

function controlProps(id: string, error?: string) {
  return {
    id,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": `${id}-message`,
  } as const;
}

export function Input({
  id,
  error,
  className,
  ...props
}: ComponentProps<"input"> & { id: string; error?: string }) {
  return (
    <input
      {...controlProps(id, error)}
      className={cn(control, "h-10 border-line-strong", className)}
      {...props}
    />
  );
}

export function Select({
  id,
  error,
  className,
  children,
  ...props
}: ComponentProps<"select"> & { id: string; error?: string }) {
  return (
    <select
      {...controlProps(id, error)}
      className={cn(control, "h-10 border-line-strong pr-8", className)}
      {...props}
    >
      {children}
    </select>
  );
}

export function Textarea({
  id,
  error,
  className,
  ...props
}: ComponentProps<"textarea"> & { id: string; error?: string }) {
  return (
    <textarea
      {...controlProps(id, error)}
      className={cn(control, "min-h-24 border-line-strong py-2", className)}
      {...props}
    />
  );
}
