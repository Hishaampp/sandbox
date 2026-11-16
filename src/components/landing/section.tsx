import type { ReactNode } from "react";
import { Container } from "@/components/ui/container";
import { cn } from "@/lib/cn";

/**
 * A landing section, separated from the one above by a 1px rule, never by a card.
 * "stack": title above, content across the full width (for sequences and pairs).
 * "split": on large screens the title holds the left third and stays in view
 * while the content fills the right two thirds, so wide screens carry content
 * instead of empty margins.
 */
export function Section({
  id,
  title,
  intro,
  layout = "stack",
  children,
  className,
}: {
  id?: string;
  title: string;
  intro?: ReactNode;
  layout?: "stack" | "split";
  children: ReactNode;
  className?: string;
}) {
  const headingId = id ? `${id}-title` : undefined;
  const heading = (
    <div className="max-w-prose">
      <h2 id={headingId} className="text-heading font-semibold text-balance text-ink">
        {title}
      </h2>
      {intro && <p className="mt-4 text-lead text-pretty text-muted">{intro}</p>}
    </div>
  );

  return (
    <section id={id} aria-labelledby={headingId} className={cn("scroll-mt-16 border-t border-line", className)}>
      <Container className="py-20 md:py-28">
        {layout === "split" ? (
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-4">
              <div className="lg:sticky lg:top-24">{heading}</div>
            </div>
            <div className="lg:col-span-8">{children}</div>
          </div>
        ) : (
          <>
            {heading}
            <div className="mt-12 md:mt-16">{children}</div>
          </>
        )}
      </Container>
    </section>
  );
}
