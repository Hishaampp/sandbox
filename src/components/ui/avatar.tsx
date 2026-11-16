import { cn } from "@/lib/cn";

const sizes = { sm: "size-8 text-caption", md: "size-10 text-body-sm", lg: "size-14 text-lead" } as const;

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

export function Avatar({
  name,
  src,
  size = "md",
  className,
}: {
  name: string;
  src?: string | null;
  size?: keyof typeof sizes;
  className?: string;
}) {
  const classes = cn(
    "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-line bg-sunken font-medium text-ink-soft",
    sizes[size],
    className,
  );
  if (src) {
    // Avatars come from Google/GitHub CDNs; a plain img avoids configuring remote image domains.
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" className={classes} referrerPolicy="no-referrer" />;
  }
  return (
    <span className={classes} aria-hidden="true">
      {initials(name)}
    </span>
  );
}
