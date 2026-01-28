document.addEventListener('DOMContentLoaded', () => {
    // --- 3. Pricing Toggle Logic ---
    // --- Mobile Menu Toggle (Fixed) ---
    const mobileBtn = document.querySelector('.mobile-toggle');
    const navLinks = document.querySelector('.nav-links');
    const navActions = document.querySelector('.nav-actions');

    if (mobileBtn) {
        mobileBtn.addEventListener('click', () => {
            // Toggle both lists
            navLinks.classList.toggle('active');
            navActions.classList.toggle('active');

            // Toggle Body Scroll (Prevents background scrolling when menu is open)
            document.body.style.overflow = navLinks.classList.contains('active') ? 'hidden' : 'auto';

            // Hamburger Animation
            const spans = mobileBtn.querySelectorAll('span');
            if (navLinks.classList.contains('active')) {
                spans[0].style.transform = 'rotate(45deg) translate(6px, 6px)';
                spans[1].style.transform = 'rotate(-45deg) translate(6px, -6px)';
            } else {
                spans[0].style.transform = 'none';
                spans[1].style.transform = 'none';
            }
        });

        // Close menu when a link is clicked
        const allLinks = document.querySelectorAll('.nav-links a');
        allLinks.forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
                navActions.classList.remove('active');
                document.body.style.overflow = 'auto';

                // Reset hamburger
                const spans = mobileBtn.querySelectorAll('span');
                spans[0].style.transform = 'none';
                spans[1].style.transform = 'none';
            });
        });
    }
    const billingToggle = document.getElementById('billing-toggle');
    const amounts = document.querySelectorAll('.amount');

    if (billingToggle) {
        billingToggle.addEventListener('change', function () {
            const isYearly = this.checked;

            amounts.forEach(amount => {
                // The code checks for these two attributes before doing anything
                if (amount.hasAttribute('data-monthly') && amount.hasAttribute('data-yearly')) {

                    amount.style.transform = 'translateY(-10px)';
                    amount.style.opacity = 0;

                    setTimeout(() => {
                        if (isYearly) {
                            amount.textContent = amount.getAttribute('data-yearly');
                            const period = amount.nextElementSibling;
                            if (period) period.textContent = '/yr';
                        } else {
                            amount.textContent = amount.getAttribute('data-monthly');
                            const period = amount.nextElementSibling;
                            if (period) period.textContent = '/mo';
                        }
                        amount.style.transform = 'translateY(0)';
                        amount.style.opacity = 1;
                    }, 200);
                }
            });

            // Toggle Labels (Visual feedback for the text "Monthly/Yearly")
            const labels = document.querySelectorAll('.toggle-label');
            if (labels.length > 1) {
                if (isYearly) {
                    labels[0].classList.remove('active');
                    labels[1].classList.add('active');
                } else {
                    labels[0].classList.add('active');
                    labels[1].classList.remove('active');
                }
            }
        });
    }

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

// --- FAQ Toggle ---
const faqItems = document.querySelectorAll('.faq-item');

faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    question.addEventListener('click', () => {
        // Close others (optional - makes it an accordion)
        faqItems.forEach(otherItem => {
            if (otherItem !== item) otherItem.classList.remove('active');
        });

        // Toggle current
        item.classList.toggle('active');
    });
});