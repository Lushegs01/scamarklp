document.addEventListener('DOMContentLoaded', () => {
    document.addEventListener('DOMContentLoaded', () => {
    
    // --- New Mobile Menu Logic ---
    const hamburger = document.getElementById('hamburger');
    const mobileMenu = document.getElementById('mobile-menu');
    const links = document.querySelectorAll('.nav-links a, .nav-actions a'); // Select all links

    if (hamburger && mobileMenu) {
        hamburger.addEventListener('click', () => {
            // Toggle the menu visibility
            mobileMenu.classList.toggle('active');
            // Animate the hamburger icon to an 'X'
            hamburger.classList.toggle('open');
            
            // Prevent scrolling on the body when menu is open (Professional touch)
            document.body.style.overflow = mobileMenu.classList.contains('active') ? 'hidden' : 'auto';
        });

        // Close menu when a link is clicked
        links.forEach(link => {
            link.addEventListener('click', () => {
                mobileMenu.classList.remove('active');
                hamburger.classList.remove('open');
                document.body.style.overflow = 'auto';
            });
        });
    }

    // ... (Keep your existing scroll animation/observer code below) ...
});
   
    // 1. Scroll Animations (The "Senior Dev" way using Intersection Observer)
    const observerOptions = {
        threshold: 0.1, // Trigger when 10% of the element is visible
        rootMargin: "0px 0px -50px 0px" // Offset slightly so it triggers before bottom
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                
                // Add staggered delays if defined in inline styles
                const delay = entry.target.style.getPropertyValue('--delay');
                if (delay) {
                    entry.target.style.transitionDelay = delay;
                }
                
                observer.unobserve(entry.target); // Run animation only once
            }
        });
    }, observerOptions);

    // Select all elements to animate
    document.querySelectorAll('[data-animate]').forEach(el => {
        observer.observe(el);
    });

    // 2. Navbar Glass Effect Enhancement on Scroll
    const nav = document.querySelector('.glass-nav');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            nav.style.background = 'rgba(255, 255, 255, 0.9)';
            nav.style.boxShadow = '0 10px 30px rgba(0,0,0,0.1)';
        } else {
            nav.style.background = 'rgba(255, 255, 255, 0.7)';
            nav.style.boxShadow = '0 4px 20px rgba(0,0,0,0.03)';
        }
    });

    // 3. Smooth Scroll for Anchor Links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});

// --- Pricing Toggle Logic ---
    const toggle = document.getElementById('billing-toggle');
    const amounts = document.querySelectorAll('.amount[data-monthly]');
    const periods = document.querySelectorAll('.period');

    if(toggle) {
        toggle.addEventListener('change', () => {
            const isYearly = toggle.checked;

            amounts.forEach(amount => {
                // If yearly, show yearly price, else show monthly
                amount.textContent = isYearly 
                    ? amount.getAttribute('data-yearly') 
                    : amount.getAttribute('data-monthly');
                
                // Add a cool fade animation effect
                amount.style.opacity = 0;
                setTimeout(() => amount.style.opacity = 1, 200);
            });

            periods.forEach(period => {
                period.textContent = isYearly ? '/yr' : '/mo';
            });
        });
    }