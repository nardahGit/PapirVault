(() => {
    const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const bySelector = (selector) => Array.from(document.querySelectorAll(selector));

    const detectPageProfile = () => {
        const pathName = window.location.pathname || '';
        const fileName = pathName.split('/').pop() || '';

        let family = 'shared';
        if (fileName.startsWith('Client')) family = 'client';
        if (fileName.startsWith('Issuer')) family = 'issuer';

        const page = fileName === 'index.html' ? 'landing' : 'standard';

        document.body.dataset.family = family;
        document.body.dataset.page = page;
    };

    const wireLandingHero = () => {
        if (document.body.dataset.page !== 'landing') return;

        const heroTitle = document.querySelector('h1.display-4');
        const heroTagline = document.querySelector('.hero-tagline');
        const heroDesc = document.querySelector('.hero-description-enhanced, .hero-description');

        heroTitle?.classList.add('hero-anim-title');
        heroTagline?.classList.add('hero-anim-tagline');
        heroDesc?.classList.add('hero-anim-desc');
    };

    const markAnimatedTargets = () => {
        const targets = bySelector([
            'main .card',
            'main .stat-widget',
            'main .stat-card',
            'main .table-responsive',
            '.security-panel',
            '.selection-card',
            '.login-web-card',
            '.signup-web-card',
            'main .row > [class*="col-"]',
            'main .feature-list li'
        ].join(','));

        targets.forEach((node, idx) => {
            if (node.classList.contains('anim-ready') || node.classList.contains('animate-up')) {
                return;
            }

            node.classList.add('anim-ready');
            const step = (idx % 5) + 1;
            node.classList.add(`anim-stagger-${step}`);
        });
    };

    const activateScrollReveal = () => {
        const revealNodes = bySelector('.anim-ready');
        if (!revealNodes.length) return;

        if (reduceMotion || !('IntersectionObserver' in window)) {
            revealNodes.forEach((node) => node.classList.add('is-in'));
            return;
        }

        const observer = new IntersectionObserver((entries, ob) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('is-in');
                ob.unobserve(entry.target);
            });
        }, { rootMargin: '0px 0px -10% 0px', threshold: 0.15 });

        revealNodes.forEach((node) => observer.observe(node));
    };

    const wireButtonRipples = () => {
        bySelector('.btn').forEach((button) => {
            button.addEventListener('pointerdown', (event) => {
                const rect = button.getBoundingClientRect();
                const x = event.clientX - rect.left;
                const y = event.clientY - rect.top;
                button.style.setProperty('--ripple-x', `${x}px`);
                button.style.setProperty('--ripple-y', `${y}px`);
                button.classList.remove('ripple-on');
                void button.offsetWidth;
                button.classList.add('ripple-on');
            }, { passive: true });
        });
    };

    const animateCounters = () => {
        const counters = bySelector('[id^="stat"], [id^="issuerStat"]');
        counters.forEach((counter) => {
            const finalValue = Number.parseInt((counter.textContent || '0').replace(/[^\d-]/g, ''), 10);
            if (!Number.isFinite(finalValue) || finalValue <= 0) return;

            if (reduceMotion) {
                counter.textContent = String(finalValue);
                return;
            }

            const duration = 900;
            const start = performance.now();
            const tick = (now) => {
                const p = Math.min((now - start) / duration, 1);
                const eased = 1 - Math.pow(1 - p, 3);
                const value = Math.round(finalValue * eased);
                counter.textContent = String(value);
                if (p < 1) requestAnimationFrame(tick);
            };

            counter.textContent = '0';
            requestAnimationFrame(tick);
        });
    };

    const wireInvalidFeedback = () => {
        bySelector('form').forEach((form) => {
            form.addEventListener('submit', () => {
                if (form.checkValidity()) return;
                form.classList.remove('anim-shake');
                void form.offsetWidth;
                form.classList.add('anim-shake');
            });
        });
    };

    document.addEventListener('DOMContentLoaded', () => {
        detectPageProfile();
        wireLandingHero();
        markAnimatedTargets();
        activateScrollReveal();
        wireButtonRipples();
        wireInvalidFeedback();

        // Delay to let data loaders populate dynamic stats on dashboard pages.
        window.setTimeout(animateCounters, 350);
    });
})();
