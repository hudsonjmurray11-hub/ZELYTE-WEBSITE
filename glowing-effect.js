(function () {
    'use strict';

    var SELECTORS = '.faq-item, .what-card, .benefit-card, .review-card, .ingredient-card, .detail-card, .step, .gradient-button';
    var PROXIMITY = 64;      // px — beam activates when mouse is within 64px of element edge
    var INACTIVE_ZONE = 0.7; // beam deactivates when mouse is within 35% of element center

    var els = Array.from(document.querySelectorAll(SELECTORS));
    if (!els.length) return;

    // Inject glow wrapper into each target element
    els.forEach(function (el) {
        if (getComputedStyle(el).position === 'static') {
            el.style.position = 'relative';
        }
        var wrapper = document.createElement('div');
        wrapper.className = 'glowing-wrapper';
        wrapper.innerHTML = '<div class="glowing-inner"></div>';
        el.prepend(wrapper);
        el.style.setProperty('--glow-start', '0');
        el.style.setProperty('--glow-active', '0');
    });

    var lastX = 0, lastY = 0, rafId = null;

    function update() {
        els.forEach(function (el) {
            var r = el.getBoundingClientRect();
            var cx = r.left + r.width * 0.5;
            var cy = r.top + r.height * 0.5;

            // Deactivate when mouse is too close to center
            var dist = Math.hypot(lastX - cx, lastY - cy);
            var inactiveR = 0.5 * Math.min(r.width, r.height) * INACTIVE_ZONE;
            if (dist < inactiveR) {
                el.style.setProperty('--glow-active', '0');
                return;
            }

            // Activate when mouse is within proximity of element bounds
            var active = lastX > r.left - PROXIMITY && lastX < r.right + PROXIMITY &&
                         lastY > r.top - PROXIMITY  && lastY < r.bottom + PROXIMITY;

            el.style.setProperty('--glow-active', active ? '1' : '0');
            if (!active) return;

            // Calculate angle from element center to mouse
            var angle = (180 * Math.atan2(lastY - cy, lastX - cx)) / Math.PI + 90;
            el.style.setProperty('--glow-start', String(angle));
        });
    }

    document.body.addEventListener('pointermove', function (e) {
        lastX = e.clientX;
        lastY = e.clientY;
        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(update);
    }, { passive: true });

    window.addEventListener('scroll', function () {
        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(update);
    }, { passive: true });
})();
