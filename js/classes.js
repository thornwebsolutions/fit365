// Classes Page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    const API_BASE = '/api';

    // DOM Elements
    const classesLoading = document.getElementById('classesLoading');
    const classesEmpty = document.getElementById('classesEmpty');
    const classesGrid = document.getElementById('classesGrid');
    const rsvpModal = document.getElementById('rsvpModal');
    const modalOverlay = document.getElementById('modalOverlay');
    const rsvpForm = document.getElementById('rsvpForm');
    const rsvpSuccess = document.getElementById('rsvpSuccess');
    const rsvpError = document.getElementById('rsvpError');
    const closeModalBtn = document.getElementById('modalClose');
    const modalClassName = document.getElementById('modalClassName');
    const modalClassDate = document.getElementById('modalClassDate');
    const classIdInput = document.getElementById('rsvpClassId');
    const rsvpErrorMessage = document.getElementById('rsvpErrorMessage');
    const submitBtn = document.getElementById('rsvpSubmitBtn');
    const submitText = document.getElementById('rsvpSubmitText');
    const submitLoading = document.getElementById('rsvpSubmitLoading');
    const rsvpCloseSuccess = document.getElementById('rsvpCloseSuccess');
    const rsvpRetry = document.getElementById('rsvpRetry');

    let currentClassId = null;

    // Fetch and display classes
    async function loadClasses() {
        try {
            showLoading();

            const response = await fetch(`${API_BASE}/classes`);
            if (!response.ok) {
                throw new Error('Failed to fetch classes');
            }

            const data = await response.json();

            if (!data.classes || data.classes.length === 0) {
                showEmpty();
                return;
            }

            renderClasses(data.classes);

        } catch (error) {
            console.error('Error loading classes:', error);
            showEmpty();
        }
    }

    function showLoading() {
        classesLoading.style.display = 'block';
        classesEmpty.style.display = 'none';
        classesGrid.style.display = 'none';
    }

    function showEmpty() {
        classesLoading.style.display = 'none';
        classesEmpty.style.display = 'block';
        classesGrid.style.display = 'none';
    }

    function showGrid() {
        classesLoading.style.display = 'none';
        classesEmpty.style.display = 'none';
        classesGrid.style.display = 'grid';
    }

    function renderClasses(classes) {
        classesGrid.innerHTML = '';

        classes.forEach(classItem => {
            const card = createClassCard(classItem);
            classesGrid.appendChild(card);
        });

        showGrid();
    }

    function createClassCard(classItem) {
        const card = document.createElement('div');
        card.className = 'class-card';

        const isFull = classItem.spotsRemaining <= 0;
        const spotsText = isFull ? 'Class Full' : `${classItem.spotsRemaining} spots remaining`;
        const spotsClass = isFull ? 'spots-full' : (classItem.spotsRemaining <= 3 ? 'spots-low' : '');

        // Format date nicely
        const dateObj = new Date(classItem.date + 'T00:00:00');
        const formattedDate = dateObj.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        card.innerHTML = `
            <div class="class-card-header">
                <h3 class="class-card-title">${escapeHtml(classItem.name)}</h3>
                <span class="class-spots ${spotsClass}">${spotsText}</span>
            </div>
            <div class="class-card-body">
                <div class="class-info">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                    <span>${formattedDate}</span>
                </div>
                <div class="class-info">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    <span>${escapeHtml(classItem.time)}</span>
                </div>
                ${classItem.description ? `<p class="class-description">${escapeHtml(classItem.description)}</p>` : ''}
            </div>
            <div class="class-card-footer">
                <button class="btn btn--primary rsvp-btn" ${isFull ? 'disabled' : ''}>
                    ${isFull ? 'Class Full' : 'RSVP Now'}
                </button>
            </div>
        `;

        // Add click handler for RSVP button
        const rsvpBtn = card.querySelector('.rsvp-btn');
        if (!isFull) {
            rsvpBtn.addEventListener('click', () => openRsvpModal(classItem, formattedDate));
        }

        return card;
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Modal functions
    function openRsvpModal(classItem, formattedDate) {
        currentClassId = classItem.id;
        classIdInput.value = classItem.id;
        modalClassName.textContent = classItem.name;
        modalClassDate.textContent = `${formattedDate} at ${classItem.time}`;

        // Reset form and show form
        rsvpForm.reset();
        rsvpForm.style.display = 'block';
        rsvpSuccess.style.display = 'none';
        rsvpError.style.display = 'none';
        submitBtn.disabled = false;
        submitText.style.display = 'inline';
        submitLoading.style.display = 'none';

        rsvpModal.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Focus first input
        document.getElementById('rsvpFirstName').focus();
    }

    function closeModal() {
        rsvpModal.classList.remove('active');
        document.body.style.overflow = '';
        currentClassId = null;
    }

    // Handle RSVP form submission
    async function handleRsvpSubmit(e) {
        e.preventDefault();

        const firstName = document.getElementById('rsvpFirstName').value.trim();
        const lastName = document.getElementById('rsvpLastName').value.trim();
        const email = document.getElementById('rsvpEmail').value.trim();
        const classId = classIdInput.value;

        // Validate
        if (!firstName || !lastName || !email) {
            showError('Please fill in all fields');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showError('Please enter a valid email address');
            return;
        }

        // Submit
        submitBtn.disabled = true;
        submitText.style.display = 'none';
        submitLoading.style.display = 'inline';

        try {
            const response = await fetch(`${API_BASE}/rsvp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    firstName,
                    lastName,
                    email,
                    classId
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to submit RSVP');
            }

            // Show success
            rsvpForm.style.display = 'none';
            rsvpSuccess.style.display = 'block';

            // Reload classes after a delay to show updated spots
            setTimeout(() => {
                loadClasses();
            }, 2000);

        } catch (error) {
            console.error('RSVP error:', error);
            showError(error.message || 'Failed to submit RSVP. Please try again.');
        }
    }

    function showError(message) {
        rsvpErrorMessage.textContent = message;
        rsvpForm.style.display = 'none';
        rsvpError.style.display = 'block';
    }

    function showForm() {
        rsvpForm.style.display = 'block';
        rsvpError.style.display = 'none';
        submitBtn.disabled = false;
        submitText.style.display = 'inline';
        submitLoading.style.display = 'none';
    }

    // Event listeners
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeModal);
    }

    if (modalOverlay) {
        modalOverlay.addEventListener('click', closeModal);
    }

    if (rsvpForm) {
        rsvpForm.addEventListener('submit', handleRsvpSubmit);
    }

    if (rsvpCloseSuccess) {
        rsvpCloseSuccess.addEventListener('click', closeModal);
    }

    if (rsvpRetry) {
        rsvpRetry.addEventListener('click', showForm);
    }

    // Close on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && rsvpModal && rsvpModal.classList.contains('active')) {
            closeModal();
        }
    });

    // Initialize
    loadClasses();
});
