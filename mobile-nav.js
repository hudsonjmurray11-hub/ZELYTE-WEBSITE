// Mobile nav — injects an accessible hamburger menu that mirrors the desktop
// .nav-links. The hamburger only appears when .nav-links is hidden, so it
// automatically matches each page's own breakpoint (600px–960px) without
// hardcoding one. Self-contained; no dependencies.

(function () {
  'use strict';

  function init() {
    var header = document.querySelector('.header-bar');
    if (!header) return;
    var navLinks = header.querySelector('.nav-links');
    if (!navLinks) return;
    var links = navLinks.querySelectorAll('a');
    if (!links.length) return;

    // Match the page's nav text colour for the closed (top-of-page) state.
    var baseColor = getComputedStyle(links[0]).color || '#0d2357';

    // ── Styles ────────────────────────────────────────────────────────────
    var style = document.createElement('style');
    style.textContent =
      // When the hamburger is active, widen the bar so logo + buttons + toggle
      // fit (content-page headers are only 65% wide by default).
      '.header-bar.mnav-active{width:92%;max-width:none;padding-left:16px;padding-right:16px;}' +
      '.header-bar.mnav-active .mnav-toggle{margin-left:auto;}' +
      '.mnav-toggle{display:none;align-items:center;justify-content:center;' +
      'flex-direction:column;gap:5px;width:38px;height:38px;margin-left:8px;' +
      'background:none;border:none;cursor:pointer;padding:8px;z-index:1002;flex-shrink:0;}' +
      '.mnav-toggle span{display:block;width:22px;height:2px;border-radius:2px;' +
      'background:' + baseColor + ';transition:transform .25s,opacity .2s;}' +
      '.header-bar.scrolled .mnav-toggle span{background:#1a73e8;}' +
      '.mnav-toggle.open span{background:#1a73e8;}' +
      '.mnav-toggle.open span:nth-child(1){transform:translateY(7px) rotate(45deg);}' +
      '.mnav-toggle.open span:nth-child(2){opacity:0;}' +
      '.mnav-toggle.open span:nth-child(3){transform:translateY(-7px) rotate(-45deg);}' +
      '.mnav-overlay{position:fixed;inset:0;background:rgba(6,12,28,0.45);' +
      'backdrop-filter:blur(2px);-webkit-backdrop-filter:blur(2px);z-index:1000;' +
      'opacity:0;pointer-events:none;transition:opacity .25s;}' +
      '.mnav-overlay.open{opacity:1;pointer-events:auto;}' +
      '.mnav-menu{position:fixed;top:0;left:0;right:0;z-index:1001;' +
      'background:#fff;padding:74px 22px 24px;display:flex;flex-direction:column;' +
      'box-shadow:0 18px 50px rgba(13,35,87,0.18);' +
      'transform:translateY(-100%);transition:transform .3s cubic-bezier(.32,0,.2,1);}' +
      '.mnav-menu.open{transform:translateY(0);}' +
      '.mnav-close{position:absolute;top:16px;right:18px;width:36px;height:36px;' +
      'display:flex;align-items:center;justify-content:center;background:rgba(13,35,87,0.06);' +
      'border:none;border-radius:9px;color:#0d2357;font-size:20px;line-height:1;cursor:pointer;' +
      'transition:background .15s;}' +
      '.mnav-close:hover,.mnav-close:focus{background:rgba(13,35,87,0.12);outline:none;}' +
      '.mnav-menu a{text-decoration:none;color:#0d2357;font-weight:600;' +
      'font-size:1.08rem;padding:15px 8px;border-bottom:1px solid rgba(13,35,87,0.08);}' +
      '.mnav-menu a:last-child{border-bottom:none;}' +
      '.mnav-menu a:hover,.mnav-menu a:focus{color:#1a73e8;outline:none;}' +
      '.mnav-menu a.active{color:#1a73e8;}' +
      '@media (prefers-reduced-motion: reduce){' +
      '.mnav-toggle span,.mnav-overlay,.mnav-menu{transition:none;}}';
    document.head.appendChild(style);

    // ── Hamburger button ──────────────────────────────────────────────────
    var toggle = document.createElement('button');
    toggle.className = 'mnav-toggle';
    toggle.type = 'button';
    toggle.setAttribute('aria-label', 'Open menu');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-controls', 'mnav-menu');
    toggle.innerHTML = '<span></span><span></span><span></span>';
    header.appendChild(toggle);

    // ── Overlay + menu ────────────────────────────────────────────────────
    var overlay = document.createElement('div');
    overlay.className = 'mnav-overlay';

    var menu = document.createElement('nav');
    menu.id = 'mnav-menu';
    menu.className = 'mnav-menu';
    menu.setAttribute('aria-label', 'Mobile navigation');

    var closeBtn = document.createElement('button');
    closeBtn.className = 'mnav-close';
    closeBtn.type = 'button';
    closeBtn.setAttribute('aria-label', 'Close menu');
    closeBtn.innerHTML = '&#10005;';
    menu.appendChild(closeBtn);

    links.forEach(function (a) {
      var link = document.createElement('a');
      link.href = a.getAttribute('href');
      link.textContent = a.textContent;
      if (a.classList.contains('active')) link.classList.add('active');
      menu.appendChild(link);
    });

    document.body.appendChild(overlay);
    document.body.appendChild(menu);

    function isOpen() { return menu.classList.contains('open'); }

    function open() {
      menu.classList.add('open');
      overlay.classList.add('open');
      toggle.classList.add('open');
      toggle.setAttribute('aria-expanded', 'true');
      toggle.setAttribute('aria-label', 'Close menu');
      var first = menu.querySelector('a');
      if (first) setTimeout(function () { first.focus(); }, 60);
    }

    function close(returnFocus) {
      menu.classList.remove('open');
      overlay.classList.remove('open');
      toggle.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Open menu');
      if (returnFocus) toggle.focus();
    }

    toggle.addEventListener('click', function () { isOpen() ? close(true) : open(); });
    closeBtn.addEventListener('click', function () { close(true); });
    overlay.addEventListener('click', function () { close(false); });
    menu.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') close(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && isOpen()) close(true);
    });

    // Show the hamburger only while the desktop nav is hidden.
    function sync() {
      var hidden = getComputedStyle(navLinks).display === 'none';
      toggle.style.display = hidden ? 'inline-flex' : 'none';
      header.classList.toggle('mnav-active', hidden);
      if (!hidden && isOpen()) close(false);
    }
    sync();

    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(sync, 120);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
