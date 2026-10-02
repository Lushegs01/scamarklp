/* ============================================================
   ScanMark landing — interactions and motion
   No libraries. One rAF loop drives every scroll scene; it
   sleeps when nothing is moving.
   ============================================================ */

(() => {
    'use strict';

    const root = document.documentElement;
    const MOTION = root.classList.contains('js');

    const $ = (sel, scope = document) => scope.querySelector(sel);
    const $$ = (sel, scope = document) => [...scope.querySelectorAll(sel)];
    const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
    const lerp = (a, b, t) => a + (b - a) * t;
    const span = (p, a, b) => clamp((p - a) / (b - a));
    const easeOut = (t) => 1 - Math.pow(1 - t, 3);
    const easeInOut = (t) => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    const rand = (a, b) => a + Math.random() * (b - a);
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));

    let vw = innerWidth;
    let vh = innerHeight;

    /* ========================================================
       ALWAYS ON: navigation, menu, FAQ, pricing, counters
       ======================================================== */

    const nav = $('#nav');
    const hero = $('#hero');
    const burger = $('#nav-burger');
    const drawer = $('#nav-drawer');

    const setDrawer = (open) => {
        burger.setAttribute('aria-expanded', String(open));
        burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
        drawer.hidden = !open;
        document.body.style.overflow = open ? 'hidden' : '';
        if (open) nav.classList.remove('is-hidden');
    };

    $$('a', drawer).forEach((a, i) => {
        a.style.setProperty('--i', i);
        a.addEventListener('click', () => setDrawer(false));
    });
    burger.addEventListener('click', () => setDrawer(drawer.hidden));
    addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !drawer.hidden) {
            setDrawer(false);
            burger.focus();
        }
    });

    // Visible at the top and through the hero; tucks away while reading
    // downwards, comes back the moment you scroll up.
    let lastY = scrollY;
    const updateNav = () => {
        const y = scrollY;
        const heroEnd = hero.offsetTop + hero.offsetHeight - vh;
        const inHero = y < heroEnd - 10;
        nav.classList.toggle('is-solid', !inHero && y > 40);
        nav.classList.toggle('is-hidden', !inHero && y > lastY + 2 && drawer.hidden);
        if (y < lastY - 2) nav.classList.remove('is-hidden');
        lastY = y;
    };

    // Highlight the section in view
    const navLinks = $$('.nav-links a[href^="#"]');
    if ('IntersectionObserver' in window) {
        const spy = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                const id = entry.target.id === 'hero' ? 'top' : entry.target.id;
                navLinks.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === `#${id}`));
            });
        }, { rootMargin: '-45% 0px -50% 0px' });
        ['hero', 'features', 'how-it-works', 'pricing', 'faq'].forEach((id) => {
            const el = document.getElementById(id);
            if (el) spy.observe(el);
        });
    }

    // FAQ accordion: one open at a time
    $$('.faq-q').forEach((btn) => {
        btn.addEventListener('click', () => {
            const item = btn.closest('.faq-item');
            const wasOpen = item.classList.contains('open');
            $$('.faq-item.open').forEach((open) => {
                open.classList.remove('open');
                $('.faq-q', open).setAttribute('aria-expanded', 'false');
            });
            if (!wasOpen) {
                item.classList.add('open');
                btn.setAttribute('aria-expanded', 'true');
            }
        });
    });

    // Pricing period
    const amounts = $$('.amount[data-monthly]');
    $$('.billing-opt').forEach((btn) => {
        btn.addEventListener('click', () => {
            const yearly = btn.dataset.period === 'yearly';
            $$('.billing-opt').forEach((b) => {
                const on = b === btn;
                b.classList.toggle('is-on', on);
                b.setAttribute('aria-pressed', String(on));
            });
            amounts.forEach((el) => {
                const next = yearly ? el.dataset.yearly : el.dataset.monthly;
                const period = el.nextElementSibling;
                if (!MOTION) {
                    el.textContent = next;
                    period.textContent = yearly ? '/yr' : '/mo';
                    return;
                }
                el.style.opacity = '0';
                el.style.transform = 'translateY(-10px)';
                setTimeout(() => {
                    el.textContent = next;
                    period.textContent = yearly ? '/yr' : '/mo';
                    el.style.transform = 'translateY(10px)';
                    requestAnimationFrame(() => {
                        el.style.opacity = '1';
                        el.style.transform = '';
                    });
                }, 200);
            });
        });
    });

    // In-page links land below the fixed bar
    $$('a[href^="#"]').forEach((a) => {
        a.addEventListener('click', (e) => {
            const id = a.getAttribute('href');
            const target = id === '#top' ? document.body : $(id);
            if (!target) return;
            e.preventDefault();
            const top = id === '#top' ? 0 : target.getBoundingClientRect().top + scrollY - 70;
            scrollTo({ top, behavior: MOTION ? 'smooth' : 'auto' });
        });
    });

    addEventListener('scroll', updateNav, { passive: true });
    updateNav();

    if (!MOTION) return;

    /* ========================================================
       MOTION
       ======================================================== */

    // Wrap every word of a heading in .rv so it can be revealed in a stagger.
    // Elements that are already a visual unit (icons, badges) become one .rv.
    const splitWords = (el) => {
        let i = 0;
        const walk = (node) => {
            [...node.childNodes].forEach((child) => {
                if (child.nodeType === Node.TEXT_NODE) {
                    const parts = child.textContent.split(/(\s+)/);
                    if (!child.textContent.trim()) return;
                    const frag = document.createDocumentFragment();
                    parts.forEach((part) => {
                        if (!part) return;
                        if (/^\s+$/.test(part)) {
                            frag.appendChild(document.createTextNode(' '));
                        } else {
                            const s = document.createElement('span');
                            s.className = 'rv rw';
                            s.style.setProperty('--i', i++);
                            s.textContent = part;
                            frag.appendChild(s);
                        }
                    });
                    child.replaceWith(frag);
                } else if (child.nodeType === Node.ELEMENT_NODE) {
                    if (child.matches('.inline-ico, .badges')) {
                        child.classList.add('rv');
                        child.style.setProperty('--i', i++);
                    } else if (child.tagName !== 'BR') {
                        walk(child);
                    }
                }
            });
        };
        walk(el);
    };

    /* ---------- Scroll scenes: shared plumbing ---------- */

    // Progress through a pinned scene, 0 at its top, 1 when it lets go.
    const sceneProgress = (el) => {
        const r = el.getBoundingClientRect();
        const travel = r.height - vh;
        return travel > 0 ? clamp(-r.top / travel) : 0;
    };
    const isNear = (el) => {
        const r = el.getBoundingClientRect();
        return r.bottom > -vh * .5 && r.top < vh * 1.5;
    };

    /* ========================================================
       HERO
       ======================================================== */

    const heroOne = $('#hero-one');
    const heroTwo = $('#hero-two');
    const title = $('#hero-title');
    const train = $('#icon-train');
    const icons = [...train.children];
    const cards = $$('#deck .card');
    icons.forEach((ic) => ic.classList.add('pre'));

    // Letters
    const text = title.textContent.trim();
    title.setAttribute('aria-label', text);
    title.textContent = '';
    const letterBox = document.createElement('span');
    letterBox.setAttribute('aria-hidden', 'true');
    const chars = [];
    text.split(' ').forEach((word, wi, words) => {
        const w = document.createElement('span');
        w.className = 'word';
        [...word].forEach((c) => {
            const ch = document.createElement('span');
            ch.className = 'ch';
            ch.textContent = c;
            w.appendChild(ch);
            chars.push(ch);
        });
        letterBox.appendChild(w);
        if (wi < words.length - 1) letterBox.appendChild(document.createTextNode(' '));
    });
    title.appendChild(letterBox);

    splitWords($('.hero-two-title'));
    // The supporting lines reveal as single units after the title words
    const twoTitleWords = $$('.hero-two-title .rv').length;
    ['.live-tag', '.hero-sub', '.hero-two .cta-row'].forEach((sel, k) => {
        const el = $(sel, heroTwo);
        el.classList.add('rv');
        el.style.setProperty('--i', sel === '.live-tag' ? 0 : twoTitleWords + k * 2);
    });

    // Where the icon train sits: just right of the last letter written
    const placeTrain = (lastIndex, glide = true) => {
        const box = heroOne.getBoundingClientRect();
        const ref = chars[Math.max(0, lastIndex)];
        const r = ref.getBoundingClientRect();
        const t = train.getBoundingClientRect();
        const x = lastIndex < 0 ? r.left - box.left : r.right - box.left + r.height * .06;
        const y = r.top - box.top + (r.height - t.height) / 2;
        const prevY = parseFloat(train.style.getPropertyValue('--ty')) || 0;
        // A jump to the next line should not slide diagonally across the title
        train.classList.toggle('no-glide', !glide || Math.abs(prevY - y) > 4);
        train.style.setProperty('--tx', `${x}px`);
        train.style.setProperty('--ty', `${y}px`);
    };

    // The deck's three arrangements, per card: [x, y, rotation, scale]
    //   A  fanned along the bottom edge (the hero)
    //   B  scattered round the edges (as the second headline arrives)
    //   C  on a wide arc that turns as you keep scrolling
    const FAN = [
        [-2.05, .22, -21], [-1.38, .05, -13], [-.69, -.06, -6], [0, -.11, 1], [.69, -.05, 8],
        [1.37, .08, 15], [2.02, .25, 22], [-.36, .95, -6], [.36, .95, 6],
    ];
    const SCATTER = [
        [-.4, -.24, -12], [-.18, -.37, 8], [.2, -.37, -7], [.41, -.2, 13], [.43, .24, -9],
        [.17, .44, 10], [-.17, .44, -13], [-.42, .27, 8], [.02, .56, -5],
    ];

    let cardW = 0;
    let cardH = 0;
    const measureDeck = () => {
        cardW = cards[0].offsetWidth;
        cardH = cards[0].offsetHeight;
    };

    const deckState = (i, p, intro) => {
        const w = cardW;
        const h = cardH;
        const base = vh * .5 - h * .02;

        // A
        const f = FAN[i];
        let x = f[0] * w * .92;
        let y = base + f[1] * w;
        let r = f[2];
        let s = 1;

        // Rise in on load
        const k = easeOut(intro);
        y += (1 - k) * (vh * .9 + i * 20);
        r *= lerp(.4, 1, k);

        // A -> B
        const tab = easeInOut(span(p, .05, .3));
        if (tab > 0) {
            const b = SCATTER[i];
            x = lerp(x, b[0] * vw, tab);
            y = lerp(y, b[1] * vh, tab);
            r = lerp(r, b[2], tab);
            s = lerp(s, vw < 760 ? .7 : .8, tab);
        }

        // B -> C, then keep turning
        const tbc = easeInOut(span(p, .38, .6));
        if (tbc > 0) {
            const R = Math.max(vw * .95, w * 5.2);
            const step = Math.asin(clamp((w * 1.06) / R, 0, 1)) * 180 / Math.PI;
            const turn = span(p, .6, 1) * 2.6;
            const a = (i - 4 + .5 - turn) * step;
            const rad = a * Math.PI / 180;
            const cy = vh * .5 + h * .74 + R;
            const cx = R * Math.sin(rad);
            const cyy = cy - R * Math.cos(rad) - vh * .5;
            x = lerp(x, cx, tbc);
            y = lerp(y, cyy, tbc);
            r = lerp(r, a, tbc);
            s = lerp(s, 1.04, tbc);
        }
        return [x, y, r, s];
    };

    const renderHero = (p, introAt) => {
        const t1 = span(p, 0, .16);
        heroOne.style.opacity = String(1 - t1);
        heroOne.style.transform = `translate3d(0, ${-t1 * 12}vh, 0) scale(${1 - t1 * .08})`;
        heroOne.style.visibility = t1 >= 1 ? 'hidden' : '';

        const t2 = span(p, .22, .32);
        const tbc = easeInOut(span(p, .38, .6));
        heroTwo.style.opacity = String(t2);
        heroTwo.style.transform = `translate(-50%, ${lerp(vh * .23, 0, tbc) + (1 - t2) * 30}px)`;
        heroTwo.classList.toggle('is-live', t2 > .4);

        const now = performance.now();
        cards.forEach((card, i) => {
            const intro = clamp((now - introAt - i * 70) / 1100);
            const [x, y, r, s] = deckState(i, p, intro);
            card.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) rotate(${r.toFixed(2)}deg) scale(${s.toFixed(3)})`;
        });
    };

    // The intro: a paper plane flies in, the icons line up behind it, then
    // they turn into the headline one letter at a time.
    let introAt = Infinity;   // Infinity: not started (cards wait below). -Infinity: skipped.
    let introRunning = false;

    const runIntro = async (fontsReady) => {
        if (scrollY > hero.offsetTop + vh * .3) {
            chars.forEach((c) => c.classList.add('on'));
            train.hidden = true;
            introAt = -Infinity;
            kick();
            return;
        }
        introRunning = true;
        placeTrain(-1, false);
        train.classList.add('ready');

        introAt = performance.now() + 300;
        kick();

        await wait(250);
        const plane = icons[0];
        plane.classList.remove('pre');
        plane.animate([
            { transform: 'translate(-55vw, 38vh) rotate(38deg) scale(1.5)', opacity: 0 },
            { transform: 'translate(-26vw, 4vh) rotate(-8deg) scale(1.25)', opacity: 1, offset: .55 },
            { transform: 'none', opacity: 1 },
        ], { duration: 1150, easing: 'cubic-bezier(.3,.7,.2,1)' });
        await wait(1000);

        for (let i = 1; i < icons.length; i++) {
            icons[i].classList.remove('pre');
            await wait(85);
        }
        await wait(380);

        // Letters are measured, so they wait for the real font; the plane
        // and the deck above never do, so a slow network never shows a blank hero.
        await fontsReady;
        placeTrain(-1);
        await wait(120);

        let eaten = 0;
        for (let k = 0; k < chars.length; k++) {
            chars[k].classList.add('on');
            const due = Math.min(icons.length, Math.round(((k + 1) / chars.length) * icons.length));
            while (eaten < due) icons[eaten++].classList.add('gone');
            placeTrain(k);
            await wait(chars[k].nextSibling ? 62 : 110);
        }
        await wait(500);
        train.hidden = true;
        introRunning = false;
    };

    /* ========================================================
       PANEL
       ======================================================== */

    const panelScene = $('#panel');
    const panel = $('#panel-clip');
    const phone = $('#phone');
    $$('.panel-text', panel).forEach((line) => {
        splitWords(line);
        $$('.rv', line).forEach((w) => w.classList.replace('rv', 'pw'));
    });

    const renderPanel = (p) => {
        const g = easeInOut(span(p, 0, .55));
        const startW = vw < 760 ? .82 : .4;
        const startH = vw < 760 ? .5 : .5;
        const ix = ((1 - lerp(startW, 1, g)) / 2) * vw;
        const iy = ((1 - lerp(startH, 1, g)) / 2) * vh;
        panel.style.setProperty('--ix', `${ix.toFixed(1)}px`);
        panel.style.setProperty('--it', `${iy.toFixed(1)}px`);
        panel.style.setProperty('--ib', `${iy.toFixed(1)}px`);
        panel.style.setProperty('--pr', `${lerp(28, 0, g).toFixed(1)}px`);
        panel.style.setProperty('--ps', lerp(1.35, 1.02, g).toFixed(3));
        phone.style.setProperty('--ry', `${lerp(-18, 14, p).toFixed(2)}deg`);
        phone.style.setProperty('--rx', `${lerp(7, -3, p).toFixed(2)}deg`);
        panel.classList.toggle('text-on', p > .5);
        panel.classList.toggle('toast-on', p > .6);
    };

    /* ========================================================
       STORY: the sentence slides sideways, words drop in
       ======================================================== */

    const story = $('#story');
    const track = $('#track');

    const spoken = document.createElement('p');
    spoken.className = 'sr-only';
    spoken.textContent = $$('.w, .tag.inline', track).map((el) => el.textContent.trim()).join(' ');
    track.before(spoken);
    track.setAttribute('aria-hidden', 'true');

    $$('.w', track).forEach((w) => {
        const letters = [...w.textContent];
        w.textContent = '';
        letters.forEach((c, i) => {
            const l = document.createElement('span');
            l.className = 'l';
            l.textContent = c === ' ' ? ' ' : c;
            l.style.setProperty('--i', i);
            l.style.setProperty('--dy', `${rand(-.7, .7).toFixed(2)}em`);
            l.style.setProperty('--dr', `${rand(-25, 25).toFixed(1)}deg`);
            w.appendChild(l);
        });
    });

    const storyBits = $$('.w, .tag, .sticker', track).map((el) => ({ el, at: 0 }));
    let storyTravel = 0;

    const measureStory = () => {
        track.style.transform = 'translate3d(0,0,0)';
        const base = track.getBoundingClientRect().left;
        storyBits.forEach((bit) => {
            const r = bit.el.getBoundingClientRect();
            bit.at = r.left - base + r.width * .3;
        });
        storyTravel = Math.max(0, track.scrollWidth - vw * .8);
        story.style.height = `${storyTravel + vh}px`;
    };

    const renderStory = (p) => {
        const x = -storyTravel * p;
        track.style.transform = `translate3d(${x.toFixed(1)}px, 0, 0)`;
        const line = vw * .88;
        storyBits.forEach((bit) => {
            bit.el.classList.toggle('in', bit.at + x < line);
        });
    };

    /* ========================================================
       NOTES: parallax drift once they have landed
       ======================================================== */

    const notes = $$('.note');
    const renderNotes = () => {
        if (vw < 760) return;
        notes.forEach((n) => {
            const r = n.getBoundingClientRect();
            const off = (r.top + r.height / 2 - vh / 2) * parseFloat(n.dataset.speed || 0);
            n.style.setProperty('--py', `${(-off).toFixed(1)}px`);
        });
    };

    /* ========================================================
       REVEALS
       ======================================================== */

    $$('[data-words]').forEach(splitWords);

    const groups = new Map();
    $$('[data-pop]').forEach((el) => {
        const siblings = groups.get(el.parentElement) || [];
        siblings.push(el);
        groups.set(el.parentElement, siblings);
        el.style.setProperty('--rot', `${rand(-5, 5).toFixed(1)}deg`);
        el.style.setProperty('--delay', `${((siblings.length - 1) % 3) * 90}ms`);
    });
    notes.forEach((n, i) => n.style.setProperty('--delay', `${i * 140}ms`));

    const countUp = (el) => {
        const to = Number(el.dataset.to);
        const suffix = el.dataset.suffix || '';
        const start = performance.now();
        const tick = (now) => {
            const t = clamp((now - start) / 1300);
            el.textContent = `${Math.round(to * easeOut(t))}${suffix}`;
            if (t < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    };

    const revealer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const el = entry.target;
            el.classList.add('is-in');
            const count = el.matches('.count') ? el : $('.count', el);
            if (count) countUp(count);
            revealer.unobserve(el);
        });
    }, { threshold: .15, rootMargin: '0px 0px -8% 0px' });
    $$('[data-pop], [data-words], .note').forEach((el) => revealer.observe(el));

    /* ========================================================
       THE LOOP
       ======================================================== */

    // Each scene eases toward where the scrollbar says it should be, which
    // gives the weighty, smoothed feel without taking over the scroll itself.
    const scenes = [
        { el: hero, now: 0, render: (p) => renderHero(p, introAt) },
        { el: panelScene, now: 0, render: renderPanel },
        { el: story, now: 0, render: renderStory },
    ];

    let running = false;
    let first = true;

    const frame = () => {
        let moving = introRunning;
        scenes.forEach((s) => {
            const target = sceneProgress(s.el);
            if (!isNear(s.el) && !first) {
                s.now = target;
                return;
            }
            const next = first ? target : s.now + (target - s.now) * .14;
            s.now = Math.abs(target - next) < .0004 ? target : next;
            if (s.now !== target) moving = true;
            s.render(s.now);
        });
        if (Number.isFinite(introAt) && performance.now() - introAt < 1100 + cards.length * 70) moving = true;
        renderNotes();
        first = false;
        if (moving) {
            requestAnimationFrame(frame);
        } else {
            running = false;
        }
    };

    function kick() {
        if (running) return;
        running = true;
        requestAnimationFrame(frame);
    }

    const onResize = () => {
        vw = innerWidth;
        vh = innerHeight;
        measureDeck();
        measureStory();
        first = true;
        kick();
    };

    addEventListener('scroll', kick, { passive: true });
    addEventListener('resize', onResize);

    measureDeck();
    measureStory();
    kick();

    // The font stylesheet is non-blocking, so wait for it to arrive and for
    // the headline face to load, but never longer than a moment.
    const fontCss = $('#font-css');
    const sheetIn = new Promise((resolve) => {
        if (!fontCss || fontCss.media === 'all') return resolve();
        fontCss.addEventListener('load', resolve, { once: true });
        fontCss.addEventListener('error', resolve, { once: true });
    });
    const fontsReady = Promise.race([
        sheetIn
            .then(() => document.fonts && document.fonts.load('500 64px "Inter Tight"'))
            .then(() => document.fonts && document.fonts.ready),
        wait(1600),
    ]);
    runIntro(fontsReady);
    fontsReady.then(() => {
        measureDeck();
        measureStory();
        first = true;
        kick();
    });
})();
