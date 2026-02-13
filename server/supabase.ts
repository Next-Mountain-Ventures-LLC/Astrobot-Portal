let supabaseClient: any = null;

export async function initializeSupabase() {
  try {
    const { createClient } = await import("@supabase/supabase-js");

    const supabaseUrl = "https://uzeuhsydjnjsykqvxvkk.supabase.co";
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseServiceKey) {
      throw new Error("SUPABASE_SERVICE_KEY environment variable is required");
    }

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
  console.log("[Supabase] Using mock client for development");
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
