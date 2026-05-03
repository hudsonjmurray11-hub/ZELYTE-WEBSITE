// Auth modal — sign in / sign up / sign out
// Requires supabase.js to be loaded first.

(function () {
  'use strict';

  // ── Inject styles ──────────────────────────────────────────────────────────
  const styleEl = document.createElement('style');
  styleEl.textContent = `
    /* Nav auth button */
    #auth-btn {
      background: rgba(255,255,255,0.12);
      border: 1px solid rgba(255,255,255,0.22);
      color: #fff;
      padding: 7px 14px;
      border-radius: 8px;
      font-size: 0.88rem;
      font-weight: 600;
      cursor: pointer;
      margin-right: 12px;
      letter-spacing: 0.3px;
      transition: background 0.2s;
      white-space: nowrap;
    }
    #auth-btn:hover { background: rgba(255,255,255,0.22); }
    #auth-btn.auth-btn--avatar {
      width: 34px;
      height: 34px;
      padding: 0;
      margin-right: 12px;
      border-radius: 50%;
      background: linear-gradient(135deg, #1a73e8, #3b82f6);
      border: 2px solid rgba(255,255,255,0.35);
      font-size: 0.88rem;
      font-weight: 700;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    /* User dropdown */
    .auth-user-menu {
      position: absolute;
      top: calc(100% + 8px);
      right: 0;
      background: rgba(10,18,36,0.97);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 12px;
      padding: 8px;
      min-width: 190px;
      z-index: 9999;
      box-shadow: 0 12px 40px rgba(0,0,0,0.5);
    }
    .auth-user-menu .user-email {
      font-size: 0.78rem;
      color: rgba(255,255,255,0.4);
      padding: 6px 10px 10px;
      border-bottom: 1px solid rgba(255,255,255,0.08);
      margin-bottom: 4px;
      word-break: break-all;
    }
    .auth-user-menu .menu-signout {
      width: 100%;
      background: transparent;
      border: none;
      color: #f87171;
      text-align: left;
      padding: 8px 10px;
      border-radius: 8px;
      font-size: 0.88rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s;
    }
    .auth-user-menu .menu-signout:hover { background: rgba(248,113,113,0.1); }

    /* Overlay */
    .auth-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.65);
      backdrop-filter: blur(5px);
      -webkit-backdrop-filter: blur(5px);
      z-index: 10000;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.25s;
    }
    .auth-overlay.open { opacity: 1; pointer-events: all; }

    /* Modal */
    .auth-modal {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -46%);
      width: 92%;
      max-width: 400px;
      background: rgba(8,15,30,0.94);
      backdrop-filter: blur(28px);
      -webkit-backdrop-filter: blur(28px);
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 20px;
      padding: 36px 32px 32px;
      z-index: 10001;
      box-shadow: 0 30px 80px rgba(0,0,0,0.6);
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.25s, transform 0.25s;
    }
    .auth-modal.open {
      opacity: 1;
      pointer-events: all;
      transform: translate(-50%, -50%);
    }

    .auth-close {
      position: absolute;
      top: 14px;
      right: 14px;
      background: rgba(255,255,255,0.08);
      border: none;
      color: rgba(255,255,255,0.7);
      width: 32px;
      height: 32px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 17px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s, color 0.2s;
    }
    .auth-close:hover { background: rgba(255,255,255,0.16); color: #fff; }

    .auth-logo-text {
      text-align: center;
      font-size: 0.72rem;
      font-weight: 800;
      letter-spacing: 2.5px;
      color: rgba(255,255,255,0.35);
      text-transform: uppercase;
      margin-bottom: 6px;
    }

    .auth-title {
      font-size: 1.35rem;
      font-weight: 700;
      color: #fff;
      text-align: center;
      margin-bottom: 22px;
      letter-spacing: -0.2px;
    }

    .auth-tabs {
      display: flex;
      gap: 4px;
      background: rgba(255,255,255,0.06);
      border-radius: 10px;
      padding: 4px;
      margin-bottom: 22px;
    }
    .auth-tab {
      flex: 1;
      padding: 8px;
      border: none;
      background: transparent;
      color: rgba(255,255,255,0.45);
      font-size: 0.88rem;
      font-weight: 600;
      border-radius: 7px;
      cursor: pointer;
      transition: background 0.2s, color 0.2s;
    }
    .auth-tab.active {
      background: rgba(26,115,232,0.28);
      color: #fff;
    }

    .auth-field {
      width: 100%;
      padding: 12px 15px;
      background: rgba(255,255,255,0.07);
      border: 1px solid rgba(255,255,255,0.14);
      border-radius: 10px;
      color: #fff;
      font-size: 0.95rem;
      margin-bottom: 11px;
      outline: none;
      transition: border-color 0.2s, background 0.2s;
      box-sizing: border-box;
    }
    .auth-field:focus {
      border-color: rgba(26,115,232,0.7);
      background: rgba(255,255,255,0.1);
    }
    .auth-field::placeholder { color: rgba(255,255,255,0.3); }

    .auth-msg {
      font-size: 0.84rem;
      text-align: center;
      min-height: 18px;
      margin: 2px 0 10px;
    }
    .auth-msg.error { color: #f87171; }
    .auth-msg.success { color: #4ade80; }

    .auth-submit {
      width: 100%;
      padding: 12px;
      border: none;
      border-radius: 10px;
      font-size: 0.95rem;
      font-weight: 700;
      cursor: pointer;
      letter-spacing: 0.3px;
      position: relative;
      color: #fff;
      background: linear-gradient(135deg, #0d47a1, #1565c0, #1a73e8, #3b82f6, #60a5fa, #3b82f6, #1a73e8, #1565c0, #0d47a1);
      background-size: 300% 100%;
      animation: zelyte-gradient-sweep 3s ease infinite;
      transition: transform 0.15s, box-shadow 0.2s;
      box-shadow: 0 4px 18px rgba(26,115,232,0.4);
    }
    .auth-submit:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 24px rgba(26,115,232,0.55);
    }
    .auth-submit:disabled {
      opacity: 0.55;
      cursor: not-allowed;
      animation: none;
    }

    .auth-divider {
      text-align: center;
      font-size: 0.8rem;
      color: rgba(255,255,255,0.25);
      margin: 14px 0 6px;
    }
  `;
  document.head.appendChild(styleEl);

  // ── Inject modal HTML ──────────────────────────────────────────────────────
  const wrap = document.createElement('div');
  wrap.innerHTML = `
    <div id="auth-overlay" class="auth-overlay"></div>
    <div id="auth-modal" class="auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-title">
      <button class="auth-close" id="auth-modal-close" aria-label="Close">✕</button>
      <p class="auth-logo-text">ZELYTE</p>
      <h2 class="auth-title" id="auth-title">Sign In</h2>
      <div class="auth-tabs">
        <button class="auth-tab active" data-tab="signin">Sign In</button>
        <button class="auth-tab" data-tab="signup">Sign Up</button>
      </div>
      <form id="auth-form" novalidate>
        <input type="email" id="auth-email" class="auth-field" placeholder="Email address" required autocomplete="email">
        <input type="password" id="auth-password" class="auth-field" placeholder="Password (min 6 chars)" required minlength="6" autocomplete="current-password">
        <p id="auth-msg" class="auth-msg"></p>
        <button type="submit" id="auth-submit" class="auth-submit">Sign In</button>
      </form>
    </div>
  `;
  document.body.appendChild(wrap);

  // ── References ─────────────────────────────────────────────────────────────
  const overlay   = document.getElementById('auth-overlay');
  const modal     = document.getElementById('auth-modal');
  const closeBtn  = document.getElementById('auth-modal-close');
  const tabs      = modal.querySelectorAll('.auth-tab');
  const form      = document.getElementById('auth-form');
  const emailInp  = document.getElementById('auth-email');
  const passInp   = document.getElementById('auth-password');
  const msgEl     = document.getElementById('auth-msg');
  const submitBtn = document.getElementById('auth-submit');
  const titleEl   = document.getElementById('auth-title');
  const navBtn    = document.getElementById('auth-btn');

  let mode = 'signin';
  let userMenuEl = null;

  // ── Helpers ────────────────────────────────────────────────────────────────
  function openModal(initialMode) {
    setMode(initialMode || 'signin');
    overlay.classList.add('open');
    modal.classList.add('open');
    setTimeout(() => emailInp.focus(), 50);
  }

  function closeModal() {
    overlay.classList.remove('open');
    modal.classList.remove('open');
    form.reset();
    showMsg('');
  }

  function setMode(m) {
    mode = m;
    const label = m === 'signin' ? 'Sign In' : 'Sign Up';
    titleEl.textContent = label;
    submitBtn.textContent = label;
    passInp.autocomplete = m === 'signin' ? 'current-password' : 'new-password';
    tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === m));
    showMsg('');
  }

  function showMsg(text, type) {
    msgEl.textContent = text;
    msgEl.className = 'auth-msg' + (type ? ' ' + type : '');
  }

  function setLoading(on) {
    submitBtn.disabled = on;
    if (on) {
      submitBtn.textContent = 'Please wait…';
    } else {
      submitBtn.textContent = mode === 'signin' ? 'Sign In' : 'Sign Up';
    }
  }

  // ── Nav button ─────────────────────────────────────────────────────────────
  function updateNavBtn(user) {
    if (!navBtn) return;
    if (user) {
      navBtn.textContent = user.email[0].toUpperCase();
      navBtn.classList.add('auth-btn--avatar');
      navBtn.title = user.email;
    } else {
      navBtn.textContent = 'Sign In';
      navBtn.classList.remove('auth-btn--avatar');
      navBtn.title = '';
    }
  }

  function dismissUserMenu() {
    if (userMenuEl) {
      userMenuEl.remove();
      userMenuEl = null;
    }
  }

  // ── Auth state listener ────────────────────────────────────────────────────
  window._sb.auth.onAuthStateChange(function (_event, session) {
    updateNavBtn(session ? session.user : null);
  });

  window._sb.auth.getSession().then(function (res) {
    updateNavBtn(res.data.session ? res.data.session.user : null);
  });

  // ── Event listeners ────────────────────────────────────────────────────────
  if (navBtn) {
    navBtn.addEventListener('click', async function (e) {
      e.stopPropagation();
      const res = await window._sb.auth.getSession();
      const session = res.data.session;

      if (!session) {
        openModal('signin');
        return;
      }

      // Toggle user dropdown
      if (userMenuEl) {
        dismissUserMenu();
        return;
      }

      userMenuEl = document.createElement('div');
      userMenuEl.className = 'auth-user-menu';
      userMenuEl.innerHTML = `
        <p class="user-email">${session.user.email}</p>
        <button class="menu-signout">Sign Out</button>
      `;
      navBtn.parentElement.style.position = 'relative';
      navBtn.parentElement.appendChild(userMenuEl);

      userMenuEl.querySelector('.menu-signout').addEventListener('click', async function () {
        await window._sb.auth.signOut();
        dismissUserMenu();
      });
    });
  }

  // Close dropdown on outside click
  document.addEventListener('click', dismissUserMenu);

  // Tab switching
  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () { setMode(tab.dataset.tab); });
  });

  // Close modal
  closeBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', closeModal);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeModal();
  });

  // Form submit
  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    const email    = emailInp.value.trim();
    const password = passInp.value;

    if (!email || !password) return;

    setLoading(true);
    showMsg('');

    let result;
    if (mode === 'signin') {
      result = await window._sb.auth.signInWithPassword({ email, password });
    } else {
      result = await window._sb.auth.signUp({ email, password });
    }

    setLoading(false);

    if (result.error) {
      showMsg(result.error.message, 'error');
      return;
    }

    if (mode === 'signup') {
      showMsg('Check your email to confirm your account!', 'success');
      form.reset();
    } else {
      closeModal();
    }
  });

  // Expose globally so other scripts can open the modal
  window.openAuthModal = openModal;
})();
