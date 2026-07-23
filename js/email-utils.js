// Shared Supabase email-list helper. Requires supabase.js loaded first.
// Returns { alreadySubscribed: bool, error: Error|null }
// `extra` is an optional object of additional columns (e.g. { flavor_preference: 'crispy-mint' }).
window._zelyteSubmitEmail = async function submitEmail(email, source, extra) {
  const row = Object.assign({ email: email, source: source }, extra || {});
  let { error } = await window._sb.from('email_signups').insert(row);

  // If extra columns aren't in the table yet, retry with just email + source
  // so the signup is never lost.
  if (error && extra && error.code !== '23505') {
    ({ error } = await window._sb
      .from('email_signups')
      .insert({ email: email, source: source }));
  }

  if (!error) return { alreadySubscribed: false, error: null };
  if (error.code === '23505') return { alreadySubscribed: true, error: null };
  return { alreadySubscribed: false, error: error };
};
