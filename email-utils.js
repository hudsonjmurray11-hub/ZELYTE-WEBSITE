// Shared Supabase email-list helper. Requires supabase.js loaded first.
// Returns { alreadySubscribed: bool, error: Error|null }
window._zelyteSubmitEmail = async function submitEmail(email, source) {
  const { error } = await window._sb
    .from('email_signups')
    .insert({ email: email, source: source });

  if (!error) return { alreadySubscribed: false, error: null };
  if (error.code === '23505') return { alreadySubscribed: true, error: null };
  return { alreadySubscribed: false, error: error };
};
