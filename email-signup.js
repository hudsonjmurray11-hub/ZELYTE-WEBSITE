// Email signup list — saves to Supabase `email_signups` table.
// Requires supabase.js to be loaded first.
//
// Run this SQL once in your Supabase SQL Editor to create the table:
//
//   create table if not exists email_signups (
//     id         uuid        primary key default gen_random_uuid(),
//     email      text        unique not null,
//     source     text        default 'homepage',
//     created_at timestamptz default now()
//   );
//
//   alter table email_signups enable row level security;
//
//   create policy "public_insert" on email_signups
//     for insert with check (true);

(function () {
  'use strict';

  // ── Inject section styles ──────────────────────────────────────────────────
  const styleEl = document.createElement('style');
  styleEl.textContent = `
    .section-email-signup {
      padding: 80px 20px;
      text-align: center;
    }
    .email-signup-form {
      display: flex;
      gap: 10px;
      max-width: 480px;
      margin: 28px auto 0;
      flex-wrap: wrap;
      justify-content: center;
    }
    .email-signup-input {
      flex: 1;
      min-width: 220px;
      padding: 13px 18px;
      background: rgba(255,255,255,0.1);
      border: 1px solid rgba(255,255,255,0.22);
      border-radius: 10px;
      color: #fff;
      font-size: 0.95rem;
      outline: none;
      transition: border-color 0.2s, background 0.2s;
      box-sizing: border-box;
    }
    .email-signup-input:focus {
      border-color: rgba(96,165,250,0.7);
      background: rgba(255,255,255,0.14);
    }
    .email-signup-input::placeholder { color: rgba(255,255,255,0.4); }
    .email-signup-btn {
      padding: 13px 22px;
      border: none;
      border-radius: 10px;
      font-size: 0.95rem;
      font-weight: 700;
      cursor: pointer;
      white-space: nowrap;
    }
    .email-signup-btn:disabled {
      opacity: 0.55;
      cursor: not-allowed;
    }
    .email-signup-msg {
      margin-top: 14px;
      font-size: 0.9rem;
      min-height: 20px;
    }
    .email-signup-msg.success { color: #4ade80; }
    .email-signup-msg.error   { color: #f87171; }
  `;
  document.head.appendChild(styleEl);

  // ── Form handler ───────────────────────────────────────────────────────────
  const form  = document.getElementById('email-signup-form');
  const msgEl = document.getElementById('email-signup-msg');

  if (!form) return;

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    const emailInp = document.getElementById('signup-email');
    const btn      = form.querySelector('button[type="submit"]');
    const email    = emailInp.value.trim();

    if (!email) return;

    btn.disabled    = true;
    btn.textContent = 'Signing up…';
    if (msgEl) { msgEl.textContent = ''; msgEl.className = 'email-signup-msg'; }

    const { error } = await window._sb
      .from('email_signups')
      .insert({ email: email, source: 'homepage' });

    btn.disabled    = false;
    btn.textContent = 'Get Early Access →';

    if (!msgEl) return;

    if (error) {
      // Postgres unique violation code
      if (error.code === '23505') {
        msgEl.textContent = "You're already on the list!";
        msgEl.classList.add('success');
      } else {
        msgEl.textContent = 'Something went wrong — please try again.';
        msgEl.classList.add('error');
      }
      return;
    }

    form.reset();
    msgEl.textContent = "You're on the list! We'll be in touch.";
    msgEl.classList.add('success');
  });
})();
