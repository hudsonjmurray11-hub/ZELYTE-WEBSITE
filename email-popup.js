// Email capture popup — timed, dismissible, one-time per visitor.
// Requires supabase.js to be loaded first.
// Uses localStorage key 'zelyte_popup_seen' to suppress after first dismiss/submit.

(function () {
  'use strict';

  const STORAGE_KEY = 'zelyte_popup_seen';
  const DELAY_MS    = 6000;

  if (localStorage.getItem(STORAGE_KEY)) return;

  // ── Styles ─────────────────────────────────────────────────────────────────
  const styleEl = document.createElement('style');
  styleEl.textContent = `
    .ep-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.65);
      backdrop-filter: blur(5px);
      -webkit-backdrop-filter: blur(5px);
      z-index: 20000;
      opacity: 0;
      transition: opacity 0.3s;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .ep-overlay.ep-open { opacity: 1; }

    .ep-modal {
      position: relative;
      width: 100%;
      max-width: 420px;
      background: rgba(6,12,28,0.95);
      backdrop-filter: blur(30px);
      -webkit-backdrop-filter: blur(30px);
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 22px;
      padding: 44px 36px 36px;
      box-shadow: 0 32px 80px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.04) inset;
      transform: translateY(14px);
      transition: transform 0.3s;
      text-align: center;
    }
    .ep-overlay.ep-open .ep-modal { transform: translateY(0); }

    .ep-close {
      position: absolute;
      top: 14px;
      right: 14px;
      background: rgba(255,255,255,0.08);
      border: none;
      color: rgba(255,255,255,0.6);
      width: 32px;
      height: 32px;
      border-radius: 8px;
      font-size: 17px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s, color 0.2s;
    }
    .ep-close:hover { background: rgba(255,255,255,0.15); color: #fff; }

    .ep-badge {
      display: inline-block;
      font-size: 0.68rem;
      font-weight: 800;
      letter-spacing: 3px;
      color: rgba(255,255,255,0.35);
      text-transform: uppercase;
      margin-bottom: 10px;
    }

    .ep-headline {
      font-size: 1.55rem;
      font-weight: 800;
      color: #fff;
      line-height: 1.2;
      margin-bottom: 10px;
      letter-spacing: -0.3px;
    }

    .ep-sub {
      font-size: 0.9rem;
      color: rgba(255,255,255,0.5);
      line-height: 1.55;
      margin-bottom: 26px;
    }

    .ep-form {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .ep-input {
      width: 100%;
      padding: 13px 16px;
      background: rgba(255,255,255,0.08);
      border: 1px solid rgba(255,255,255,0.15);
      border-radius: 11px;
      color: #fff;
      font-size: 0.95rem;
      outline: none;
      box-sizing: border-box;
      transition: border-color 0.2s, background 0.2s;
    }
    .ep-input:focus {
      border-color: rgba(59,130,246,0.7);
      background: rgba(255,255,255,0.11);
    }
    .ep-input::placeholder { color: rgba(255,255,255,0.3); }

    .ep-submit {
      width: 100%;
      padding: 13px;
      border: none;
      border-radius: 11px;
      font-size: 0.95rem;
      font-weight: 700;
      color: #fff;
      cursor: pointer;
      letter-spacing: 0.3px;
      background: linear-gradient(135deg, #0d47a1, #1565c0, #1a73e8, #3b82f6, #60a5fa, #3b82f6, #1a73e8, #1565c0, #0d47a1);
      background-size: 300% 100%;
      animation: ep-sweep 3s ease infinite;
      box-shadow: 0 4px 20px rgba(26,115,232,0.45);
      transition: transform 0.15s, box-shadow 0.2s;
    }
    .ep-submit:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 28px rgba(26,115,232,0.6);
    }
    .ep-submit:disabled {
      opacity: 0.55;
      cursor: not-allowed;
      animation: none;
    }

    @keyframes ep-sweep {
      0%   { background-position: 0% 50%; }
      50%  { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }

    .ep-msg {
      font-size: 0.85rem;
      min-height: 18px;
      margin-top: 2px;
    }
    .ep-msg.success { color: #4ade80; }
    .ep-msg.error   { color: #f87171; }

    .ep-dismiss {
      display: inline-block;
      margin-top: 14px;
      font-size: 0.82rem;
      color: rgba(255,255,255,0.28);
      cursor: pointer;
      text-decoration: underline;
      text-underline-offset: 2px;
      background: none;
      border: none;
      transition: color 0.2s;
    }
    .ep-dismiss:hover { color: rgba(255,255,255,0.5); }
  `;
  document.head.appendChild(styleEl);

  // ── HTML ───────────────────────────────────────────────────────────────────
  const wrap = document.createElement('div');
  wrap.innerHTML = `
    <div id="ep-overlay" class="ep-overlay" role="dialog" aria-modal="true" aria-label="Get early access">
      <div class="ep-modal">
        <button class="ep-close" id="ep-close" aria-label="Close">✕</button>
        <span class="ep-badge">ZELYTE</span>
        <h2 class="ep-headline">Be the first in line.</h2>
        <p class="ep-sub">Early access, new flavors, and exclusive drops —<br>straight to your inbox. No spam, ever.</p>
        <form id="ep-form" class="ep-form" novalidate>
          <input type="email" id="ep-email" class="ep-input" placeholder="Your email address" required autocomplete="email">
          <p id="ep-msg" class="ep-msg"></p>
          <button type="submit" id="ep-submit" class="ep-submit">Get Early Access →</button>
        </form>
        <button class="ep-dismiss" id="ep-dismiss">No thanks</button>
      </div>
    </div>
  `;
  document.body.appendChild(wrap);

  // ── References ─────────────────────────────────────────────────────────────
  const overlay   = document.getElementById('ep-overlay');
  const closeBtn  = document.getElementById('ep-close');
  const dismissBtn= document.getElementById('ep-dismiss');
  const form      = document.getElementById('ep-form');
  const emailInp  = document.getElementById('ep-email');
  const submitBtn = document.getElementById('ep-submit');
  const msgEl     = document.getElementById('ep-msg');

  // ── Open / close ───────────────────────────────────────────────────────────
  function open() {
    overlay.style.display = 'flex';
    requestAnimationFrame(() => {
      requestAnimationFrame(() => overlay.classList.add('ep-open'));
    });
    setTimeout(() => emailInp.focus(), 300);
  }

  function close() {
    localStorage.setItem(STORAGE_KEY, '1');
    overlay.classList.remove('ep-open');
    setTimeout(() => overlay.remove(), 300);
  }

  function showMsg(text, type) {
    msgEl.textContent = text;
    msgEl.className = 'ep-msg' + (type ? ' ' + type : '');
  }

  // ── Trigger after delay ────────────────────────────────────────────────────
  overlay.style.display = 'none';
  setTimeout(open, DELAY_MS);

  // ── Events ─────────────────────────────────────────────────────────────────
  closeBtn.addEventListener('click', close);
  dismissBtn.addEventListener('click', close);

  // Click outside modal content closes
  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) close();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && overlay.classList.contains('ep-open')) close();
  });

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    const email = emailInp.value.trim();
    if (!email) return;

    submitBtn.disabled    = true;
    submitBtn.textContent = 'Please wait…';
    showMsg('');

    const { error } = await window._sb
      .from('email_signups')
      .insert({ email: email, source: 'popup' });

    submitBtn.disabled    = false;
    submitBtn.textContent = 'Get Early Access →';

    if (error) {
      if (error.code === '23505') {
        showMsg("You're already on the list!", 'success');
        setTimeout(close, 2000);
      } else {
        showMsg('Something went wrong — please try again.', 'error');
      }
      return;
    }

    showMsg("You're on the list!", 'success');
    localStorage.setItem(STORAGE_KEY, '1');
    setTimeout(close, 2500);
  });
})();
