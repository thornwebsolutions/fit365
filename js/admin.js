// Admin Dashboard JavaScript
document.addEventListener('DOMContentLoaded', function() {
    const API_BASE = '/api';
    const TOKEN_KEY = 'fit365_admin_token';

    // Views
    const loginView = document.getElementById('loginView');
    const dashboardView = document.getElementById('dashboardView');

    // Login elements
    const loginForm = document.getElementById('loginForm');
    const loginError = document.getElementById('loginError');
    const passwordInput = document.getElementById('password');

    // Dashboard elements
    const logoutBtn = document.getElementById('logoutBtn');
    const addClassBtn = document.getElementById('addClassBtn');
    const classesTableBody = document.getElementById('classesTableBody');

    // Stats elements
    const statTotalClasses = document.getElementById('statTotalClasses');
    const statActiveClasses = document.getElementById('statActiveClasses');
    const statTotalRsvps = document.getElementById('statTotalRsvps');

    // Class Modal elements
    const classModal = document.getElementById('classModal');
    const classModalTitle = document.getElementById('classModalTitle');
    const classForm = document.getElementById('classForm');
    const classIdInput = document.getElementById('classId');
    const classNameInput = document.getElementById('className');
    const classDateInput = document.getElementById('classDate');
    const classTimeInput = document.getElementById('classTime');
    const classDescriptionInput = document.getElementById('classDescription');
    const classCapacityInput = document.getElementById('classCapacity');
    const classActiveInput = document.getElementById('classActive');
    const closeClassModalBtn = document.getElementById('closeClassModal');
    const cancelClassModalBtn = document.getElementById('cancelClassModal');
    const saveClassBtn = document.getElementById('saveClassBtn');

    // RSVP Modal elements
    const rsvpModal = document.getElementById('rsvpModal');
    const rsvpModalTitle = document.getElementById('rsvpModalTitle');
    const rsvpList = document.getElementById('rsvpList');
    const closeRsvpModalBtn = document.getElementById('closeRsvpModal');
    const closeRsvpModalBtn2 = document.getElementById('closeRsvpModalBtn');

    // Delete Modal elements
    const deleteModal = document.getElementById('deleteModal');
    const closeDeleteModalBtn = document.getElementById('closeDeleteModal');
    const cancelDeleteModalBtn = document.getElementById('cancelDeleteModal');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

    let classToDelete = null;

    // Check if already logged in
    function checkAuth() {
        const token = localStorage.getItem(TOKEN_KEY);
        if (token) {
            showDashboard();
            loadClasses();
        } else {
            showLogin();
        }
    }

    function showLogin() {
        loginView.style.display = 'block';
        dashboardView.style.display = 'none';
    }

    function showDashboard() {
        loginView.style.display = 'none';
        dashboardView.style.display = 'block';
    }

    function getAuthHeaders() {
        const token = localStorage.getItem(TOKEN_KEY);
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };
    }

    // Login handler
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        loginError.classList.remove('visible');

        const password = passwordInput.value;

        try {
            const response = await fetch(`${API_BASE}/admin/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Login failed');
            }

            localStorage.setItem(TOKEN_KEY, data.token);
            passwordInput.value = '';
            showDashboard();
            loadClasses();

        } catch (error) {
            console.error('Login error:', error);
            loginError.classList.add('visible');
        }
    });

    // Logout handler
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem(TOKEN_KEY);
        showLogin();
    });

    // Load classes
    async function loadClasses() {
        try {
            const response = await fetch(`${API_BASE}/admin/classes`, {
                headers: getAuthHeaders()
            });

            if (response.status === 401) {
                localStorage.removeItem(TOKEN_KEY);
                showLogin();
                return;
            }

            const data = await response.json();
            renderClasses(data.classes || []);
            updateStats(data.classes || []);

        } catch (error) {
            console.error('Error loading classes:', error);
            classesTableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="no-data">
                        Failed to load classes. Please try again.
                    </td>
                </tr>
            `;
        }
    }

    function renderClasses(classes) {
        if (classes.length === 0) {
            classesTableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="no-data">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                        <p>No classes yet. Click "Add Class" to create one.</p>
                    </td>
                </tr>
            `;
            return;
        }

        classesTableBody.innerHTML = classes.map(cls => {
            const spotsUsed = cls.capacity - cls.spotsRemaining;
            return `
                <tr>
                    <td><strong>${escapeHtml(cls.name)}</strong></td>
                    <td>${formatDate(cls.date)}</td>
                    <td>${escapeHtml(cls.time)}</td>
                    <td>${spotsUsed} / ${cls.capacity}</td>
                    <td>
                        <span class="status-badge ${cls.isActive ? 'status-badge--active' : 'status-badge--inactive'}">
                            ${cls.isActive ? 'Active' : 'Inactive'}
                        </span>
                    </td>
                    <td>
                        <div class="table-actions">
                            <button class="btn-icon" title="View RSVPs" onclick="viewRsvps('${cls.id}', '${escapeHtml(cls.name)}')">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="9" cy="7" r="4"></circle>
                                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                                </svg>
                            </button>
                            <button class="btn-icon" title="Edit Class" onclick="editClass('${cls.id}')">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                </svg>
                            </button>
                            <button class="btn-icon btn-icon--danger" title="Delete Class" onclick="deleteClass('${cls.id}')">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="3 6 5 6 21 6"></polyline>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                </svg>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    function updateStats(classes) {
        statTotalClasses.textContent = classes.length;
        statActiveClasses.textContent = classes.filter(c => c.isActive).length;
        statTotalRsvps.textContent = classes.reduce((sum, c) => sum + (c.rsvpCount || 0), 0);
    }

    function formatDate(dateStr) {
        const date = new Date(dateStr + 'T00:00:00');
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Class Modal functions
    function openClassModal(isEdit = false) {
        classModalTitle.textContent = isEdit ? 'Edit Class' : 'Add New Class';
        saveClassBtn.textContent = isEdit ? 'Update Class' : 'Save Class';
        classModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeClassModal() {
        classModal.classList.remove('active');
        document.body.style.overflow = '';
        classForm.reset();
        classIdInput.value = '';
    }

    addClassBtn.addEventListener('click', () => {
        classForm.reset();
        classIdInput.value = '';
        classActiveInput.checked = true;
        openClassModal(false);
    });

    closeClassModalBtn.addEventListener('click', closeClassModal);
    cancelClassModalBtn.addEventListener('click', closeClassModal);

    // Save class
    classForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const id = classIdInput.value;
        const isEdit = !!id;

        const classData = {
            name: classNameInput.value.trim(),
            date: classDateInput.value,
            time: classTimeInput.value.trim(),
            description: classDescriptionInput.value.trim(),
            capacity: parseInt(classCapacityInput.value),
            isActive: classActiveInput.checked
        };

        saveClassBtn.disabled = true;
        saveClassBtn.textContent = 'Saving...';

        try {
            const url = isEdit ? `${API_BASE}/admin/class/${id}` : `${API_BASE}/admin/classes`;
            const method = isEdit ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: getAuthHeaders(),
                body: JSON.stringify(classData)
            });

            if (response.status === 401) {
                localStorage.removeItem(TOKEN_KEY);
                showLogin();
                return;
            }

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to save class');
            }

            closeClassModal();
            loadClasses();

        } catch (error) {
            console.error('Save class error:', error);
            alert(error.message);
        } finally {
            saveClassBtn.disabled = false;
            saveClassBtn.textContent = classIdInput.value ? 'Update Class' : 'Save Class';
        }
    });

    // Edit class - global function
    window.editClass = async function(id) {
        try {
            const response = await fetch(`${API_BASE}/admin/class/${id}`, {
                headers: getAuthHeaders()
            });

            if (response.status === 401) {
                localStorage.removeItem(TOKEN_KEY);
                showLogin();
                return;
            }

            const classData = await response.json();

            classIdInput.value = id;
            classNameInput.value = classData.name;
            classDateInput.value = classData.date;
            classTimeInput.value = classData.time;
            classDescriptionInput.value = classData.description || '';
            classCapacityInput.value = classData.capacity;
            classActiveInput.checked = classData.isActive;

            openClassModal(true);

        } catch (error) {
            console.error('Load class error:', error);
            alert('Failed to load class details');
        }
    };

    // View RSVPs - global function
    window.viewRsvps = async function(id, name) {
        rsvpModalTitle.textContent = `RSVPs for ${name}`;
        rsvpList.innerHTML = '<div class="loading-spinner"></div>';
        rsvpModal.classList.add('active');
        document.body.style.overflow = 'hidden';

        try {
            const response = await fetch(`${API_BASE}/admin/class/${id}`, {
                headers: getAuthHeaders()
            });

            if (response.status === 401) {
                localStorage.removeItem(TOKEN_KEY);
                showLogin();
                return;
            }

            const data = await response.json();
            const rsvps = data.rsvps || [];

            if (rsvps.length === 0) {
                rsvpList.innerHTML = '<p style="text-align: center; color: var(--color-text-light);">No RSVPs yet for this class.</p>';
            } else {
                rsvpList.innerHTML = `
                    <h4>${rsvps.length} Registration${rsvps.length !== 1 ? 's' : ''}</h4>
                    ${rsvps.map(rsvp => `
                        <div class="rsvp-item">
                            <div>
                                <span class="rsvp-name">${escapeHtml(rsvp.firstName)} ${escapeHtml(rsvp.lastName)}</span>
                                <br>
                                <span class="rsvp-email">${escapeHtml(rsvp.email)}</span>
                            </div>
                            <span class="rsvp-date">${new Date(rsvp.createdAt).toLocaleDateString()}</span>
                        </div>
                    `).join('')}
                `;
            }

        } catch (error) {
            console.error('Load RSVPs error:', error);
            rsvpList.innerHTML = '<p style="text-align: center; color: var(--color-error);">Failed to load RSVPs</p>';
        }
    };

    function closeRsvpModal() {
        rsvpModal.classList.remove('active');
        document.body.style.overflow = '';
    }

    closeRsvpModalBtn.addEventListener('click', closeRsvpModal);
    closeRsvpModalBtn2.addEventListener('click', closeRsvpModal);

    // Delete class - global function
    window.deleteClass = function(id) {
        classToDelete = id;
        deleteModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    };

    function closeDeleteModal() {
        deleteModal.classList.remove('active');
        document.body.style.overflow = '';
        classToDelete = null;
    }

    closeDeleteModalBtn.addEventListener('click', closeDeleteModal);
    cancelDeleteModalBtn.addEventListener('click', closeDeleteModal);

    confirmDeleteBtn.addEventListener('click', async () => {
        if (!classToDelete) return;

        confirmDeleteBtn.disabled = true;
        confirmDeleteBtn.textContent = 'Deleting...';

        try {
            const response = await fetch(`${API_BASE}/admin/class/${classToDelete}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            if (response.status === 401) {
                localStorage.removeItem(TOKEN_KEY);
                showLogin();
                return;
            }

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to delete class');
            }

            closeDeleteModal();
            loadClasses();

        } catch (error) {
            console.error('Delete class error:', error);
            alert(error.message);
        } finally {
            confirmDeleteBtn.disabled = false;
            confirmDeleteBtn.textContent = 'Delete';
        }
    });

    // Close modals on backdrop click
    [classModal, rsvpModal, deleteModal].forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    });

    // Close modals on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            [classModal, rsvpModal, deleteModal].forEach(modal => {
                if (modal.classList.contains('active')) {
                    modal.classList.remove('active');
                    document.body.style.overflow = '';
                }
            });
        }
    });

    // Initialize
    checkAuth();
});
