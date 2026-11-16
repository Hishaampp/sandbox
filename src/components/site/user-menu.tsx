"use client";

import { LogOut } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { signOut } from "@/app/actions/auth";
import { Avatar } from "@/components/ui/avatar";
import { Spinner } from "@/components/ui/spinner";

export function UserMenu({
  name,
  email,
  avatarUrl,
}: {
  name: string;
  email: string | null;
  avatarUrl: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    function onPointer(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={menuId}
        aria-label="Account menu"
        className="flex rounded-full"
      >
        <Avatar name={name} src={avatarUrl} size="sm" />
      </button>
      {open && (
        <div
          id={menuId}
          className="absolute right-0 z-40 mt-2 w-64 origin-top-right animate-pop rounded-panel border border-line bg-paper p-1"
        >
          <div className="border-b border-line px-3 py-2.5">
            <p className="truncate text-body-sm font-medium text-ink">{name}</p>
            {email && <p className="truncate text-caption text-muted">{email}</p>}
          </div>
          <form action={signOut} onSubmit={() => setSigningOut(true)} className="pt-1">
            <button
              type="submit"
              disabled={signingOut}
              className="flex h-9 w-full items-center gap-2 rounded-control px-3 text-body-sm text-ink hover:bg-sunken disabled:opacity-60"
            >
              {signingOut ? <Spinner /> : <LogOut className="size-4" aria-hidden="true" />}
              Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
