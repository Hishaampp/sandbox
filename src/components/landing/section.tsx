import type { ReactNode } from "react";
import { Container } from "@/components/ui/container";
import { cn } from "@/lib/cn";

/** A landing section: separated from the one above by a 1px rule, never by a card. */
export function Section({
  id,
  title,
  intro,
  children,
  className,
}: {
  id?: string;
  title: string;
  intro?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const headingId = id ? `${id}-title` : undefined;
  return (
    <section id={id} aria-labelledby={headingId} className={cn("scroll-mt-16 border-t border-line", className)}>
      <Container className="py-20 md:py-28">
        <div className="max-w-prose">
          <h2 id={headingId} className="text-heading font-semibold text-balance text-ink">
            {title}
          </h2>
          {intro && <p className="mt-4 text-lead text-pretty text-muted">{intro}</p>}
        </div>
        <div className="mt-12 md:mt-16">{children}</div>
      </Container>
    </section>
  );
}
