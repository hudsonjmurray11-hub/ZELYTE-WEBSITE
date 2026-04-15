// Supabase client — loaded once, shared across all pages.
// Requires the CDN script above this tag:
//   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

(function () {
  const SUPABASE_URL = 'https://gfhnggufqssamdxzhaqh.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_8Lv1kBQmmnqUher9Cx2k5Q_grxRH71H';
  window._sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
})();
