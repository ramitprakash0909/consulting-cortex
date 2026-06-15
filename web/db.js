// Supabase client + Cases data access (Phase 1).
// Safe to ship: the publishable/anon key is public by design; Row Level Security protects the data.
// Gracefully no-ops if Supabase config or the CDN library is missing (e.g. offline), so the rest
// of the app keeps working.
(function () {
  const cfg = window.CORTEX_CONFIG || {};
  const lib = window.supabase; // provided by the @supabase/supabase-js CDN (UMD global)
  const client = (lib && cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY)
    ? lib.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY)
    : null;

  window.cortexDB = {
    enabled() { return !!client; },
    async saveCase(row) {
      if (!client) throw new Error("Supabase not configured");
      const { data, error } = await client.from("cases").insert(row).select().single();
      if (error) throw error;
      return data;
    },
    async listCases() {
      if (!client) return [];
      const { data, error } = await client.from("cases").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    async deleteCase(id) {
      if (!client) return;
      const { error } = await client.from("cases").delete().eq("id", id);
      if (error) throw error;
    }
  };
})();
