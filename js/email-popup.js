// Email capture popup — two-step (flavor question → email), timed, dismissible.
// Requires supabase.js + email-utils.js to be loaded first.

(function () {
  'use strict';

  const DELAY_MS = 6000;

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
      padding: 16px;
    }
    .ep-overlay.ep-open { opacity: 1; }

    .ep-modal {
      position: relative;
      width: min(1100px, calc(100vw - 32px));
      max-height: calc(100vh - 32px);
      max-height: calc(100dvh - 32px);
      background: #fff;
      color: #0b1220;
      border-radius: 22px;
      overflow: hidden;
      display: grid;
      grid-template-columns: 1fr 1.1fr;
      box-shadow: 0 32px 80px rgba(0,0,0,0.55);
      transform: translateY(14px);
      transition: transform 0.3s;
      text-align: left;
    }
    .ep-overlay.ep-open .ep-modal { transform: translateY(0); }

    .ep-media {
      position: relative;
      display: block;
      min-height: 100%;
      overflow: hidden;
      background: #060f2a;
    }
    .ep-media picture { display: block; height: 100%; }
    .ep-media img {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center;
    }
    .ep-media::after {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(to top, rgba(6,15,42,0.45), transparent 45%);
      pointer-events: none;
    }
    .ep-media-badge {
      position: absolute;
      bottom: 18px;
      left: 18px;
      z-index: 1;
      background: #1a73e8;
      color: #fff;
      font-size: 0.68rem;
      font-weight: 800;
      letter-spacing: 2.5px;
      text-transform: uppercase;
      padding: 7px 14px;
      border-radius: 100px;
    }

    .ep-body {
      position: relative;
      padding: 52px 52px 36px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      overflow-y: auto;
      font-family: 'Poppins', system-ui, sans-serif;
    }

    .ep-close {
      position: absolute;
      top: 14px;
      right: 14px;
      z-index: 2;
      background: #f1f3f6;
      border: none;
      color: #5b6472;
      width: 34px;
      height: 34px;
      border-radius: 10px;
      font-size: 17px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s, color 0.2s;
    }
    .ep-close:hover { background: #e3e7ee; color: #0b1220; }

    .ep-progress {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 1px;
      text-transform: uppercase;
      color: #8a93a3;
      margin-bottom: 18px;
    }
    .ep-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #dfe4ec;
      transition: background 0.2s;
    }
    .ep-dot.ep-dot-active { background: #1a73e8; }

    .ep-badge {
      display: inline-block;
      font-size: 0.68rem;
      font-weight: 800;
      letter-spacing: 3px;
      color: #1a73e8;
      text-transform: uppercase;
      margin-bottom: 10px;
    }

    .ep-headline {
      font-size: 1.9rem;
      font-weight: 800;
      color: #0b1220;
      line-height: 1.2;
      margin: 0 0 10px;
      letter-spacing: -0.3px;
    }

    .ep-sub {
      font-size: 1rem;
      color: #5b6472;
      line-height: 1.55;
      margin: 0 0 24px;
    }

    .ep-step { display: none; }
    .ep-step.ep-step-active {
      display: block;
      animation: ep-step-in 0.3s ease;
    }
    @keyframes ep-step-in {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    .ep-flavors {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .ep-flavor {
      display: flex;
      align-items: center;
      gap: 16px;
      width: 100%;
      padding: 12px 18px;
      background: #fff;
      border: 2px solid #e5e9f0;
      border-radius: 16px;
      cursor: pointer;
      text-align: left;
      font-family: inherit;
      transition: border-color 0.2s, box-shadow 0.2s, transform 0.15s;
    }
    .ep-flavor:hover,
    .ep-flavor:focus-visible {
      border-color: #1a73e8;
      box-shadow: 0 4px 18px rgba(26,115,232,0.15);
      transform: translateY(-1px);
      outline: none;
    }
    .ep-flavor.ep-flavor-selected {
      border-color: #1a73e8;
      background: #f0f6ff;
    }
    .ep-flavor-name {
      display: block;
      font-size: 1.02rem;
      font-weight: 700;
      color: #0b1220;
    }
    .ep-flavor-desc {
      display: block;
      font-size: 0.84rem;
      color: #5b6472;
      margin-top: 2px;
    }
    .ep-flavor--cherry .ep-flavor-name { color: #a01235; }
    .ep-flavor-arrow {
      margin-left: auto;
      color: #b6bfcc;
      font-size: 1.1rem;
      flex-shrink: 0;
    }

    .ep-social {
      font-size: 0.85rem;
      font-weight: 600;
      color: #1a73e8;
      margin: 0 0 12px;
    }

    .ep-form {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .ep-input {
      width: 100%;
      padding: 14px 16px;
      background: #fff;
      border: 2px solid #e5e9f0;
      border-radius: 12px;
      color: #0b1220;
      font-size: 0.95rem;
      font-family: inherit;
      outline: none;
      box-sizing: border-box;
      transition: border-color 0.2s;
    }
    .ep-input:focus { border-color: #1a73e8; }
    .ep-input::placeholder { color: #9aa3b2; }

    .ep-submit {
      width: 100%;
      padding: 14px;
      border: none;
      border-radius: 12px;
      font-size: 0.95rem;
      font-weight: 700;
      font-family: inherit;
      color: #fff;
      cursor: pointer;
      letter-spacing: 0.3px;
      background: linear-gradient(135deg, #0d47a1, #1565c0, #1a73e8, #3b82f6, #60a5fa, #3b82f6, #1a73e8, #1565c0, #0d47a1);
      background-size: 300% 100%;
      animation: zelyte-gradient-sweep 3s ease infinite;
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

    .ep-trust {
      display: flex;
      flex-wrap: wrap;
      gap: 6px 18px;
      margin-top: 16px;
      padding: 0;
      list-style: none;
    }
    .ep-trust li {
      font-size: 0.8rem;
      color: #5b6472;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .ep-trust li::before {
      content: '✓';
      color: #1a73e8;
      font-weight: 800;
    }

    .ep-msg {
      font-size: 0.85rem;
      min-height: 18px;
      margin: 2px 0 0;
    }
    .ep-msg.success { color: #15803d; }
    .ep-msg.error   { color: #dc2626; }

    .ep-back,
    .ep-dismiss {
      display: inline-block;
      margin-top: 14px;
      font-size: 0.82rem;
      color: #8a93a3;
      cursor: pointer;
      text-decoration: underline;
      text-underline-offset: 2px;
      background: none;
      border: none;
      padding: 0;
      font-family: inherit;
      transition: color 0.2s;
    }
    .ep-back:hover,
    .ep-dismiss:hover { color: #0b1220; }

    .ep-success {
      text-align: center;
      padding: 20px 0;
    }
    .ep-success-check {
      width: 64px;
      height: 64px;
      margin: 0 auto 18px;
      border-radius: 50%;
      background: #e8f5ee;
      color: #15803d;
      font-size: 2rem;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    @media (max-width: 760px) {
      .ep-modal {
        grid-template-columns: 1fr;
        grid-template-rows: 170px 1fr;
        width: calc(100vw - 24px);
        max-height: calc(100dvh - 24px);
      }
      .ep-media { min-height: 0; }
      .ep-media-badge { bottom: 12px; left: 12px; }
      .ep-body { padding: 26px 22px 24px; justify-content: flex-start; }
      .ep-headline { font-size: 1.45rem; }
      .ep-sub { font-size: 0.92rem; margin-bottom: 18px; }
    }

    @media (prefers-reduced-motion: reduce) {
      .ep-overlay,
      .ep-modal,
      .ep-flavor,
      .ep-submit { transition: none; }
      .ep-step.ep-step-active { animation: none; }
      .ep-submit { animation: none; }
    }
  `;
  document.head.appendChild(styleEl);

  // ── HTML ───────────────────────────────────────────────────────────────────
  const wrap = document.createElement('div');
  wrap.innerHTML = `
    <div id="ep-overlay" class="ep-overlay" role="dialog" aria-modal="true" aria-labelledby="ep-headline-1">
      <div class="ep-modal">
        <div class="ep-media">
          <picture>
            <source srcset="images/edited-photo.webp" type="image/webp">
            <img src="images/edited-photo.png" alt="ZELYTE Crispy Mint tins" loading="lazy">
          </picture>
          <span class="ep-media-badge">Launching Soon</span>
        </div>
        <div class="ep-body">
          <button class="ep-close" id="ep-close" aria-label="Close">✕</button>

          <div id="ep-step-1" class="ep-step ep-step-active">
            <div class="ep-progress" aria-hidden="true">
              <span class="ep-dot ep-dot-active"></span><span class="ep-dot"></span> Step 1 of 2
            </div>
            <span class="ep-badge">Zelyte · Early Access</span>
            <h2 class="ep-headline" id="ep-headline-1">Which flavor are you most excited to try?</h2>
            <p class="ep-sub">Zero sugar. Electrolytes + caffeine. Pick your first pouch.</p>
            <div class="ep-flavors">
              <button type="button" class="ep-flavor" data-flavor="crispy-mint">
                <span>
                  <span class="ep-flavor-name">Crispy Mint</span>
                  <span class="ep-flavor-desc">Cool, clean, refreshing</span>
                </span>
                <span class="ep-flavor-arrow" aria-hidden="true">→</span>
              </button>
              <button type="button" class="ep-flavor ep-flavor--cherry" data-flavor="black-cherry">
                <span>
                  <span class="ep-flavor-name">Black Cherry</span>
                  <span class="ep-flavor-desc">Bold, dark, juicy</span>
                </span>
                <span class="ep-flavor-arrow" aria-hidden="true">→</span>
              </button>
              <button type="button" class="ep-flavor" data-flavor="both">
                <span>
                  <span class="ep-flavor-name">Both — I can't choose</span>
                  <span class="ep-flavor-desc">Give me first dibs on everything</span>
                </span>
                <span class="ep-flavor-arrow" aria-hidden="true">→</span>
              </button>
            </div>
            <button class="ep-dismiss" id="ep-dismiss">No thanks</button>
          </div>

          <div id="ep-step-2" class="ep-step">
            <div class="ep-progress" aria-hidden="true">
              <span class="ep-dot ep-dot-active"></span><span class="ep-dot ep-dot-active"></span> Step 2 of 2
            </div>
            <span class="ep-badge">Zelyte · Early Access</span>
            <h2 class="ep-headline" id="ep-headline-2">Great choice.</h2>
            <p class="ep-sub">Drop your email and be the first in line when we launch. Early supporters get launch-day pricing.</p>
            <p class="ep-social">Join the early supporters already on the list.</p>
            <form id="ep-form" class="ep-form" novalidate>
              <input type="email" id="ep-email" class="ep-input" placeholder="Your email address" required autocomplete="email">
              <p id="ep-msg" class="ep-msg" aria-live="polite"></p>
              <button type="submit" id="ep-submit" class="ep-submit">Get Early Access →</button>
            </form>
            <ul class="ep-trust">
              <li>Zero sugar</li>
              <li>Electrolytes + caffeine</li>
              <li>No spam, unsubscribe anytime</li>
            </ul>
            <button class="ep-back" id="ep-back">← Change flavor</button>
          </div>

          <div id="ep-step-success" class="ep-step">
            <div class="ep-success">
              <div class="ep-success-check" aria-hidden="true">✓</div>
              <h2 class="ep-headline" id="ep-headline-success">You're on the list!</h2>
              <p class="ep-sub" id="ep-success-sub">We'll email you the moment we launch.</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  `;
  document.body.appendChild(wrap);

  // ── References ─────────────────────────────────────────────────────────────
  const overlay    = document.getElementById('ep-overlay');
  const closeBtn   = document.getElementById('ep-close');
  const dismissBtn = document.getElementById('ep-dismiss');
  const backBtn    = document.getElementById('ep-back');
  const step1      = document.getElementById('ep-step-1');
  const step2      = document.getElementById('ep-step-2');
  const stepDone   = document.getElementById('ep-step-success');
  const headline2  = document.getElementById('ep-headline-2');
  const successSub = document.getElementById('ep-success-sub');
  const form       = document.getElementById('ep-form');
  const emailInp   = document.getElementById('ep-email');
  const submitBtn  = document.getElementById('ep-submit');
  const msgEl     = document.getElementById('ep-msg');

  let selectedFlavor = null;

  const FLAVOR_COPY = {
    'crispy-mint': {
      headline: 'Great choice — Crispy Mint is first out the door.',
      success:  "We'll email you the moment Crispy Mint drops."
    },
    'black-cherry': {
      headline: 'Bold pick. Black Cherry is coming in hot.',
      success:  "We'll email you the moment Black Cherry drops."
    },
    'both': {
      headline: "A true fan. You'll get first dibs on both.",
      success:  "We'll email you the moment both flavors drop."
    }
  };

  // ── Steps ──────────────────────────────────────────────────────────────────
  function showStep(el, labelledBy) {
    [step1, step2, stepDone].forEach(s => s.classList.remove('ep-step-active'));
    el.classList.add('ep-step-active');
    overlay.setAttribute('aria-labelledby', labelledBy);
  }

  // ── Open / close ───────────────────────────────────────────────────────────
  function open() {
    overlay.style.display = 'flex';
    requestAnimationFrame(() => {
      requestAnimationFrame(() => overlay.classList.add('ep-open'));
    });
    setTimeout(() => {
      const first = step1.querySelector('.ep-flavor');
      if (first) first.focus();
    }, 300);
  }

  function close() {
    overlay.classList.remove('ep-open');
    setTimeout(() => overlay.remove(), 300);
  }

  function showMsg(text, type) {
    msgEl.textContent = text;
    msgEl.className = 'ep-msg' + (type ? ' ' + type : '');
  }

  // ── Trigger after delay ────────────────────────────────────────────────────
  overlay.style.display = 'none';

  async function maybeOpen() {
    if (localStorage.getItem('ep_signed_up')) return;
    if (window._sb) {
      const { data: { session } } = await window._sb.auth.getSession();
      if (session) return;
    }
    if (sessionStorage.getItem('ep_seen')) return;
    sessionStorage.setItem('ep_seen', '1');
    setTimeout(open, DELAY_MS);
  }
  maybeOpen();

  // ── Events ─────────────────────────────────────────────────────────────────
  closeBtn.addEventListener('click', close);
  dismissBtn.addEventListener('click', close);

  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) close();
  });

  document.addEventListener('keydown', function (e) {
    if (!overlay.classList.contains('ep-open')) return;
    if (e.key === 'Escape') { close(); return; }
    if (e.key === 'Tab') {
      const focusables = overlay.querySelectorAll(
        'button:not([disabled]), input:not([disabled])'
      );
      const visible = Array.from(focusables).filter(el => el.offsetParent !== null);
      if (!visible.length) return;
      const first = visible[0];
      const last  = visible[visible.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });

  step1.querySelectorAll('.ep-flavor').forEach(btn => {
    btn.addEventListener('click', function () {
      selectedFlavor = btn.dataset.flavor;
      btn.classList.add('ep-flavor-selected');
      const copy = FLAVOR_COPY[selectedFlavor];
      headline2.textContent  = copy.headline;
      successSub.textContent = copy.success;
      setTimeout(() => {
        btn.classList.remove('ep-flavor-selected');
        showStep(step2, 'ep-headline-2');
        setTimeout(() => emailInp.focus(), 100);
      }, 250);
    });
  });

  backBtn.addEventListener('click', function () {
    showStep(step1, 'ep-headline-1');
  });

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    const email = emailInp.value.trim();
    if (!email) return;

    submitBtn.disabled    = true;
    submitBtn.textContent = 'Please wait…';
    showMsg('');

    const { alreadySubscribed, error } = await window._zelyteSubmitEmail(
      email, 'popup', { flavor_preference: selectedFlavor }
    );

    submitBtn.disabled    = false;
    submitBtn.textContent = 'Get Early Access →';

    if (error) {
      showMsg('Something went wrong — please try again.', 'error');
      return;
    }

    localStorage.setItem('ep_signed_up', '1');
    if (alreadySubscribed) {
      successSub.textContent = "You're already on the list — we'll be in touch soon.";
    }
    showStep(stepDone, 'ep-headline-success');
    setTimeout(close, 2500);
  });
})();
