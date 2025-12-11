// Header Component
// Renders the navigation header with mobile menu support

(function() {
    function renderHeader() {
        const currentPage = window.location.pathname.split('/').pop().replace('.html', '') || 'index';
        const pageName = currentPage === '' ? 'index' : currentPage;

        const navLinks = [
            { href: '/', label: 'Home', page: 'index' },
            { href: '/about', label: 'About', page: 'about' },
            { href: '/fitness', label: 'Fitness', page: 'fitness' },
            { href: '/events', label: 'Events', page: 'events' },
            { href: '/shop', label: 'Shop', page: 'shop' }
        ];

        const navItems = navLinks.map(link => {
            const isActive = pageName === link.page ? ' nav__link--active' : '';
            return `<li class="nav__item">
                <a href="${link.href}" class="nav__link${isActive}">${link.label}</a>
            </li>`;
        }).join('\n                        ');

        const headerHTML = `
    <header class="header" id="header">
        <div class="container">
            <div class="header__inner">
                <a href="/" class="header__logo">
                    <span class="header__logo-text">FIT.<span class="text-secondary">365</span></span>
                </a>

                <nav class="nav" id="nav">
                    <ul class="nav__list">
                        ${navItems}
                    </ul>
                </nav>

                <div class="header__actions">
                    <a href="/contact" class="btn btn--primary nav__cta">Join Now</a>
                    <button class="nav__cart" aria-label="Shopping cart">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="9" cy="21" r="1"/>
                            <circle cx="20" cy="21" r="1"/>
                            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                        </svg>
                        <span class="nav__cart-count">0</span>
                    </button>
                    <button class="mobile-menu-toggle" id="mobileMenuToggle" aria-label="Toggle menu" aria-expanded="false">
                        <span class="mobile-menu-toggle__bar"></span>
                        <span class="mobile-menu-toggle__bar"></span>
                        <span class="mobile-menu-toggle__bar"></span>
                    </button>
                </div>
            </div>
        </div>
        <div class="mobile-menu-overlay" id="mobileMenuOverlay"></div>
    </header>`;

        const headerContainer = document.getElementById('header-container');
        if (headerContainer) {
            headerContainer.innerHTML = headerHTML;
            // Dispatch event to notify navigation.js that header is ready
            document.dispatchEvent(new CustomEvent('headerRendered'));
        }
    }

    // Run when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', renderHeader);
    } else {
        renderHeader();
    }
})();
