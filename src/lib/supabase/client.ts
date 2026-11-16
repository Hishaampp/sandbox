import { createBrowserClient } from "@supabase/ssr";
import { supabaseEnv } from "./env";

/** Supabase client for Client Components. Uses the signed-in user's session; RLS applies. */
export function createClient() {
  const { url, key } = supabaseEnv();
  return createBrowserClient(url, key);
}
