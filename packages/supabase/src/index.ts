export { createClient as createBrowserClient } from "./client";
export { createServerClient } from "./server";
export { updateSession } from "./middleware";
export { getCurrentUser, getUser, requireAuth } from "./auth";

// Re-export common types from @supabase/supabase-js
export type { User, Session, AuthError } from "@supabase/supabase-js";