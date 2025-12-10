/**
 * FIT365 - Navigation JavaScript
 * Handles mobile menu, sticky header, and smooth scrolling
 */

(function() {
    'use strict';

    // DOM Elements - declared here, assigned in init() after header is rendered
    let header;
    let nav;
    let mobileMenuToggle;
    let mobileMenuOverlay;
    let navLinks;

    // State
    let isMenuOpen = false;
    let lastScrollY = 0;

    /**
     * Initialize navigation functionality
     */
    function init() {
        // Get DOM elements NOW, after header has been rendered
        header = document.getElementById('header');
        nav = document.getElementById('nav');
        mobileMenuToggle = document.getElementById('mobileMenuToggle');
        mobileMenuOverlay = document.getElementById('mobileMenuOverlay');
        navLinks = document.querySelectorAll('.nav__link');

        if (mobileMenuToggle) {
            mobileMenuToggle.addEventListener('click', toggleMobileMenu);
        }

        if (mobileMenuOverlay) {
            mobileMenuOverlay.addEventListener('click', closeMobileMenu);
        }

        // Close menu when clicking nav links
        navLinks.forEach(link => {
            link.addEventListener('click', closeMobileMenu);
        });

        // Handle scroll events
        window.addEventListener('scroll', handleScroll, { passive: true });

        // Handle smooth scroll for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', handleSmoothScroll);
        });

        // Handle escape key to close menu
        document.addEventListener('keydown', handleKeyDown);

        // Handle resize
        window.addEventListener('resize', handleResize);

        // Initial header state
        handleScroll();
    }

    /**
     * Toggle mobile menu open/closed
     */
    function toggleMobileMenu() {
        isMenuOpen = !isMenuOpen;
        updateMenuState();
    }

    /**
     * Close mobile menu
     */
    function closeMobileMenu() {
        if (isMenuOpen) {
            isMenuOpen = false;
            updateMenuState();
        }
    }

    /**
     * Open mobile menu
     */
    function openMobileMenu() {
        isMenuOpen = true;
        updateMenuState();
    }

    /**
     * Update menu state in DOM
     */
    function updateMenuState() {
        if (mobileMenuToggle) {
            mobileMenuToggle.classList.toggle('active', isMenuOpen);
            mobileMenuToggle.setAttribute('aria-expanded', isMenuOpen);
        }

        if (nav) {
            nav.classList.toggle('active', isMenuOpen);
        }

        if (mobileMenuOverlay) {
            mobileMenuOverlay.classList.toggle('active', isMenuOpen);
        }

        // Prevent body scroll when menu is open
        document.body.style.overflow = isMenuOpen ? 'hidden' : '';
    }

    /**
     * Handle scroll events for sticky header
     */
    function handleScroll() {
        const currentScrollY = window.scrollY;

        // Add scrolled class when scrolled past threshold
        if (header) {
            if (currentScrollY > 50) {
                if (!header.classList.contains('scrolled')) {
                    // Add padding to body to prevent content jump
                    document.body.style.paddingTop = header.offsetHeight + 'px';
                    header.classList.add('scrolled');
                }
            } else {
                if (header.classList.contains('scrolled')) {
                    // Remove padding when header returns to static
                    document.body.style.paddingTop = '';
                    header.classList.remove('scrolled');
                }
            }
        }

        lastScrollY = currentScrollY;
    }

    /**
     * Handle smooth scrolling for anchor links
     * @param {Event} e - Click event
     */
    function handleSmoothScroll(e) {
        const href = e.currentTarget.getAttribute('href');

        // Only handle same-page anchors
        if (href.startsWith('#') && href.length > 1) {
            const targetId = href.substring(1);
            const targetElement = document.getElementById(targetId);

            if (targetElement) {
                e.preventDefault();

                // Close mobile menu if open
                closeMobileMenu();

                // Calculate offset for fixed header
                const headerHeight = header ? header.offsetHeight : 0;
                const targetPosition = targetElement.getBoundingClientRect().top + window.scrollY - headerHeight;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });

                // Update URL without scrolling
                history.pushState(null, null, href);
            }
        }
    }

    /**
     * Handle keyboard events
     * @param {KeyboardEvent} e - Keyboard event
     */
    function handleKeyDown(e) {
        // Close menu on Escape key
        if (e.key === 'Escape' && isMenuOpen) {
            closeMobileMenu();
        }
    }

    /**
     * Handle window resize
     */
    function handleResize() {
        // Close mobile menu on larger screens
        if (window.innerWidth > 991 && isMenuOpen) {
            closeMobileMenu();
        }
    }

    // Initialize when header is rendered (since header is dynamically injected)
    document.addEventListener('headerRendered', init);

    // Fallback: also try on DOMContentLoaded in case header is already rendered
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            // Only init if header exists (means headerRendered already fired)
            if (document.getElementById('header')) {
                init();
            }
        });
    }
})();
