/* ============================================================
   ScanMark – App Logic
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

    /* -------- NAV: Scroll effect -------- */
    const nav = document.getElementById('main-nav');
    const onScroll = () => {
        nav.classList.toggle('scrolled', window.scrollY > 24);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // run once on load

    /* -------- NAV: Mobile hamburger / drawer -------- */
    const hamburger = document.getElementById('nav-hamburger');
    const drawer    = document.getElementById('nav-drawer');

    const openDrawer = () => {
        hamburger.classList.add('open');
        drawer.classList.add('open');
        hamburger.setAttribute('aria-expanded', 'true');
        document.body.style.overflow = 'hidden';
    };

    const closeDrawer = () => {
        hamburger.classList.remove('open');
        drawer.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
    };

    hamburger?.addEventListener('click', () => {
        drawer.classList.contains('open') ? closeDrawer() : openDrawer();
    });

    // Close drawer on any link click inside it
    drawer?.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', closeDrawer);
    });

    // Close on Escape key
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && drawer?.classList.contains('open')) closeDrawer();
    });

    /* -------- HERO: 3D tilt on screenshot -------- */
    const screenshot = document.getElementById('hero-screenshot');
    const visualWrap = screenshot?.closest('.hero-visual');

    if (visualWrap && screenshot && window.matchMedia('(hover: hover)').matches) {
        visualWrap.addEventListener('mousemove', e => {
            const rect = visualWrap.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top  + rect.height / 2;
            const rx = ((e.clientY - cy) / (rect.height / 2)) * -5;
            const ry = ((e.clientX - cx) / (rect.width  / 2)) *  8;
            screenshot.style.transform = `perspective(1200px) rotateX(${rx}deg) rotateY(${ry}deg) scale(1.01)`;
        });

        visualWrap.addEventListener('mouseleave', () => {
            screenshot.style.transform = 'perspective(1200px) rotateY(-8deg) rotateX(3deg)';
        });
    }

    /* -------- PRICING: Billing toggle -------- */
    const billingToggle  = document.getElementById('billing-toggle');
    const toggleMonthly  = document.getElementById('toggle-monthly');
    const toggleYearly   = document.getElementById('toggle-yearly');
    const amounts        = document.querySelectorAll('.amount[data-monthly]');

    const updatePricing = (isYearly) => {
        amounts.forEach(el => {
            const next = el.nextElementSibling; // .period span

            // Animate out
            el.style.transition = 'transform 0.18s ease, opacity 0.18s ease';
            el.style.transform  = 'translateY(-8px)';
            el.style.opacity    = '0';

            setTimeout(() => {
                el.textContent = isYearly ? el.dataset.yearly : el.dataset.monthly;
                if (next && next.classList.contains('period')) {
                    next.textContent = isYearly ? '/yr' : '/mo';
                }
                // Animate in
                el.style.transform = 'translateY(6px)';
                requestAnimationFrame(() => {
                    el.style.transition = 'transform 0.22s var(--ease-spring), opacity 0.18s ease';
                    el.style.transform  = 'translateY(0)';
                    el.style.opacity    = '1';
                });
            }, 190);
        });

        toggleMonthly?.classList.toggle('active', !isYearly);
        toggleYearly?.classList.toggle('active',  isYearly);
    };

    billingToggle?.addEventListener('change', function () {
        updatePricing(this.checked);
    });

    // Allow clicking the label text to toggle
    toggleMonthly?.addEventListener('click', () => {
        if (billingToggle) { billingToggle.checked = false; updatePricing(false); }
    });
    toggleYearly?.addEventListener('click', () => {
        if (billingToggle) { billingToggle.checked = true; updatePricing(true); }
    });

    /* -------- FAQ: Accordion -------- */
    document.querySelectorAll('.faq-question').forEach(btn => {
        btn.addEventListener('click', () => {
            const item   = btn.closest('.faq-item');
            const isOpen = item.classList.contains('open');

            // Close all first
            document.querySelectorAll('.faq-item.open').forEach(openItem => {
                openItem.classList.remove('open');
                openItem.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
            });

            // Open clicked (unless it was already open)
            if (!isOpen) {
                item.classList.add('open');
                btn.setAttribute('aria-expanded', 'true');
            }
        });
    });

    /* -------- SCROLL ANIMATIONS: Intersection Observer -------- */
    const animatedEls = document.querySelectorAll('[data-animate]');

    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.12,
            rootMargin: '0px 0px -40px 0px'
        });

        animatedEls.forEach(el => observer.observe(el));
    } else {
        // Fallback for older browsers
        animatedEls.forEach(el => el.classList.add('visible'));
    }

    /* -------- SMOOTH SCROLL: Internal anchor links -------- */
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const target = document.querySelector(this.getAttribute('href'));
            if (!target) return;
            e.preventDefault();
            const offset = 80; // nav height
            const top = target.getBoundingClientRect().top + window.scrollY - offset;
            window.scrollTo({ top, behavior: 'smooth' });
        });
    });

    /* -------- COUNTER ANIMATION: Stats numbers -------- */
    const countEls = document.querySelectorAll('.stat-number');

    const animateCount = (el) => {
        const text     = el.textContent;
        const match    = text.match(/([\d,]+)/);
        if (!match) return;

        const numStr   = match[0].replace(',', '');
        const target   = parseFloat(numStr);
        const suffix   = el.querySelector('span')?.textContent || '';
        const prefix   = text.replace(match[0], '').replace(suffix, '').trim();

        const isDecimal = target < 10 && text.includes('.');
        const duration  = 1200;
        const start     = performance.now();

        const step = (now) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased    = 1 - Math.pow(1 - progress, 3); // ease-out cubic
            const current  = target * eased;
            const display  = isDecimal
                ? current.toFixed(1)
                : Math.floor(current).toLocaleString();
            el.innerHTML = `${prefix}${display}<span>${suffix}</span>`;
            if (progress < 1) requestAnimationFrame(step);
        };

        requestAnimationFrame(step);
    };

    if ('IntersectionObserver' in window) {
        const counterObs = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateCount(entry.target);
                    counterObs.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });

        countEls.forEach(el => counterObs.observe(el));
    }

});