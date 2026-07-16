const AUTH_KEY = 'easyNoteUsers';
const SESSION_KEY = 'easyNoteSession';
const SPLASH_DURATION = 2500;

class AuthManager {
    constructor(onLogin) {
        this.onLogin = onLogin;
        this.users = JSON.parse(localStorage.getItem(AUTH_KEY)) || {};

        // Usuario demo
        if (!this.users['admin']) {
            this.users['admin'] = { password: '1234', createdAt: new Date().toISOString() };
            localStorage.setItem(AUTH_KEY, JSON.stringify(this.users));
        }
    }

    validateUser(username, password) {
        const user = this.users[username.toLowerCase().trim()];
        return user && user.password === password;
    }

    registerUser(username, password) {
        const key = username.toLowerCase().trim();
        if (!key || password.length < 4) return { success: false, message: 'Datos inválidos' };
        if (this.users[key]) return { success: false, message: 'El usuario ya existe' };

        this.users[key] = {
            password,
            createdAt: new Date().toISOString()
        };
        localStorage.setItem(AUTH_KEY, JSON.stringify(this.users));
        return { success: true, message: 'Cuenta creada' };
    }

    getSession() {
        try {
            return JSON.parse(localStorage.getItem(SESSION_KEY));
        } catch {
            return null;
        }
    }

    saveSession(username) {
        localStorage.setItem(SESSION_KEY, JSON.stringify({
            username: username.toLowerCase().trim(),
            loggedInAt: new Date().toISOString()
        }));
    }

    clearSession() {
        localStorage.removeItem(SESSION_KEY);
    }
}

class EasyNote {
    constructor() {
        this.auth = new AuthManager((user) => this.startApp(user));

        this.notes = [];
        this.activeNoteId = null;
        this.searchTerm = '';
        this.theme = 'light';
        this.currentUser = null;

        this.initElements();
        this.initEventListeners();
        this.startSplash();
    }

    initElements() {
        // Splash
        this.splash = document.getElementById('splash');

        // Auth
        this.loginScreen = document.getElementById('loginScreen');
        this.loginForm = document.getElementById('loginForm');
        this.loginUser = document.getElementById('loginUser');
        this.loginPass = document.getElementById('loginPass');
        this.btnRegister = document.getElementById('btnRegister');
        this.registerModal = document.getElementById('registerModal');
        this.registerForm = document.getElementById('registerForm');
        this.regUser = document.getElementById('regUser');
        this.regPass = document.getElementById('regPass');
        this.btnCancelRegister = document.getElementById('btnCancelRegister');

        // App
        this.application = document.getElementById('application');
        this.notesList = document.getElementById('notesList');
        this.searchInput = document.getElementById('searchInput');
        this.btnNew = document.getElementById('btnNew');
        this.btnTheme = document.getElementById('btnTheme');
        this.themeIcon = document.getElementById('themeIcon');
        this.btnDelete = document.getElementById('btnDelete');
        this.btnCopy = document.getElementById('btnCopy');
        this.btnLogout = document.getElementById('btnLogout');
        this.noteTitle = document.getElementById('noteTitle');
        this.noteBody = document.getElementById('noteBody');
        this.noteEditor = document.getElementById('noteEditor');
        this.emptyState = document.getElementById('emptyState');
        this.toast = document.getElementById('toast');
        this.userAvatar = document.getElementById('userAvatar');
        this.userName = document.getElementById('userName');
        this.noteDate = document.getElementById('noteDate');
    }

    initEventListeners() {
        // Auth
        this.loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        this.btnRegister.addEventListener('click', () => this.openRegisterModal());
        this.btnCancelRegister.addEventListener('click', () => this.closeRegisterModal());
        this.registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegister();
        });

        // App
        this.btnNew.addEventListener('click', () => this.createNote());
        this.btnTheme.addEventListener('click', () => this.toggleTheme());
        this.btnDelete.addEventListener('click', () => this.deleteActiveNote());
        this.btnCopy.addEventListener('click', () => this.copyNoteContent());
        this.btnLogout.addEventListener('click', () => this.logout());

        this.searchInput.addEventListener('input', (e) => {
            this.searchTerm = e.target.value.toLowerCase().trim();
            this.renderNotesList();
        });

        this.noteTitle.addEventListener('input', () => this.saveCurrentNote());
        this.noteBody.addEventListener('input', () => this.saveCurrentNote());

        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
                e.preventDefault();
                this.createNote();
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
                e.preventDefault();
                this.deleteActiveNote();
            }
        });
    }

    /* ---------- Splash & Auth flow ---------- */

    startSplash() {
        const session = this.auth.getSession();

        setTimeout(() => {
            this.splash.classList.add('hidden');

            if (session && session.username) {
                this.startApp(session.username);
            } else {
                this.showLogin();
            }
        }, SPLASH_DURATION);
    }

    showLogin() {
        this.loginScreen.classList.remove('hidden');
        this.application.classList.add('hidden');
        setTimeout(() => this.loginUser.focus(), 100);
    }

    handleLogin() {
        const username = this.loginUser.value.trim();
        const password = this.loginPass.value;

        if (this.auth.validateUser(username, password)) {
            this.auth.saveSession(username);
            this.loginScreen.classList.add('hidden');
            this.startApp(username);
            this.loginUser.value = '';
            this.loginPass.value = '';
        } else {
            this.shakeElement(this.loginForm);
            this.showToast('Usuario o contraseña incorrectos');
        }
    }

    handleRegister() {
        const username = this.regUser.value.trim();
        const password = this.regPass.value;

        const result = this.auth.registerUser(username, password);
        if (result.success) {
            this.closeRegisterModal();
            this.showToast(result.message);
            this.regUser.value = '';
            this.regPass.value = '';
        } else {
            this.shakeElement(this.registerForm);
            this.showToast(result.message);
        }
    }

    openRegisterModal() {
        this.registerModal.classList.remove('hidden');
        setTimeout(() => this.regUser.focus(), 100);
    }

    closeRegisterModal() {
        this.registerModal.classList.add('hidden');
    }

    startApp(username) {
        this.currentUser = username.toLowerCase().trim();
        this.loadUserData();
        this.applyTheme();
        this.updateUserInfo();

        this.application.classList.remove('hidden');
        this.renderNotesList(true, true);
        this.updateEmptyState();
    }

    logout() {
        this.auth.clearSession();
        this.application.classList.add('hidden');
        this.currentUser = null;
        this.notes = [];
        this.activeNoteId = null;
        this.searchTerm = '';
        this.searchInput.value = '';
        this.noteTitle.value = '';
        this.noteBody.value = '';
        this.showLogin();
        this.showToast('Sesión cerrada');
    }

    updateUserInfo() {
        if (!this.currentUser) return;
        this.userName.textContent = this.currentUser;
        this.userAvatar.textContent = this.currentUser.charAt(0).toUpperCase();
    }

    shakeElement(element) {
        element.animate([
            { transform: 'translateX(0)' },
            { transform: 'translateX(-6px)' },
            { transform: 'translateX(6px)' },
            { transform: 'translateX(-6px)' },
            { transform: 'translateX(6px)' },
            { transform: 'translateX(0)' }
        ], {
            duration: 350,
            easing: 'ease-in-out'
        });
    }

    /* ---------- Notas ---------- */

    loadUserData() {
        const data = JSON.parse(localStorage.getItem(`easyNotes_${this.currentUser}`)) || {};
        this.notes = data.notes || [];
        this.theme = data.theme || 'light';
    }

    saveUserData() {
        if (!this.currentUser) return;
        localStorage.setItem(`easyNotes_${this.currentUser}`, JSON.stringify({
            notes: this.notes,
            theme: this.theme
        }));
    }

    createNote() {
        const note = {
            id: Date.now().toString(),
            title: '',
            body: '',
            updatedAt: new Date().toISOString()
        };

        this.notes.unshift(note);
        this.activeNoteId = note.id;
        this.searchTerm = '';
        this.searchInput.value = '';
        this.saveUserData();
        this.renderNotesList(true, true);
        this.loadNote(note.id);
        this.noteTitle.focus();
    }

    loadNote(id) {
        const note = this.notes.find(n => n.id === id);
        if (!note) return;

        this.activeNoteId = id;
        this.noteTitle.value = note.title;
        this.noteBody.value = note.body;
        this.updateNoteDate(note.updatedAt);

        const editorVisible = !this.noteEditor.classList.contains('hidden');

        this.noteEditor.classList.remove('hidden');
        this.emptyState.style.display = 'none';

        this.notesList.querySelectorAll('.note-item').forEach(item => {
            item.classList.toggle('active', item.dataset.id === id);
        });

        if (editorVisible && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            this.noteEditor.animate(
                [{ opacity: 0.3 }, { opacity: 1 }],
                { duration: 220, easing: 'ease-out' }
            );
        }
    }

    saveCurrentNote() {
        if (!this.activeNoteId) return;

        const note = this.notes.find(n => n.id === this.activeNoteId);
        if (!note) return;

        note.title = this.noteTitle.value.trim();
        note.body = this.noteBody.value;
        note.updatedAt = new Date().toISOString();

        this.notes = [note, ...this.notes.filter(n => n.id !== this.activeNoteId)];

        this.saveUserData();
        this.renderNotesList(false);
        this.updateNoteDate(note.updatedAt);
    }

    deleteActiveNote() {
        if (!this.activeNoteId) return;

        const note = this.notes.find(n => n.id === this.activeNoteId);
        const title = note?.title || 'esta nota';

        if (!confirm(`¿Eliminar "${title}"?`)) return;

        this.notes = this.notes.filter(n => n.id !== this.activeNoteId);
        this.activeNoteId = null;
        this.saveUserData();
        this.renderNotesList();
        this.updateEmptyState();
        this.showToast('Nota eliminada');
    }

    copyNoteContent() {
        if (!this.activeNoteId) return;
        const note = this.notes.find(n => n.id === this.activeNoteId);
        if (!note) return;

        const text = `${note.title}\n\n${note.body}`.trim();
        navigator.clipboard.writeText(text).then(() => {
            this.showToast('Contenido copiado');
        }).catch(() => {
            this.showToast('No se pudo copiar');
        });
    }

    getFilteredNotes() {
        if (!this.searchTerm) return this.notes;

        return this.notes.filter(note =>
            note.title.toLowerCase().includes(this.searchTerm) ||
            note.body.toLowerCase().includes(this.searchTerm)
        );
    }

    renderNotesList(keepScroll = true, animate = false) {
        const filtered = this.getFilteredNotes();
        const scrollTop = this.notesList.scrollTop;

        this.notesList.classList.toggle('notes-list--animate', animate);

        if (filtered.length === 0) {
            this.notesList.innerHTML = `
                <div style="padding: 30px 10px; text-align: center;">
                    <p style="font-size: 13px; color: var(--text-soft);">
                        ${this.searchTerm ? 'No se encontraron notas' : 'No hay notas'}
                    </p>
                </div>
            `;
            return;
        }

        this.notesList.innerHTML = filtered.map((note, index) => {
            const title = note.title || 'Sin título';
            const preview = note.body || 'Sin contenido';
            const isActive = note.id === this.activeNoteId;
            const delay = animate ? ` style="animation-delay: ${Math.min(index * 40, 320)}ms"` : '';

            return `
                <div class="note-item ${isActive ? 'active' : ''}" data-id="${note.id}"${delay}>
                    <div class="note-item-title">${this.escapeHtml(title)}</div>
                    <div class="note-item-preview">${this.escapeHtml(preview)}</div>
                </div>
            `;
        }).join('');

        this.notesList.querySelectorAll('.note-item').forEach(item => {
            item.addEventListener('click', () => {
                this.loadNote(item.dataset.id);
            });
        });

        if (keepScroll) {
            this.notesList.scrollTop = scrollTop;
        }
    }

    updateEmptyState() {
        if (this.notes.length === 0) {
            this.noteEditor.classList.add('hidden');
            this.emptyState.style.display = 'flex';
            this.noteTitle.value = '';
            this.noteBody.value = '';
            this.noteDate.textContent = '';
        } else if (!this.activeNoteId) {
            this.noteEditor.classList.add('hidden');
            this.emptyState.style.display = 'flex';
        }
    }

    updateNoteDate(isoDate) {
        if (!isoDate) {
            this.noteDate.textContent = '';
            return;
        }
        const date = new Date(isoDate);
        this.noteDate.textContent = `Guardada ${date.toLocaleString('es-ES', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        })}`;
    }

    /* ---------- Tema ---------- */

    toggleTheme() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        this.applyTheme();
        this.saveUserData();
    }

    applyTheme() {
        document.documentElement.setAttribute('data-theme', this.theme);
        this.themeIcon.textContent = this.theme === 'light' ? '☾' : '☀';
    }

    /* ---------- Utilidades ---------- */

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showToast(message) {
        this.toast.textContent = message;
        this.toast.classList.add('show');

        if (this.toastTimeout) clearTimeout(this.toastTimeout);
        this.toastTimeout = setTimeout(() => {
            this.toast.classList.remove('show');
        }, 2200);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new EasyNote();
});
