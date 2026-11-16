import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// Teach tailwind-merge about our custom type scale so `text-body` and
// `text-ink` are not treated as conflicting classes.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-family": [{ font: ["sans", "mono", "display"] }],
      "font-size": [
        { text: ["caption", "body-sm", "body", "lead", "title", "heading", "display-sm", "display", "display-lg"] },
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
