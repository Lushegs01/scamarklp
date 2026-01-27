document.addEventListener('DOMContentLoaded', () => {
    
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