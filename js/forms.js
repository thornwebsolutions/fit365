/**
 * FIT365 - Forms JavaScript
 * Handles form validation and submission
 */

(function() {
    'use strict';

    /**
     * Form Validator Class
     */
    class FormValidator {
        constructor(form) {
            this.form = form;
            this.inputs = form.querySelectorAll('input, textarea, select');
            this.successMessage = form.querySelector('.form-success');

            this.init();
        }

        init() {
            // Add submit handler
            this.form.addEventListener('submit', (e) => this.handleSubmit(e));

            // Add real-time validation on blur
            this.inputs.forEach(input => {
                input.addEventListener('blur', () => this.validateField(input));
                input.addEventListener('input', () => this.clearError(input));
            });
        }

        /**
         * Handle form submission
         * @param {Event} e - Submit event
         */
        handleSubmit(e) {
            e.preventDefault();

            let isValid = true;

            // Validate all fields
            this.inputs.forEach(input => {
                if (!this.validateField(input)) {
                    isValid = false;
                }
            });

            if (isValid) {
                this.submitForm();
            } else {
                // Focus first invalid field
                const firstError = this.form.querySelector('.form-group--error input, .form-group--error textarea, .form-group--error select');
                if (firstError) {
                    firstError.focus();
                }
            }
        }

        /**
         * Validate a single field
         * @param {HTMLElement} input - Input element
         * @returns {boolean} - Whether field is valid
         */
        validateField(input) {
            const formGroup = input.closest('.form-group');
            if (!formGroup) return true;

            let isValid = true;
            const value = input.value.trim();

            // Check required
            if (input.hasAttribute('required') && !value) {
                isValid = false;
            }

            // Check email format
            if (input.type === 'email' && value) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(value)) {
                    isValid = false;
                }
            }

            // Check phone format (optional validation)
            if (input.type === 'tel' && value) {
                // Remove common formatting characters
                const cleanPhone = value.replace(/[\s\-\(\)\.]/g, '');
                // Check if it's at least 10 digits
                if (!/^\+?\d{10,}$/.test(cleanPhone)) {
                    // Don't mark as error, phone format can vary
                }
            }

            // Check select has value
            if (input.tagName === 'SELECT' && input.hasAttribute('required') && !value) {
                isValid = false;
            }

            // Update UI
            if (isValid) {
                this.clearError(input);
            } else {
                this.showError(input);
            }

            return isValid;
        }

        /**
         * Show error state on field
         * @param {HTMLElement} input - Input element
         */
        showError(input) {
            const formGroup = input.closest('.form-group');
            if (formGroup) {
                formGroup.classList.add('form-group--error');
            }
        }

        /**
         * Clear error state on field
         * @param {HTMLElement} input - Input element
         */
        clearError(input) {
            const formGroup = input.closest('.form-group');
            if (formGroup) {
                formGroup.classList.remove('form-group--error');
            }
        }

        /**
         * Submit the form (simulated)
         */
        submitForm() {
            // Get form data
            const formData = new FormData(this.form);
            const data = Object.fromEntries(formData);

            // Log data (in production, this would be sent to a server)
            console.log('Form submitted:', data);

            // Show success message
            if (this.successMessage) {
                this.successMessage.classList.add('visible');
            }

            // Reset form
            this.form.reset();

            // Hide success message after delay
            setTimeout(() => {
                if (this.successMessage) {
                    this.successMessage.classList.remove('visible');
                }
            }, 5000);

            // Scroll to success message
            if (this.successMessage) {
                this.successMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }

    /**
     * Initialize form validation
     */
    function init() {
        // Contact form
        const contactForm = document.getElementById('contactForm');
        if (contactForm) {
            new FormValidator(contactForm);
        }

        // Event inquiry form
        const eventForm = document.getElementById('eventInquiryForm');
        if (eventForm) {
            new FormValidator(eventForm);
        }

        // Set minimum date for date inputs (today)
        const dateInputs = document.querySelectorAll('input[type="date"]');
        const today = new Date().toISOString().split('T')[0];
        dateInputs.forEach(input => {
            input.setAttribute('min', today);
        });
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
