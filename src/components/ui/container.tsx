import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

/** The page's one left edge: centred, max-width 88rem; gutters 20px on phones, 32px from md, 48px from xl. */
export function Container({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("mx-auto w-full max-w-page px-5 md:px-8 xl:px-12", className)} {...props} />;
}
