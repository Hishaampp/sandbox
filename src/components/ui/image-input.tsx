"use client";

import { ImageUp, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

const ACCEPT = ["image/jpeg", "image/png", "image/webp"];

/**
 * Pick one photo, see it before sending. Checks type and size in the browser
 * for a fast message; the server checks again.
 */
export function ImageInput({
  id,
  label,
  name,
  maxBytes,
  error,
  errorToken,
  required,
}: {
  id: string;
  label: string;
  name: string;
  maxBytes: number;
  error?: string;
  /** Changes with every server response, so a repeated error still shows. */
  errorToken?: unknown;
  required?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  // A server error describes the photo that was sent; hide it once another is picked.
  const [changedSinceError, setChangedSinceError] = useState(false);
  const [seenToken, setSeenToken] = useState(errorToken);
  if (errorToken !== seenToken) {
    setSeenToken(errorToken);
    setChangedSinceError(false);
  }

  useEffect(() => () => void (preview && URL.revokeObjectURL(preview)), [preview]);

  function onChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setLocalError(null);
    setChangedSinceError(true);
    if (!file) return clear();
    if (!ACCEPT.includes(file.type)) {
      setLocalError("Choose a JPG, PNG or WebP photo.");
      return clear(false);
    }
    if (file.size > maxBytes) {
      setLocalError(`This photo is ${(file.size / 1048576).toFixed(1)} MB. The limit is ${maxBytes / 1048576} MB.`);
      return clear(false);
    }
    setPreview(URL.createObjectURL(file));
    setFileName(file.name);
  }

  function clear(resetError = true) {
    if (inputRef.current) inputRef.current.value = "";
    setPreview(null);
    setFileName(null);
    if (resetError) setLocalError(null);
  }

  const shownError = localError ?? (changedSinceError ? undefined : error);

  return (
    <div>
      <p id={`${id}-label`} className="mb-1.5 text-body-sm font-medium text-ink">
        {label}
      </p>
      <input
        ref={inputRef}
        id={id}
        name={name}
        type="file"
        accept={ACCEPT.join(",")}
        required={required}
        onChange={onChange}
        aria-invalid={shownError ? true : undefined}
        aria-labelledby={`${id}-label`}
        aria-describedby={`${id}-message`}
        className="peer sr-only"
      />
      {preview ? (
        <div className="flex items-center gap-4 rounded-control border border-line-strong bg-paper p-3">
          {/* eslint-disable-next-line @next/next/no-img-element -- local object URL preview */}
          <img src={preview} alt="Preview of your ID card" className="h-16 w-24 rounded-control object-cover" />
          <p className="min-w-0 flex-1 truncate text-body-sm text-ink">{fileName}</p>
          <button
            type="button"
            onClick={() => clear()}
            className="inline-flex size-8 items-center justify-center rounded-control text-muted hover:bg-sunken hover:text-ink"
            aria-label="Remove photo"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
      ) : (
        <label
          htmlFor={id}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-control border border-dashed bg-paper px-4 py-6 text-center transition-colors hover:bg-sunken",
            "peer-focus-visible:outline-2 peer-focus-visible:outline-accent",
            shownError ? "border-danger" : "border-line-strong",
          )}
        >
          <ImageUp className="size-5 text-muted" aria-hidden="true" />
          <span className="text-body-sm font-medium text-ink">Choose a photo</span>
          <span className="text-caption text-muted">JPG, PNG or WebP, up to {maxBytes / 1048576} MB</span>
        </label>
      )}
      <p
        id={`${id}-message`}
        className={cn("min-h-5 pt-1.5 text-caption", shownError ? "text-danger" : "text-muted")}
        aria-live="polite"
      >
        {shownError ?? "The front of your college ID card, with your name and photo readable."}
      </p>
    </div>
  );
}
