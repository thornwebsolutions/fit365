/**
 * FIT365 - Main JavaScript
 * Handles testimonials, accordion, and scroll animations
 */

(function() {
    'use strict';

    /**
     * Testimonial Slider
     */
    class TestimonialSlider {
        constructor(element) {
            this.slider = element;
            this.track = element.querySelector('.testimonial-slider__track');
            this.slides = element.querySelectorAll('.testimonial-slider__slide');
            this.dots = element.querySelectorAll('.testimonial-slider__dot');
            this.currentIndex = 0;
            this.autoPlayInterval = null;
            this.autoPlayDelay = 5000;

            if (this.slides.length > 0) {
                this.init();
            }
        }

        init() {
            // Set up dot navigation
            this.dots.forEach((dot, index) => {
                dot.addEventListener('click', () => this.goToSlide(index));
            });

            // Start autoplay
            this.startAutoPlay();

            // Pause on hover
            this.slider.addEventListener('mouseenter', () => this.stopAutoPlay());
            this.slider.addEventListener('mouseleave', () => this.startAutoPlay());

            // Touch support
            this.setupTouchSupport();
        }

        goToSlide(index) {
            this.currentIndex = index;
            this.updateSlider();
        }

        nextSlide() {
            this.currentIndex = (this.currentIndex + 1) % this.slides.length;
            this.updateSlider();
        }

        prevSlide() {
            this.currentIndex = (this.currentIndex - 1 + this.slides.length) % this.slides.length;
            this.updateSlider();
        }

        updateSlider() {
            // Update track position
            if (this.track) {
                this.track.style.transform = `translateX(-${this.currentIndex * 100}%)`;
            }

            // Update dots
            this.dots.forEach((dot, index) => {
                dot.classList.toggle('active', index === this.currentIndex);
            });
        }

        startAutoPlay() {
            this.stopAutoPlay();
            this.autoPlayInterval = setInterval(() => this.nextSlide(), this.autoPlayDelay);
        }

        stopAutoPlay() {
            if (this.autoPlayInterval) {
                clearInterval(this.autoPlayInterval);
                this.autoPlayInterval = null;
            }
        }

        setupTouchSupport() {
            let startX = 0;
            let endX = 0;

            this.slider.addEventListener('touchstart', (e) => {
                startX = e.touches[0].clientX;
            }, { passive: true });

            this.slider.addEventListener('touchend', (e) => {
                endX = e.changedTouches[0].clientX;
                const diff = startX - endX;

                if (Math.abs(diff) > 50) {
                    if (diff > 0) {
                        this.nextSlide();
                    } else {
                        this.prevSlide();
                    }
                }
            }, { passive: true });
        }
    }

    /**
     * FAQ Accordion
     */
    class Accordion {
        constructor(element) {
            this.accordion = element;
            this.items = element.querySelectorAll('.accordion__item');

            if (this.items.length > 0) {
                this.init();
            }
        }

        init() {
            this.items.forEach(item => {
                const header = item.querySelector('.accordion__header');
                const content = item.querySelector('.accordion__content');

                if (header && content) {
                    header.addEventListener('click', () => this.toggle(item));
                }
            });
        }

        toggle(item) {
            const isActive = item.classList.contains('active');
            const content = item.querySelector('.accordion__content');
            const body = content.querySelector('.accordion__body');
            const header = item.querySelector('.accordion__header');

            // Close all other items
            this.items.forEach(otherItem => {
                if (otherItem !== item && otherItem.classList.contains('active')) {
                    this.close(otherItem);
                }
            });

            if (isActive) {
                this.close(item);
            } else {
                this.open(item);
            }
        }

        open(item) {
            const content = item.querySelector('.accordion__content');
            const body = content.querySelector('.accordion__body');
            const header = item.querySelector('.accordion__header');

            item.classList.add('active');
            content.style.maxHeight = body.offsetHeight + 'px';
            header.setAttribute('aria-expanded', 'true');
        }

        close(item) {
            const content = item.querySelector('.accordion__content');
            const header = item.querySelector('.accordion__header');

            item.classList.remove('active');
            content.style.maxHeight = '0';
            header.setAttribute('aria-expanded', 'false');
        }
    }

    /**
     * Scroll Animation Observer
     */
    class ScrollAnimator {
        constructor() {
            this.elements = document.querySelectorAll('.fade-in');
            this.observer = null;

            if (this.elements.length > 0) {
                this.init();
            }
        }

        init() {
            // Check for reduced motion preference
            if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                // Show all elements immediately
                this.elements.forEach(el => el.classList.add('visible'));
                return;
            }

            // Set up Intersection Observer
            this.observer = new IntersectionObserver(
                (entries) => this.handleIntersection(entries),
                {
                    root: null,
                    rootMargin: '0px 0px -50px 0px',
                    threshold: 0.1
                }
            );

            this.elements.forEach(el => this.observer.observe(el));
        }

        handleIntersection(entries) {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    this.observer.unobserve(entry.target);
                }
            });
        }
    }

    /**
     * Image Lazy Loading
     */
    class LazyLoader {
        constructor() {
            this.images = document.querySelectorAll('img[data-src]');
            this.observer = null;

            if (this.images.length > 0) {
                this.init();
            }
        }

        init() {
            if ('IntersectionObserver' in window) {
                this.observer = new IntersectionObserver(
                    (entries) => this.handleIntersection(entries),
                    {
                        rootMargin: '50px 0px',
                        threshold: 0.01
                    }
                );

                this.images.forEach(img => this.observer.observe(img));
            } else {
                // Fallback for older browsers
                this.loadAll();
            }
        }

        handleIntersection(entries) {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.loadImage(entry.target);
                    this.observer.unobserve(entry.target);
                }
            });
        }

        loadImage(img) {
            const src = img.getAttribute('data-src');
            if (src) {
                img.src = src;
                img.removeAttribute('data-src');
            }
        }

        loadAll() {
            this.images.forEach(img => this.loadImage(img));
        }
    }

    /**
     * Current Year for Copyright
     */
    function updateCopyrightYear() {
        const yearElements = document.querySelectorAll('[data-year]');
        const currentYear = new Date().getFullYear();

        yearElements.forEach(el => {
            el.textContent = currentYear;
        });
    }

    /**
     * Initialize all components
     */
    function init() {
        // Initialize testimonial sliders
        const testimonialSliders = document.querySelectorAll('.testimonial-slider');
        testimonialSliders.forEach(slider => new TestimonialSlider(slider));

        // Initialize accordions
        const accordions = document.querySelectorAll('.accordion');
        accordions.forEach(accordion => new Accordion(accordion));

        // Initialize scroll animations
        new ScrollAnimator();

        // Initialize lazy loading
        new LazyLoader();

        // Update copyright year
        updateCopyrightYear();
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
