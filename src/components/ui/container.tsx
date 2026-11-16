import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

/** The page's one left edge: centred, max-width 72rem, 20px gutters on phones, 32px from md. */
export function Container({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("mx-auto w-full max-w-page px-5 md:px-8", className)} {...props} />;
}
