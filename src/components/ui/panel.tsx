import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

/** A raised surface: paper fill, 1px border, panel radius. No shadow. */
export function Panel({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("rounded-panel border border-line bg-paper", className)} {...props} />;
}
