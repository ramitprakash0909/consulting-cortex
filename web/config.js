// Public Supabase config for the front-end.
// The anon key + URL are safe to expose (Row Level Security protects the data).
// Do NOT put the Gemini key or the service-role key here - those stay server-side.
// Filled in Phase 1 (Supabase). Empty values = dynamic features simply stay off.
window.CORTEX_CONFIG = {
  SUPABASE_URL: "",       // e.g. https://xxxx.supabase.co
  SUPABASE_ANON_KEY: ""   // anon / public key
};
