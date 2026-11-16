"use client";

import { RotateCw } from "lucide-react";
import { SlimHeader } from "@/components/site/site-header";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

/** Catches a page that failed to load (for example, Supabase was unreachable). */
export default function PageError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <>
      <SlimHeader backHref="/" backLabel="Back to home" />
      <main id="main" className="flex-1">
        <Container className="max-w-xl py-16 md:py-24">
          <h1 className="text-title font-semibold text-ink">This page didn&rsquo;t load</h1>
          <Alert tone="danger" className="mt-6">
            We couldn&rsquo;t reach Sandbox&rsquo;s data just now. Your details are safe. Try again in a moment.
          </Alert>
          <Button className="mt-6" onClick={() => retry()} icon={<RotateCw className="size-4" aria-hidden="true" />}>
            Try again
          </Button>
        </Container>
      </main>
    </>
  );
}
