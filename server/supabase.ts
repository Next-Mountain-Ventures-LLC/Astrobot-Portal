import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://uzeuhsydjnjsykqvxvkk.supabase.co";
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6ZXVoc3lkam5qc3lrcXZ4dmtrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTI0MzU2OSwiZXhwIjoyMDgwODE5NTY5fQ.3fkQWpJbvKB7bXQ1XGwq2xf4-6vZg5mAH8cQ4wMzqKo";

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
});
