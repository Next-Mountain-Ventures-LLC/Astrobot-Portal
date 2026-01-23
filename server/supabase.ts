let supabaseClient: any = null;

export async function initializeSupabase() {
  try {
    const { createClient } = await import("@supabase/supabase-js");

    const supabaseUrl = "https://uzeuhsydjnjsykqvxvkk.supabase.co";
    const supabaseServiceKey =
      process.env.SUPABASE_SERVICE_KEY ||
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6ZXVoc3lkam5qc3lrcXZ4dmtrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTI0MzU2OSwiZXhwIjoyMDgwODE5NTY5fQ.3fkQWpJbvKB7bXQ1XGwq2xf4-6vZg5mAH8cQ4wMzqKo";

    supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    });
  } catch (error) {
    console.error("Failed to initialize Supabase client:", error);
    // Return a mock client for dev server to continue
    createMockSupabaseClient();
  }
}

function createMockSupabaseClient() {
  // Create a chainable query builder that supports method chaining
  const createQueryBuilder = () => ({
    select: (columns?: any) => createQueryBuilder(),
    eq: (column: any, value: any) => createQueryBuilder(),
    single: () => Promise.resolve({ data: null, error: { message: "Supabase not available" } }),
  });

  supabaseClient = {
    from: (table: any) => createQueryBuilder(),
  };
}

export function getSupabase() {
  if (!supabaseClient) {
    // If Supabase wasn't initialized asynchronously, use mock
    createMockSupabaseClient();
  }
  return supabaseClient;
}

export const supabase = new Proxy(
  {},
  {
    get: (target, prop) => {
      return Reflect.get(getSupabase(), prop);
    },
  }
) as any;
